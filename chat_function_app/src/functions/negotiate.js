const { app } = require("@azure/functions");
const { WebPubSubServiceClient } = require("@azure/web-pubsub");
const { verifyToken } = require("./utils/authMiddleware");
const { groupsContainer } = require("./utils/cosmosClient");

app.http("negotiate", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "negotiate",
  handler: async (req, context) => {
    try {
      const user = await verifyToken(req);

      const { resources: groups } = await groupsContainer.items.query({
        query: "SELECT c.id FROM c WHERE ARRAY_CONTAINS(c.members, @uid)",
        parameters: [{ name: "@uid", value: user.oid }],
      }).fetchAll();

      const pubSubClient = new WebPubSubServiceClient(
        process.env.PUBSUB_CONNECTION,
        process.env.PUBSUB_HUB
      );

      const token = await pubSubClient.getClientAccessToken({
        userId: user.oid,
        roles: ["webpubsub.joinLeaveGroup", "webpubsub.sendToGroup"],
        groups: [`user_${user.oid}`, ...groups.map(g => `group_${g.id}`)],
      });

      return { status: 200, jsonBody: { url: token.url, userId: user.oid } };
    } catch (err) {
      context.log("negotiate error:", err.message);
      return { status: 401, jsonBody: { error: err.message } };
    }
  },
});
