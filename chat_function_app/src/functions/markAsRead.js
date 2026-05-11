const { app } = require("@azure/functions");
const { WebPubSubServiceClient } = require("@azure/web-pubsub");
const { messagesContainer } = require("./utils/cosmosClient");
const { verifyToken } = require("./utils/authMiddleware");

app.http("markAsRead", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "messages/mark-read",
  handler: async (req, context) => {
    try {
      const user = await verifyToken(req);
      const { senderId } = await req.json();

      context.log(`📬 User ${user.oid} opened chat with ${senderId}`);
      context.log(`   Marking ALL messages from ${senderId} as read`);

      const now = new Date().toISOString();

      // Get partition key for direct messages
      const partitionKey = `dm_${[user.oid, senderId].sort().join("_")}`;

      context.log(`   Partition key: ${partitionKey}`);

      // Find ALL unread messages FROM senderId TO current user
      const { resources: unreadMessages } = await messagesContainer.items.query({
        query: `SELECT * FROM c WHERE c.partitionKey = @pk AND c.senderId = @senderId AND (IS_NULL(c.readAt) OR c.readAt = null)`,
        parameters: [
          { name: "@pk", value: partitionKey },
          { name: "@senderId", value: senderId }
        ]
      }).fetchAll();

      context.log(`   Found ${unreadMessages.length} unread messages`);

      // Mark all as read
      for (const msg of unreadMessages) {
        msg.readAt = now;
        msg.readBy = user.oid;
        await messagesContainer.item(msg.id, partitionKey).replace(msg);
        context.log(`   ✓ Marked message "${msg.content}" as read`);
      }

      context.log(`💙 SUCCESS: Marked ${unreadMessages.length} messages as read in database`);

      // Broadcast read receipt via WebSocket to sender
      if (unreadMessages.length > 0) {
        const pubSubClient = new WebPubSubServiceClient(
          process.env.PUBSUB_CONNECTION,
          process.env.PUBSUB_HUB
        );

        const senderChannel = pubSubClient.group(`user_${senderId}`);
        const readReceipt = {
          type: 'read',
          userId: user.oid,
          readBy: user.oid,
          fromUserId: senderId,
          count: unreadMessages.length,
          timestamp: now
        };

        context.log(`💙 Broadcasting read receipt to ${senderId}:`, JSON.stringify(readReceipt));

        await senderChannel.sendToAll(
          JSON.stringify(readReceipt),
          { contentType: "application/json" }
        );

        context.log(`✅ Read receipt broadcasted to ${senderId}`);
      }

      return {
        status: 200,
        jsonBody: {
          success: true,
          markedCount: unreadMessages.length,
          timestamp: now
        }
      };
    } catch (err) {
      context.log("markAsRead error:", err.message);
      context.error(err);
      return {
        status: 500,
        jsonBody: { error: err.message }
      };
    }
  },
});
