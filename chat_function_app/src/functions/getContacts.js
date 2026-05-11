const { app } = require("@azure/functions");
const { messagesContainer, usersContainer } = require("./utils/cosmosClient");
const { verifyToken } = require("./utils/authMiddleware");

app.http("getContacts", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "users/contacts",
  handler: async (req, context) => {
    try {
      const user = await verifyToken(req);

      // Get all messages where user is sender or receiver
      const { resources: messages } = await messagesContainer.items.query({
        query: `
          SELECT DISTINCT c.senderId, c.toUserId, c.senderName, c.timestamp
          FROM c
          WHERE c.senderId = @uid OR c.toUserId = @uid
          ORDER BY c.timestamp DESC
        `,
        parameters: [{ name: "@uid", value: user.oid }],
      }).fetchAll();

      // Extract unique user IDs (excluding current user)
      const contactIds = new Set();
      messages.forEach(msg => {
        if (msg.senderId !== user.oid) contactIds.add(msg.senderId);
        if (msg.toUserId && msg.toUserId !== user.oid) contactIds.add(msg.toUserId);
      });

      // Get user details for each contact
      const contacts = [];
      for (const contactId of contactIds) {
        const { resources: userDocs } = await usersContainer.items.query({
          query: "SELECT * FROM c WHERE c.userId = @uid",
          parameters: [{ name: "@uid", value: contactId }],
        }).fetchAll();

        if (userDocs.length > 0) {
          const contactUser = userDocs[0];

          // Find last message with this contact
          const lastMsg = messages.find(m =>
            m.senderId === contactId || m.toUserId === contactId
          );

          contacts.push({
            userId: contactUser.userId,
            username: contactUser.username,
            displayName: contactUser.displayName,
            lastMessage: lastMsg?.content || '',
            timestamp: lastMsg?.timestamp || contactUser.createdAt,
            online: contactUser.online || false, // Get from DB
            lastSeen: contactUser.lastSeen || null,
          });
        }
      }

      // Sort by last message timestamp
      contacts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return { status: 200, jsonBody: { contacts } };
    } catch (err) {
      context.log("getContacts error:", err.message);
      return { status: 401, jsonBody: { error: err.message } };
    }
  },
});
