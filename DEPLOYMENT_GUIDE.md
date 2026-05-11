# 🚀 Azure Deployment Guide - Chat Application

## ✅ What's Ready for Production

### Features Working:
- ✅ Microsoft authentication
- ✅ Real-time messaging (WebSocket)
- ✅ Online/Offline presence
- ✅ Message delivery indicators
- ✅ **Blue tick read receipts** (NEW!)
- ✅ User search
- ✅ Contact list
- ✅ Message history (Cosmos DB)

---

## 📋 Prerequisites

1. **Azure CLI** installed
   - Download: https://aka.ms/installazurecliwindows
   - Check: `az --version`

2. **Azure account** logged in
   - Run: `az login`

3. **Node.js** installed (v16 or higher)

---

## 🎯 Quick Deployment (Recommended)

### Option 1: Deploy Backend Only (Fastest - 3 minutes)

```bash
cd chat_function_app
quick-deploy.bat
```

This deploys:
- All Azure Functions
- **NEW: markAsRead.js** (blue tick functionality)
- **NEW: sendReadReceipt.js**
- Updated: sendMessage.js (with read logic)

**After deployment:**
- Backend URL: https://mychat-functions-1778393386.azurewebsites.net
- Frontend will automatically use this backend
- Blue ticks will work!

---

### Option 2: Deploy Everything (Backend + Frontend)

```bash
deploy-all.bat
```

This deploys:
1. Backend (Azure Functions)
2. Frontend (builds React app)

**Note:** Frontend deployment to Static Web Apps happens via GitHub Actions automatically when you push to main branch.

---

## 🔧 Manual Deployment Steps

### Step 1: Deploy Backend

```bash
cd chat_function_app

# Install dependencies
npm install

# Deploy to Azure
az functionapp deployment source config-zip \
    --resource-group myResourceGroup \
    --name mychat-functions-1778393386 \
    --src deployment.zip \
    --timeout 600
```

### Step 2: Deploy Frontend

```bash
cd ..

# Build React app
npm run build

# Push to GitHub (triggers automatic deployment)
git add .
git commit -m "Deploy with blue tick feature"
git push origin main
```

---

## 🧪 Testing After Deployment

### Test Backend
```bash
curl https://mychat-functions-1778393386.azurewebsites.net/api/negotiate
```

Should return: `{"error":"No token"}` (this is correct - means it's working)

### Test Frontend
1. Open your Static Web App URL
2. Login with Microsoft account
3. Send messages between two users
4. **Open chat on second user** → **First user's messages turn BLUE!** ✓✓💙

---

## 📁 Deployment Files

| File | Purpose |
|------|---------|
| `deploy-all.bat` | Deploy both backend and frontend |
| `chat_function_app/quick-deploy.bat` | Deploy backend only (fastest) |
| `chat_function_app/deploy-backend.bat` | Backend deployment only |
| `deploy-frontend.bat` | Frontend deployment only |

---

## 🐛 Troubleshooting

### Issue: "az command not found"
**Fix:** Install Azure CLI from https://aka.ms/installazurecliwindows

### Issue: "Unauthorized"
**Fix:** Login to Azure
```bash
az login
```

### Issue: "Resource group not found"
**Fix:** Update resource group name in scripts
```bash
# Edit the .bat files and change:
--resource-group myResourceGroup
# to your actual resource group name
```

### Issue: Blue ticks not working
**Check:**
1. Backend deployed? Check logs: `az webapp log tail --name mychat-functions-1778393386 --resource-group myResourceGroup`
2. New function deployed? Check: https://mychat-functions-1778393386.azurewebsites.net/api/messages/mark-read
3. Frontend calling correct URL? Check browser console

---

## 🎉 What's New in This Deployment

### New Azure Functions:
1. **`markAsRead.js`** - Marks messages as read when chat is opened
   - Route: `/api/messages/mark-read`
   - Stores `readAt` timestamp in Cosmos DB
   - Broadcasts WebSocket notification

2. **`sendReadReceipt.js`** - Alternative read receipt endpoint
   - Route: `/api/messages/read`
   - Same functionality, different approach

### Updated Functions:
1. **`sendMessage.js`** - Now marks received messages as read when user replies

### Frontend Changes:
1. Calls `/api/messages/mark-read` when opening chat
2. Updates message status to 'read' (blue ticks) when receiving WebSocket notification
3. Persists read status from Cosmos DB

---

## 🔒 Environment Variables

Make sure these are set in Azure:

### Function App Settings:
- `PUBSUB_CONNECTION` - Azure Web PubSub connection string
- `PUBSUB_HUB` - Hub name (e.g., "chat")
- `COSMOS_CONNECTION` - Cosmos DB connection string
- `JWT_ISSUER` - Microsoft issuer URL
- `JWT_AUDIENCE` - Your client ID

### Frontend (.env):
- `REACT_APP_AZURE_CLIENT_ID` - Azure AD App Client ID
- `REACT_APP_AZURE_TENANT_ID` - Azure AD Tenant ID
- `REACT_APP_API_BASE_URL` - Backend URL

---

## 📊 Deployment Checklist

- [ ] Azure CLI installed
- [ ] Logged in to Azure (`az login`)
- [ ] Backend dependencies installed (`npm install` in chat_function_app)
- [ ] Frontend dependencies installed (`npm install` in root)
- [ ] Environment variables configured in Azure
- [ ] Run `quick-deploy.bat` from chat_function_app folder
- [ ] Test backend URL
- [ ] Push to GitHub (frontend auto-deploys)
- [ ] Test blue ticks working

---

## ✅ Success Indicators

After deployment, you should see:

1. **Backend deployed:**
   - All functions listed in Azure Portal
   - `markAsRead` function visible
   - No errors in logs

2. **Frontend working:**
   - App loads at Static Web App URL
   - Can login with Microsoft
   - Can send/receive messages

3. **Blue ticks working:**
   - User A sends messages → gray ticks ✓✓
   - User B opens chat → User A's ticks turn BLUE ✓✓💙
   - Refresh page → ticks still blue (persisted in DB)

---

## 🆘 Support

If deployment fails:
1. Check Azure Portal for error logs
2. Run: `az webapp log tail --name mychat-functions-1778393386`
3. Check browser console for frontend errors
4. Verify environment variables in Azure

---

**Made with ❤️ for production deployment**
