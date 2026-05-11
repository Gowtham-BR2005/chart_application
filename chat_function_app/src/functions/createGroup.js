const { app } = require("@azure/functions");
const { groupsContainer } = require("./utils/cosmosClient");
const { verifyToken } = require("./utils/authMiddleware");
const { v4: uuidv4 } = require("uuid");
app.http("createGroup", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "groups",
  handler: async (req, context) => {
    try {
      const user = await verifyToken(req);
      const { name, memberIds } = await req.json();
      const group = {
        id: uuidv4(), partitionKey: "groups", name,
        createdBy: user.oid,
        members: [...new Set([...memberIds, user.oid])],
        createdAt: new Date().toISOString(),
      };
      await groupsContainer.items.create(group);
      return { status: 201, jsonBody: { group } };
    } catch (err) {
      context.log("createGroup error:", err.message);
      return { status: 500, jsonBody: { error: err.message } };
    }
  },
});
