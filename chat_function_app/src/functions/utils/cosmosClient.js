const { CosmosClient } = require("@azure/cosmos");

// Support both connection string and endpoint/key format
const client = process.env.COSMOS_CONNECTION
  ? new CosmosClient(process.env.COSMOS_CONNECTION)
  : new CosmosClient({
      endpoint: process.env.COSMOS_ENDPOINT,
      key: process.env.COSMOS_KEY
    });

const db = client.database(process.env.COSMOS_DATABASE || process.env.COSMOS_DB);

module.exports = {
    messagesContainer: db.container("messages"),
    groupsContainer: db.container("groups"),
    usersContainer: db.container("users"),
};