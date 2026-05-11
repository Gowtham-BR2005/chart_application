const { app } = require("@azure/functions");
const { usersContainer } = require("./utils/cosmosClient");
const { verifyToken } = require("./utils/authMiddleware");

app.http("updatePresence", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "users/presence",
  handler: async (req, context) => {
    try {
      const user = await verifyToken(req);
      const { status } = await req.json(); // "online" or "offline"

      // Update user's online status
      const { resources: users } = await usersContainer.items.query({
        query: "SELECT * FROM c WHERE c.userId = @uid",
        parameters: [{ name: "@uid", value: user.oid }],
      }).fetchAll();

      if (users.length > 0) {
        const userDoc = users[0];
        userDoc.online = status === "online";
        userDoc.lastSeen = new Date().toISOString();

        await usersContainer.item(userDoc.id, "users").replace(userDoc);

        return { status: 200, jsonBody: { success: true, online: userDoc.online } };
      }

      return { status: 404, jsonBody: { error: "User not found" } };
    } catch (err) {
      context.log("updatePresence error:", err.message);
      return { status: 401, jsonBody: { error: err.message } };
    }
  },
});
