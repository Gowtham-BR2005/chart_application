const { app } = require("@azure/functions");
const { WebPubSubServiceClient } = require("@azure/web-pubsub");
const { messagesContainer, usersContainer } = require("./utils/cosmosClient");
const { verifyToken } = require("./utils/authMiddleware");
const { v4: uuidv4 } = require("uuid");

app.http("sendMessage", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "messages",
  handler: async (req, context) => {
    try {
      const user = await verifyToken(req);
      const { type, content, toUserId, groupId } = await req.json();

      // Get sender's display name from database
      let senderName = user.name || 'Unknown User';
      try {
        const { resources: users } = await usersContainer.items.query({
          query: "SELECT c.displayName, c.username FROM c WHERE c.userId = @uid",
          parameters: [{ name: "@uid", value: user.oid }],
        }).fetchAll();

        if (users.length > 0) {
          senderName = users[0].displayName || users[0].username || senderName;
        }
      } catch (err) {
        context.log("Could not fetch sender name:", err.message);
      }

      const partitionKey = type === "direct"
        ? `dm_${[user.oid, toUserId].sort().join("_")}`
        : `group_${groupId}`;

      const message = {
        id: uuidv4(), type, content,
        senderId: user.oid, senderName: senderName,
        timestamp: new Date().toISOString(), partitionKey,
        ...(type === "direct" && { toUserId }),
        ...(type === "group" && { groupId }),
      };

      await messagesContainer.items.create(message);
      context.log("Saved to CosmosDB OK");

      const channel = type === "direct" ? `user_${toUserId}` : `group_${groupId}`;

      const pubSubClient = new WebPubSubServiceClient(
        process.env.PUBSUB_CONNECTION,
        process.env.PUBSUB_HUB
      );
      const hubClient = pubSubClient.group(channel);
      await hubClient.sendToAll(JSON.stringify(message), { contentType: "application/json" });
      context.log("PubSub broadcast OK to:", channel);

      return { status: 200, jsonBody: { success: true, message } };
    } catch (err) {
      context.log("sendMessage error:", err.message);
      return { status: 500, jsonBody: { error: err.message } };
    }
  },
});
