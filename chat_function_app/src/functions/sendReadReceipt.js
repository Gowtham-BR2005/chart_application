const { app } = require("@azure/functions");
const { WebPubSubServiceClient } = require("@azure/web-pubsub");
const { messagesContainer } = require("./utils/cosmosClient");
const { verifyToken } = require("./utils/authMiddleware");

app.http("sendReadReceipt", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "messages/read",
  handler: async (req, context) => {
    try {
      const user = await verifyToken(req);
      const { contactId } = await req.json();

      context.log(`📬 Read receipt: ${user.oid} opened chat with ${contactId}`);

      const now = new Date().toISOString();

      // Update ALL unread messages from contactId in Cosmos DB
      // Find the partition key for direct messages
      const partitionKey = `dm_${[user.oid, contactId].sort().join("_")}`;

      try {
        // Query all messages from contactId to current user that haven't been read
        const { resources: unreadMessages } = await messagesContainer.items.query({
          query: `SELECT * FROM c WHERE c.partitionKey = @pk AND c.senderId = @senderId AND (IS_NULL(c.readAt) OR c.readAt = null)`,
          parameters: [
            { name: "@pk", value: partitionKey },
            { name: "@senderId", value: contactId }
          ]
        }).fetchAll();

        context.log(`Found ${unreadMessages.length} unread messages to mark as read`);

        // Update each message with readAt timestamp
        for (const message of unreadMessages) {
          message.readAt = now;
          message.readBy = user.oid;
          await messagesContainer.item(message.id, partitionKey).replace(message);
        }

        context.log(`✅ Marked ${unreadMessages.length} messages as read in database`);
      } catch (dbError) {
        context.log(`⚠️ Database update failed: ${dbError.message}`);
        // Continue with WebSocket broadcast even if DB update fails
      }

      // Broadcast read receipt to the sender via WebSocket
      const pubSubClient = new WebPubSubServiceClient(
        process.env.PUBSUB_CONNECTION,
        process.env.PUBSUB_HUB
      );

      // Send to the contact's channel (the person who sent the messages)
      const senderChannel = pubSubClient.group(`user_${contactId}`);
      await senderChannel.sendToAll(
        JSON.stringify({
          type: 'read',
          userId: user.oid, // Person who read the messages
          readBy: user.oid,
          timestamp: now
        }),
        { contentType: "application/json" }
      );

      context.log(`✅ Read receipt sent to user_${contactId}`);

      return {
        status: 200,
        jsonBody: { success: true, message: 'Read receipt sent', markedAsRead: unreadMessages?.length || 0 }
      };
    } catch (err) {
      context.log("sendReadReceipt error:", err.message);
      return { status: 500, jsonBody: { error: err.message } };
    }
  },
});
