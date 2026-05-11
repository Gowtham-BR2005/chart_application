const { app } = require("@azure/functions");
const { usersContainer } = require("./utils/cosmosClient");
const { WebPubSubServiceClient } = require("@azure/web-pubsub");

// This function can be called periodically to check for inactive users
// Users who haven't sent heartbeat in 30+ seconds are marked offline
// This ensures users go offline when they close the tab/browser
app.http("checkInactiveUsers", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "presence/check-inactive",
  handler: async (req, context) => {
    try {
      const now = new Date();
      const thirtySecondsAgo = new Date(now.getTime() - 30000);

      context.log('Checking for inactive users (30s threshold)...');

      // Find users marked online but haven't sent heartbeat in 30+ seconds
      // This means they closed the tab or lost connection
      const { resources: staleUsers } = await usersContainer.items.query({
        query: `
          SELECT * FROM c
          WHERE c.online = true
          AND c.lastSeen < @threshold
        `,
        parameters: [{ name: "@threshold", value: thirtySecondsAgo.toISOString() }],
      }).fetchAll();

      if (staleUsers.length === 0) {
        context.log('No inactive users found');
        return { status: 200, jsonBody: { marked: 0 } };
      }

      context.log(`Found ${staleUsers.length} inactive users`);

      const pubSubClient = new WebPubSubServiceClient(
        process.env.PUBSUB_CONNECTION,
        process.env.PUBSUB_HUB
      );

      // Mark each as offline and broadcast
      for (const userDoc of staleUsers) {
        userDoc.online = false;
        await usersContainer.item(userDoc.id, "users").replace(userDoc);

        // Broadcast offline status
        await pubSubClient.sendToAll({
          type: "presence",
          userId: userDoc.userId,
          online: false,
          timestamp: new Date().toISOString()
        }, { contentType: "application/json" });

        context.log(`Marked ${userDoc.username} as offline (inactive)`);
      }

      return {
        status: 200,
        jsonBody: {
          marked: staleUsers.length,
          users: staleUsers.map(u => u.username)
        }
      };
    } catch (err) {
      context.log("checkInactiveUsers error:", err.message);
      return { status: 500, jsonBody: { error: err.message } };
    }
  },
});
