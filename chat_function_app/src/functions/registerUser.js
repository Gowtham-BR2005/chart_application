const { app } = require("@azure/functions");
const { usersContainer } = require("./utils/cosmosClient");
const { verifyToken } = require("./utils/authMiddleware");
app.http("registerUser", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "users/register",
  handler: async (req, context) => {
    try {
      const user = await verifyToken(req);
      const { username } = await req.json();
      const { resources: existing } = await usersContainer.items.query({
        query: "SELECT * FROM c WHERE c.username = @username",
        parameters: [{ name: "@username", value: username }],
      }).fetchAll();
      if (existing.length > 0) {
        return { status: 409, jsonBody: { error: "Username already taken" } };
      }
      const { resources: alreadyRegistered } = await usersContainer.items.query({
        query: "SELECT * FROM c WHERE c.userId = @uid",
        parameters: [{ name: "@uid", value: user.oid }],
      }).fetchAll();
      if (alreadyRegistered.length > 0) {
        return { status: 200, jsonBody: { user: alreadyRegistered[0] } };
      }
      const newUser = {
        id: user.oid, partitionKey: "users",
        userId: user.oid,
        username: username.toLowerCase().trim(),
        displayName: user.name,
        email: user.preferred_username,
        createdAt: new Date().toISOString(),
      };
      await usersContainer.items.create(newUser);
      return { status: 201, jsonBody: { user: newUser } };
    } catch (err) {
      context.log("registerUser error:", err.message);
      return { status: 500, jsonBody: { error: err.message } };
    }
  },
});
