# Backend Setup Guide - Azure Functions Chat API

This is the backend for the chat application, built with Azure Functions (Node.js) and using:
- **Azure Cosmos DB** for message and user storage
- **Azure Web PubSub** for real-time WebSocket messaging
- **Azure AD JWT** authentication

## Quick Start

### 1. Install Dependencies

```bash
cd chat_function_app
npm install
```

### 2. Configure Environment Variables

Copy the example settings file:

```bash
cp local.settings.example.json local.settings.json
```

Edit `local.settings.json` and fill in your Azure resource values:

```json
{
  "Values": {
    "AZURE_AD_CLIENT_ID": "your-azure-ad-client-id",
    "AZURE_AD_TENANT_ID": "your-azure-ad-tenant-id",
    "COSMOS_ENDPOINT": "https://your-cosmos-account.documents.azure.com:443/",
    "COSMOS_KEY": "your-cosmos-primary-key",
    "COSMOS_DATABASE": "chatdb",
    "PUBSUB_CONNECTION": "Endpoint=https://your-pubsub.webpubsub.azure.com;AccessKey=...",
    "PUBSUB_HUB": "chat"
  },
  "Host": {
    "CORS": "*",
    "CORSCredentials": false
  }
}
```

### 3. Start Local Development Server

```bash
npm start
```

The API will run at: `http://localhost:7071/api`

---

## Azure Resources Required

### 1. Azure AD App Registration

**You already have this configured in your frontend!**

- Client ID: Same as `REACT_APP_AZURE_CLIENT_ID` in frontend `.env`
- Tenant ID: Same as `REACT_APP_AZURE_TENANT_ID` in frontend `.env`

### 2. Azure Cosmos DB

Create a Cosmos DB account with:
- **API**: Core (SQL)
- **Database name**: `chatdb`
- **Containers**:
  - `users` (partition key: `/id`)
  - `messages` (partition key: `/partitionKey`)
  - `groups` (partition key: `/id`)

**Get the values:**
1. Go to Azure Portal → Cosmos DB account
2. Click **Keys** in left menu
3. Copy:
   - **URI** → `COSMOS_ENDPOINT`
   - **PRIMARY KEY** → `COSMOS_KEY`

### 3. Azure Web PubSub

Create a Web PubSub service:
1. Go to Azure Portal → Create Resource → Web PubSub
2. After creation, go to **Keys**
3. Copy **Connection String** → `PUBSUB_CONNECTION`

**Hub name**: Use `chat` (already configured in code)

---

## API Endpoints

All endpoints require JWT authentication (Bearer token from Azure AD).

### Authentication

**POST** `/api/users/register`
- Register a new user with username
- Body: `{ "username": "string" }`
- Returns: User object with `userId`, `username`

**GET** `/api/users/find-by-id`
- Get current authenticated user
- Returns: User object

**GET** `/api/users/find?username=<username>`
- Search for user by username
- Returns: User object or 404

### Messaging

**POST** `/api/messages`
- Send a message (direct or group)
- Body: 
  ```json
  {
    "type": "direct",
    "content": "Hello!",
    "toUserId": "recipient-oid",
    "groupId": "optional-for-groups"
  }
  ```
- Returns: Message object with ID and timestamp

**GET** `/api/messages?type=<type>&targetId=<id>`
- Get message history
- Query params:
  - `type`: "direct" or "group"
  - `targetId`: User OID (for direct) or Group ID (for group)
- Returns: Array of messages

### Groups

**POST** `/api/groups`
- Create a new group chat
- Body: `{ "name": "Group Name", "memberIds": ["oid1", "oid2"] }`
- Returns: Group object with ID

### WebSocket

**GET** `/api/negotiate`
- Get WebSocket connection URL
- Returns: `{ "url": "wss://...", "userId": "oid" }`
- Frontend uses this to establish real-time connection

---

## CORS Configuration

The `local.settings.json` includes CORS configuration:

```json
{
  "Host": {
    "CORS": "*",
    "CORSCredentials": false
  }
}
```

**For production**, change `"*"` to specific origins:

```json
{
  "Host": {
    "CORS": "https://your-frontend-domain.com,http://localhost:3000",
    "CORSCredentials": false
  }
}
```

**For Azure deployment**, configure CORS in Azure Portal:
1. Go to Function App → CORS
2. Add allowed origins (e.g., `https://your-static-web-app.azurestaticapps.net`)

---

## Testing the Backend

### 1. Check if server is running

```bash
curl http://localhost:7071/api/negotiate
```

Should return 401 (Unauthorized) - this is correct, means server is up.

### 2. Test with JWT token

Get a token from the frontend (check browser console after login), then:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:7071/api/negotiate
```

Should return WebSocket URL.

### 3. Connect Frontend

In your frontend `.env`:

```env
REACT_APP_API_BASE_URL=http://localhost:7071/api
```

In `src/App.js`:

```javascript
const ENABLE_BACKEND = true; // Enable backend connection
```

Restart frontend: `npm start`

---

## Deployment to Azure

### 1. Install Azure Functions Core Tools

```bash
npm install -g azure-functions-core-tools@4
```

### 2. Login to Azure

```bash
az login
```

### 3. Create Function App (if not exists)

```bash
az functionapp create \
  --resource-group YOUR_RESOURCE_GROUP \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name your-chat-functions \
  --storage-account YOUR_STORAGE_ACCOUNT
```

### 4. Configure App Settings

Add environment variables in Azure Portal:
1. Go to Function App → Configuration
2. Add Application Settings:
   - `AZURE_AD_CLIENT_ID`
   - `AZURE_AD_TENANT_ID`
   - `COSMOS_ENDPOINT`
   - `COSMOS_KEY`
   - `COSMOS_DATABASE`
   - `PUBSUB_CONNECTION`
   - `PUBSUB_HUB`

### 5. Deploy

```bash
func azure functionapp publish your-chat-functions
```

Your API will be at: `https://your-chat-functions.azurewebsites.net/api`

### 6. Update Frontend

Update frontend `.env`:

```env
REACT_APP_API_BASE_URL=https://your-chat-functions.azurewebsites.net/api
```

---

## Troubleshooting

### "No token" error

**Problem**: Frontend not sending JWT token

**Solution**: Check that:
1. User is logged in with Microsoft
2. Token is stored in localStorage (check browser DevTools → Application → Local Storage)
3. Frontend is sending `Authorization: Bearer <token>` header

### CORS errors in browser

**Problem**: Browser blocking requests from `localhost:3000` to `localhost:7071`

**Solution**: Make sure `local.settings.json` has:
```json
{
  "Host": {
    "CORS": "*",
    "CORSCredentials": false
  }
}
```

Restart the backend server after changing CORS settings.

### Cosmos DB errors

**Problem**: "Resource not found" or connection errors

**Solution**: 
1. Verify Cosmos DB endpoint and key in `local.settings.json`
2. Create database and containers manually:
   - Database: `chatdb`
   - Containers: `users`, `messages`, `groups`

### WebSocket connection fails

**Problem**: negotiate endpoint works but WebSocket won't connect

**Solution**:
1. Check Web PubSub connection string is correct
2. Verify hub name is `chat` (case-sensitive)
3. Check Azure Web PubSub service is running

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `AZURE_AD_CLIENT_ID` | Azure AD App Registration Client ID | `8ae8251c-b72a-4687-...` |
| `AZURE_AD_TENANT_ID` | Azure AD Tenant ID | `d91f6753-b409-4f30-...` |
| `COSMOS_ENDPOINT` | Cosmos DB URI | `https://mydb.documents.azure.com:443/` |
| `COSMOS_KEY` | Cosmos DB Primary Key | `ABC123...==` |
| `COSMOS_DATABASE` | Database name | `chatdb` |
| `PUBSUB_CONNECTION` | Web PubSub connection string | `Endpoint=https://...;AccessKey=...` |
| `PUBSUB_HUB` | Hub name for WebSocket | `chat` |

---

## Security Notes

- ✅ All endpoints validate JWT tokens from Azure AD
- ✅ Tokens are verified using Azure AD public keys (JWKS)
- ✅ `local.settings.json` is gitignored (don't commit secrets)
- ⚠️ For production, restrict CORS to specific domains
- ⚠️ Rotate Cosmos DB keys regularly
- ⚠️ Use Azure Key Vault for production secrets

---

## Next Steps

1. ✅ Set up Azure Cosmos DB and create containers
2. ✅ Set up Azure Web PubSub service
3. ✅ Configure `local.settings.json` with your values
4. ✅ Start backend: `npm start`
5. ✅ Enable backend in frontend: `ENABLE_BACKEND = true`
6. ✅ Test authentication and messaging
7. ✅ Deploy to Azure when ready

---

## Support

If you encounter issues:
- Check Azure Portal for resource status
- Verify all environment variables are set correctly
- Check Function App logs in Azure Portal
- Test endpoints with curl + JWT token
