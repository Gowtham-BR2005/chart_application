const { app } = require("@azure/functions");
const { usersContainer } = require("./utils/cosmosClient");
const { verifyToken } = require("./utils/authMiddleware");

app.http("getOnlineUsers", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "users/online",
  handler: async (req, context) => {
    try {
      await verifyToken(req);

      // Get all users who are currently online
      const { resources: onlineUsers } = await usersContainer.items.query({
        query: "SELECT c.userId, c.username, c.displayName FROM c WHERE c.online = true",
      }).fetchAll();

      context.log(`Found ${onlineUsers.length} online users`);

      return { status: 200, jsonBody: { users: onlineUsers } };
    } catch (err) {
      context.log("getOnlineUsers error:", err.message);
      return { status: 401, jsonBody: { error: err.message } };
    }
  },
});
