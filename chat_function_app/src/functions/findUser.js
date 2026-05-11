const { app } = require("@azure/functions");
const { usersContainer } = require("./utils/cosmosClient");
const { verifyToken } = require("./utils/authMiddleware");
app.http("findUser", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "users/find",
  handler: async (req, context) => {
    try {
      await verifyToken(req);
      const url = new URL(req.url);
      const username = url.searchParams.get("username")?.toLowerCase().trim();
      const { resources } = await usersContainer.items.query({
        query: "SELECT c.userId, c.username, c.displayName FROM c WHERE c.username = @username",
        parameters: [{ name: "@username", value: username }],
      }).fetchAll();
      if (resources.length === 0) {
        return { status: 404, jsonBody: { error: "User not found" } };
      }
      return { status: 200, jsonBody: { user: resources[0] } };
    } catch (err) {
      context.log("findUser error:", err.message);
      return { status: 401, jsonBody: { error: err.message } };
    }
  },
});
