const { app } = require("@azure/functions");
const { usersContainer } = require("./utils/cosmosClient");
const { verifyToken } = require("./utils/authMiddleware");

app.http("updateUsername", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "users/username",
  handler: async (req, context) => {
    try {
      const user = await verifyToken(req);
      const { username } = await req.json();

      if (!username || !username.trim()) {
        return { status: 400, jsonBody: { error: "Username is required" } };
      }

      const newUsername = username.trim().toLowerCase();

      // Check if username is already taken by someone else
      const { resources: existing } = await usersContainer.items.query({
        query: "SELECT * FROM c WHERE c.username = @username AND c.userId != @uid",
        parameters: [
          { name: "@username", value: newUsername },
          { name: "@uid", value: user.oid }
        ],
      }).fetchAll();

      if (existing.length > 0) {
        return { status: 409, jsonBody: { error: "Username already taken" } };
      }

      // Get current user document
      const { resources: users } = await usersContainer.items.query({
        query: "SELECT * FROM c WHERE c.userId = @uid",
        parameters: [{ name: "@uid", value: user.oid }],
      }).fetchAll();

      if (users.length === 0) {
        return { status: 404, jsonBody: { error: "User not found" } };
      }

      // Update username
      const userDoc = users[0];
      const oldUsername = userDoc.username;
      userDoc.username = newUsername;

      await usersContainer.item(userDoc.id, "users").replace(userDoc);

      context.log(`Username updated: ${oldUsername} → ${newUsername}`);

      return {
        status: 200,
        jsonBody: {
          success: true,
          message: "Username updated successfully",
          user: {
            userId: userDoc.userId,
            username: userDoc.username,
            displayName: userDoc.displayName,
            email: userDoc.email
          }
        }
      };
    } catch (err) {
      context.log("updateUsername error:", err.message);
      return { status: 500, jsonBody: { error: err.message } };
    }
  },
});
