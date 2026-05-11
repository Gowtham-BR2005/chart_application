# 🚀 Production Deployment Guide

## Current Setup (Development)

✅ **Working locally:**
- Frontend: http://localhost:3000
- Backend: http://localhost:7071/api
- Database: Azure Cosmos DB (cloud)
- WebSocket: Azure Web PubSub (cloud)

---

## Production Deployment Checklist

### ✅ Already Deployed to Azure:

1. **Azure Functions (Backend)** ✅
   - URL: `https://mychat-functions-1778393386.azurewebsites.net/api`
   - Already running in Azure!

2. **Azure Static Web Apps (Frontend)** ✅
   - Configured via GitHub Actions
   - Workflow: `.github/workflows/azure-static-web-apps-*.yml`

3. **Azure Cosmos DB** ✅
   - `mychat-cosmos-1778393386.documents.azure.com`
   - Already storing messages!

4. **Azure Web PubSub** ✅
   - `mychat-pubsub-1778393386.webpubsub.azure.com`
   - Already handling real-time!

---

## 🔧 Configuration Changes Needed

### Step 1: Backend Environment Variables (Azure Portal)

Go to Azure Portal → Function App → Configuration → Application Settings

Add these variables (get values from your local.settings.json):
```
AZURE_AD_CLIENT_ID = <your-client-id>
AZURE_AD_TENANT_ID = <your-tenant-id>
COSMOS_ENDPOINT = <your-cosmos-endpoint>
COSMOS_KEY = <your-cosmos-key>
COSMOS_DATABASE = chatdb
PUBSUB_CONNECTION = <your-pubsub-connection-string>
PUBSUB_HUB = chat
```

### Step 2: Backend CORS Configuration (Azure Portal)

Go to: Function App → CORS

Add these allowed origins:
```
https://your-static-web-app.azurestaticapps.net
http://localhost:3000  (for testing)
```

⚠️ **IMPORTANT**: Replace `your-static-web-app` with your actual Static Web App URL!

### Step 3: Frontend Environment Variables (Azure Portal)

Go to: Static Web App → Configuration → Application Settings

Add these variables (get values from your .env):
```
REACT_APP_AZURE_CLIENT_ID = <your-client-id>
REACT_APP_AZURE_TENANT_ID = <your-tenant-id>
REACT_APP_AZURE_AUTHORITY = https://login.microsoftonline.com/common
REACT_APP_API_BASE_URL = https://<your-function-app>.azurewebsites.net/api
REACT_APP_AUTH_SCOPES = openid,profile,User.Read,email
REACT_APP_CACHE_LOCATION = localStorage
REACT_APP_STORE_AUTH_STATE_IN_COOKIE = true
```

⚠️ **Notice**: `REACT_APP_API_BASE_URL` is now the production URL!

### Step 4: Azure AD Redirect URI

Go to: Azure Portal → Azure Active Directory → App Registrations → chartApp → Authentication

Add redirect URIs:
```
https://your-static-web-app.azurestaticapps.net
https://mychat-functions-1778393386.azurewebsites.net
```

---

## 📦 Deployment Methods

### Method 1: Deploy Backend (Azure Functions)

**Option A: Using VS Code**
1. Install Azure Functions extension
2. Right-click on `chat_function_app` folder
3. Click "Deploy to Function App"
4. Select `mychat-functions-1778393386`

**Option B: Using Azure CLI**
```bash
cd chat_function_app
func azure functionapp publish mychat-functions-1778393386
```

### Method 2: Deploy Frontend (Automatic via GitHub)

**Already configured!** ✅

Just push to GitHub:
```bash
cd E:\cc\chart_application
git add .
git commit -m "feat: production ready chat app"
git push origin main
```

GitHub Actions will automatically:
1. Build the React app
2. Deploy to Azure Static Web Apps
3. Done in 2-3 minutes!

---

## 🔄 Two-Environment Setup (Recommended)

Keep both development and production configs:

### Development (.env)
```env
REACT_APP_API_BASE_URL=http://localhost:7071/api
```

### Production (.env.production)
Create new file: `.env.production`
```env
REACT_APP_AZURE_CLIENT_ID=<your-client-id>
REACT_APP_AZURE_TENANT_ID=<your-tenant-id>
REACT_APP_AZURE_AUTHORITY=https://login.microsoftonline.com/common
REACT_APP_API_BASE_URL=https://<your-function-app>.azurewebsites.net/api
REACT_APP_AUTH_SCOPES=openid,profile,User.Read,email
REACT_APP_CACHE_LOCATION=localStorage
REACT_APP_STORE_AUTH_STATE_IN_COOKIE=true
```

**How it works**:
- `npm start` → Uses `.env` (local)
- `npm run build` → Uses `.env.production` (production)
- GitHub Actions automatically uses `.env.production`

---

## ⚠️ Common Deployment Issues

### Issue 1: CORS Errors in Production
**Symptom**: Frontend can't connect to backend

**Fix**:
1. Azure Portal → Function App → CORS
2. Add your Static Web App URL
3. Save and restart Function App

### Issue 2: WebSocket Connection Fails
**Symptom**: Messages don't send in real-time

**Fix**:
1. Check Web PubSub connection string in Function App settings
2. Ensure Function App has `PUBSUB_CONNECTION` and `PUBSUB_HUB`

### Issue 3: Database Connection Fails
**Symptom**: Can't load messages or contacts

**Fix**:
1. Verify Cosmos DB connection string in Function App settings
2. Check `COSMOS_ENDPOINT` and `COSMOS_KEY`
3. Ensure containers exist: `users`, `messages`, `groups`

### Issue 4: Authentication Fails
**Symptom**: Can't login with Microsoft

**Fix**:
1. Azure AD → App registrations → chartApp → Authentication
2. Add production redirect URI
3. Enable multi-tenant if needed

---

## 🧪 Testing Production Deployment

### Test Backend Endpoint
```bash
# Should return "No token" error (means it's running)
curl https://mychat-functions-1778393386.azurewebsites.net/api/negotiate
```

### Test Frontend Build
```bash
cd E:\cc\chart_application
npm run build

# Check the build folder
ls build/
```

### Test Full Flow
1. Deploy both frontend and backend
2. Open production URL in browser
3. Login with Microsoft
4. Send a message
5. Open incognito window with different account
6. Verify real-time messaging works

---

## 📊 Deployment Checklist

### Backend (Azure Functions)
- [ ] Deploy code to Azure
- [ ] Add environment variables in Azure Portal
- [ ] Configure CORS
- [ ] Test API endpoint
- [ ] Check Function App logs

### Frontend (Static Web App)
- [ ] Create `.env.production`
- [ ] Update `REACT_APP_API_BASE_URL`
- [ ] Push to GitHub (auto-deploys)
- [ ] Add environment variables in Azure Portal (optional)
- [ ] Test production URL
- [ ] Verify authentication works

### Azure AD
- [ ] Add production redirect URI
- [ ] Enable multi-tenant (if needed)
- [ ] Test login flow

### Azure Resources
- [ ] Cosmos DB is accessible
- [ ] Web PubSub is configured
- [ ] All connection strings are correct

---

## 🎯 Final Steps

### 1. Create Production Environment File

Create: `E:\cc\chart_application\.env.production`

```env
REACT_APP_AZURE_CLIENT_ID=<your-client-id>
REACT_APP_AZURE_TENANT_ID=<your-tenant-id>
REACT_APP_AZURE_AUTHORITY=https://login.microsoftonline.com/common
REACT_APP_API_BASE_URL=https://<your-function-app>.azurewebsites.net/api
REACT_APP_AUTH_SCOPES=openid,profile,User.Read,email
REACT_APP_CACHE_LOCATION=localStorage
REACT_APP_STORE_AUTH_STATE_IN_COOKIE=true
```

### 2. Update .gitignore

Make sure `.env` is ignored but `.env.production` is committed:

```gitignore
# Local environment
.env
.env.local

# Production environment (can be committed)
# .env.production is SAFE to commit (no secrets, just URLs)
```

### 3. Deploy Backend

```bash
cd E:\cc\chart_application\chat_function_app
func azure functionapp publish mychat-functions-1778393386
```

### 4. Deploy Frontend

```bash
cd E:\cc\chart_application
git add .
git commit -m "feat: production deployment ready"
git push origin main
```

Wait 2-3 minutes for GitHub Actions to complete.

### 5. Configure Azure Resources

1. **Function App Settings**:
   - Add all environment variables
   - Configure CORS
   - Restart app

2. **Azure AD**:
   - Add production redirect URI
   - Save

3. **Test Everything**:
   - Open production URL
   - Login
   - Send messages
   - Test with multiple users

---

## 💰 Cost Considerations

**Your current Azure services**:

1. **Azure Functions** (Backend)
   - Free tier: 1 million executions/month
   - Should be free for moderate use

2. **Azure Static Web Apps** (Frontend)
   - Free tier: 100 GB bandwidth/month
   - Should be free

3. **Azure Cosmos DB** (Database)
   - Pay per use
   - ~$25-50/month for moderate use
   - Can scale down for testing

4. **Azure Web PubSub** (Real-time)
   - Free tier: 20 concurrent connections
   - Upgrade if needed

**Estimated Cost**: $25-50/month (mostly Cosmos DB)

**To reduce costs**:
- Use Cosmos DB free tier (400 RU/s)
- Set lower throughput for development
- Scale up only when needed

---

## 🚀 Ready to Deploy?

**Quick Deploy Commands**:

```bash
# 1. Deploy Backend
cd E:\cc\chart_application\chat_function_app
func azure functionapp publish mychat-functions-1778393386

# 2. Deploy Frontend (automatic)
cd E:\cc\chart_application
git add .
git commit -m "deploy: production ready"
git push origin main
```

**Then**:
1. Configure environment variables in Azure Portal
2. Update CORS settings
3. Add Azure AD redirect URI
4. Test!

---

## ✅ After Deployment

**No more CMD windows needed!** ✅

Once deployed to Azure:
- Backend runs in Azure (always on)
- Frontend served by Azure CDN (fast)
- No local servers needed
- Access from anywhere!

**Development Flow**:
- Test locally: `npm start` (localhost)
- Deploy: `git push` (production)
- Best of both worlds! 🎉

---

## Need Help?

**Common Questions**:

Q: **Do I need to keep CMD windows open in production?**
A: No! Azure runs everything for you.

Q: **Will users need to run anything?**
A: No! They just visit the URL in their browser.

Q: **How do I update the app?**
A: Just `git push` and it auto-deploys!

Q: **Can I test before deploying?**
A: Yes! Use `npm run build` locally first.

---

**Ready to deploy? Let me know if you want me to help with any step!** 🚀
