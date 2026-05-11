const { app } = require("@azure/functions");
const { usersContainer } = require("./utils/cosmosClient");
const { verifyToken } = require("./utils/authMiddleware");

app.http("findUserById", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "users/find-by-id",
  handler: async (req, context) => {
    try {
      const user = await verifyToken(req);

      const { resources } = await usersContainer.items.query({
        query: "SELECT * FROM c WHERE c.userId = @uid",
        parameters: [{ name: "@uid", value: user.oid }],
      }).fetchAll();

      if (resources.length === 0) {
        return { status: 404, jsonBody: { error: "User not registered" } };
      }

      return { status: 200, jsonBody: resources[0] };
    } catch (err) {
      context.log("findUserById error:", err.message);
      return { status: 401, jsonBody: { error: err.message } };
    }
  },
});
