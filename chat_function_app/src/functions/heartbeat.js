const { app } = require("@azure/functions");
const { usersContainer } = require("./utils/cosmosClient");
const { verifyToken } = require("./utils/authMiddleware");

app.http("heartbeat", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "presence/heartbeat",
  handler: async (req, context) => {
    try {
      const user = await verifyToken(req);

      // Update user's lastSeen timestamp
      const { resources: users } = await usersContainer.items.query({
        query: "SELECT * FROM c WHERE c.userId = @uid",
        parameters: [{ name: "@uid", value: user.oid }],
      }).fetchAll();

      if (users.length > 0) {
        const userDoc = users[0];
        userDoc.lastSeen = new Date().toISOString();
        userDoc.online = true; // Ensure online

        await usersContainer.item(userDoc.id, "users").replace(userDoc);
      }

      return { status: 200, jsonBody: { success: true } };
    } catch (err) {
      context.log("heartbeat error:", err.message);
      return { status: 401, jsonBody: { error: err.message } };
    }
  },
});
