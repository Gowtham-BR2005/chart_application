const { app } = require("@azure/functions");
const { usersContainer } = require("./utils/cosmosClient");
const { verifyToken } = require("./utils/authMiddleware");
const { WebPubSubServiceClient } = require("@azure/web-pubsub");

// Handle WebSocket connect/disconnect events
app.http("handleWebSocketEvents", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "eventhandler",
  handler: async (req, context) => {
    try {
      const event = await req.json();
      context.log("WebSocket event:", event.type, event.userId);

      if (event.type === "connected") {
        // User connected - mark as online
        await updateUserPresence(event.userId, true, context);

        // Broadcast to all users that this user is online
        await broadcastPresence(event.userId, true, context);

        return { status: 200, jsonBody: { success: true } };
      }

      if (event.type === "disconnected") {
        // User disconnected - mark as offline
        await updateUserPresence(event.userId, false, context);

        // Broadcast to all users that this user is offline
        await broadcastPresence(event.userId, false, context);

        return { status: 200, jsonBody: { success: true } };
      }

      return { status: 200, jsonBody: { success: true } };
    } catch (err) {
      context.log("handleWebSocketEvents error:", err.message);
      return { status: 500, jsonBody: { error: err.message } };
    }
  },
});

async function updateUserPresence(userId, online, context) {
  try {
    const { resources: users } = await usersContainer.items.query({
      query: "SELECT * FROM c WHERE c.userId = @uid",
      parameters: [{ name: "@uid", value: userId }],
    }).fetchAll();

    if (users.length > 0) {
      const userDoc = users[0];
      userDoc.online = online;
      userDoc.lastSeen = new Date().toISOString();

      await usersContainer.item(userDoc.id, "users").replace(userDoc);
      context.log(`User ${userId} marked as ${online ? 'online' : 'offline'}`);
    }
  } catch (err) {
    context.log("updateUserPresence error:", err.message);
  }
}

async function broadcastPresence(userId, online, context) {
  try {
    const pubSubClient = new WebPubSubServiceClient(
      process.env.PUBSUB_CONNECTION,
      process.env.PUBSUB_HUB
    );

    // Broadcast presence update to all connected clients
    await pubSubClient.sendToAll({
      type: "presence",
      userId: userId,
      online: online,
      timestamp: new Date().toISOString()
    }, { contentType: "application/json" });

    context.log(`Broadcasted ${userId} is ${online ? 'online' : 'offline'}`);
  } catch (err) {
    context.log("broadcastPresence error:", err.message);
  }
}
