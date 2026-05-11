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

      // When user sends a message, mark all received messages from recipient as read
      let markedCount = 0;
      if (type === "direct") {
        try {
          const now = new Date().toISOString();

          // Find all unread messages from the recipient (toUserId) to current user
          const { resources: unreadMessages } = await messagesContainer.items.query({
            query: `SELECT * FROM c WHERE c.partitionKey = @pk AND c.senderId = @senderId AND (IS_NULL(c.readAt) OR c.readAt = null)`,
            parameters: [
              { name: "@pk", value: partitionKey },
              { name: "@senderId", value: toUserId }
            ]
          }).fetchAll();

          context.log(`🔍 Found ${unreadMessages.length} unread messages from ${toUserId}`);

          // Mark all as read
          for (const msg of unreadMessages) {
            msg.readAt = now;
            msg.readBy = user.oid;
            await messagesContainer.item(msg.id, partitionKey).replace(msg);
          }

          markedCount = unreadMessages.length;

          if (markedCount > 0) {
            context.log(`💙 Marked ${markedCount} messages as read (user replied)`);
          }
        } catch (readErr) {
          context.log(`⚠️ Could not mark messages as read: ${readErr.message}`);
          markedCount = 0;
        }
      }

      const pubSubClient = new WebPubSubServiceClient(
        process.env.PUBSUB_CONNECTION,
        process.env.PUBSUB_HUB
      );

      if (type === "direct") {
        // Send to receiver's channel
        const receiverChannel = pubSubClient.group(`user_${toUserId}`);
        await receiverChannel.sendToAll(JSON.stringify(message), { contentType: "application/json" });
        context.log("PubSub broadcast to receiver:", `user_${toUserId}`);

        // Also send to sender's own channel so they see it in other tabs/devices
        const senderChannel = pubSubClient.group(`user_${user.oid}`);
        await senderChannel.sendToAll(JSON.stringify(message), { contentType: "application/json" });
        context.log("PubSub broadcast to sender:", `user_${user.oid}`);

        // If we marked messages as read, send read receipt to the other person
        context.log(`🔍 markedCount = ${markedCount}, toUserId = ${toUserId}`);
        if (markedCount > 0) {
          const readReceipt = {
            type: 'read',
            userId: user.oid,
            readBy: user.oid,
            timestamp: new Date().toISOString()
          };
          context.log(`💙 Sending read receipt to ${toUserId}:`, JSON.stringify(readReceipt));
          await receiverChannel.sendToAll(
            JSON.stringify(readReceipt),
            { contentType: "application/json" }
          );
          context.log(`✅ Read receipt sent successfully to ${toUserId} (${markedCount} messages marked)`);
        } else {
          context.log(`ℹ️ No messages to mark as read (markedCount = 0)`);
        }
      } else {
        // Group message - send to group channel
        const groupChannel = pubSubClient.group(`group_${groupId}`);
        await groupChannel.sendToAll(JSON.stringify(message), { contentType: "application/json" });
        context.log("PubSub broadcast to group:", `group_${groupId}`);
      }

      return { status: 200, jsonBody: { success: true, message } };
    } catch (err) {
      context.log("sendMessage error:", err.message);
      return { status: 500, jsonBody: { error: err.message } };
    }
  },
});
