const { app } = require("@azure/functions");
const { messagesContainer } = require("./utils/cosmosClient");
const { verifyToken } = require("./utils/authMiddleware");
app.http("getMessages", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "messages",
  handler: async (req, context) => {
    try {
      const user = await verifyToken(req);
      const url = new URL(req.url);
      const type = url.searchParams.get("type");
      const targetId = url.searchParams.get("targetId");
      const partitionKey = type === "direct"
        ? `dm_${[user.oid, targetId].sort().join("_")}`
        : `group_${targetId}`;
      const { resources } = await messagesContainer.items.query({
        query: "SELECT * FROM c WHERE c.partitionKey = @pk ORDER BY c.timestamp ASC",
        parameters: [{ name: "@pk", value: partitionKey }],
      }).fetchAll();
      return { status: 200, jsonBody: { messages: resources } };
    } catch (err) {
      context.log("getMessages error:", err.message);
      return { status: 401, jsonBody: { error: err.message } };
    }
  },
});
