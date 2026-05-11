const { app } = require("@azure/functions");
const { WebPubSubServiceClient } = require("@azure/web-pubsub");
const { usersContainer } = require("./utils/cosmosClient");
const { verifyToken } = require("./utils/authMiddleware");

app.http("broadcastPresence", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "presence/broadcast",
  handler: async (req, context) => {
    try {
      const user = await verifyToken(req);
      const { online } = await req.json();

      context.log(`Presence update: ${user.oid} is ${online ? 'online' : 'offline'}`);

      // Update user's online status in database
      try {
        const { resources: users } = await usersContainer.items.query({
          query: "SELECT * FROM c WHERE c.userId = @uid",
          parameters: [{ name: "@uid", value: user.oid }],
        }).fetchAll();

        if (users.length > 0) {
          const userDoc = users[0];
          userDoc.online = online;
          userDoc.lastSeen = new Date().toISOString();

          await usersContainer.item(userDoc.id, "users").replace(userDoc);
        }
      } catch (err) {
        context.log("Database update error:", err.message);
      }

      // Broadcast presence to all connected clients
      try {
        const pubSubClient = new WebPubSubServiceClient(
          process.env.PUBSUB_CONNECTION,
          process.env.PUBSUB_HUB
        );

        await pubSubClient.sendToAll({
          type: "presence",
          userId: user.oid,
          online: online,
          timestamp: new Date().toISOString()
        }, { contentType: "application/json" });

        context.log(`✅ Broadcasted ${user.oid} is ${online ? 'online' : 'offline'}`);
      } catch (err) {
        context.log("Broadcast error:", err.message);
      }

      return { status: 200, jsonBody: { success: true, online } };
    } catch (err) {
      context.log("broadcastPresence error:", err.message);
      return { status: 401, jsonBody: { error: err.message } };
    }
  },
});
