# 🚀 Quick Start Guide

## ✅ Status: All Systems Running!

### Backend API
- **URL**: http://localhost:7071/api
- **Status**: ✅ Running
- **Database**: Cosmos DB connected
- **WebSocket**: Azure Web PubSub connected

### Frontend App
- **URL**: http://localhost:3000
- **Status**: ✅ Running
- **Authentication**: Azure AD configured
- **Backend**: Connected to local API

---

## 📱 How to Use the App

### 1. Open the App
Open your browser and go to:
```
http://localhost:3000
```

### 2. Sign In
1. Click "Sign in with Microsoft"
2. Sign in with your Microsoft account
3. Allow permissions when asked
4. You'll be automatically registered in the system

### 3. Find Friends
1. Type a username in the search bar at the top
2. If the user exists, they'll appear in your contact list
3. Click on their name to open the chat

### 4. Send Messages
1. Select a contact
2. Type your message in the input box at the bottom
3. Press Enter or click the send button
4. Your message will be sent instantly!

### 5. Receive Messages
- Messages appear in real-time (no refresh needed)
- You'll see unread counts on contacts
- Last message preview in sidebar

---

## 🧪 Test with Multiple Users

### Option 1: Two Browsers
1. Open Chrome (normal)
2. Open Chrome Incognito
3. Login as different Microsoft accounts in each
4. Search for each other and chat!

### Option 2: Two Devices
1. Open http://localhost:3000 on your computer
2. Get your local IP: `ipconfig` (look for IPv4)
3. Open http://YOUR_IP:3000 on your phone
4. Login as different users and chat!

---

## 📊 What's Happening Behind the Scenes

```
User Action          →  Frontend      →  Backend        →  Database
─────────────────────────────────────────────────────────────────────
Click "Sign In"      →  Auth.js       →  Azure AD       →  JWT Token
                     →  App.js        →  /register      →  Cosmos DB (users)
                     →  App.js        →  /negotiate     →  Web PubSub

Search "john"        →  Sidebar.js    →  /users/find    →  Cosmos DB (users)

Send "Hello"         →  ChatWindow.js →  /messages      →  Cosmos DB (messages)
                     →  App.js        →  WebSocket      →  Web PubSub broadcast

Receive message      ←  WebSocket     ←  Web PubSub     ←  Real-time delivery
                     →  ChatWindow.js →  Display        →  UI update
```

---

## 🔍 Check the Console

### Browser Console (F12)
You should see:
```
🔐 JWT Token received
📜 JWT Payload: {oid: "...", name: "...", ...}
⏰ Token expires: ...
🔧 Azure AD Configuration: ✅
🔍 Checking if user is registered in backend...
✅ User registered successfully
🔌 Connecting to WebSocket...
✅ WebSocket connected
```

### Backend Terminal
You should see:
```
Functions:
  createGroup: [POST] http://localhost:7071/api/groups
  findUser: [GET] http://localhost:7071/api/users/find
  findUserById: [GET] http://localhost:7071/api/users/find-by-id
  getMessages: [GET] http://localhost:7071/api/messages
  negotiate: [GET] http://localhost:7071/api/negotiate
  registerUser: [POST] http://localhost:7071/api/users/register
  sendMessage: [POST] http://localhost:7071/api/messages
```

---

## ⚡ Pro Tips

### Tip 1: Auto-Registration
- You don't need to manually register
- First login automatically creates your account
- Username is generated from your email

### Tip 2: Real-Time Updates
- No need to refresh the page
- Messages appear instantly
- WebSocket keeps connection alive

### Tip 3: Multiple Chats
- Search and add multiple users
- Switch between conversations
- Message history is saved

### Tip 4: Testing Solo
- You can search for your own username
- Send messages to yourself
- Great for testing features!

---

## 🐛 Common Issues

### Issue: "Backend not available" warning
**Fix**: Check if backend is running at http://localhost:7071

### Issue: Can't find users
**Fix**: 
1. Make sure they're registered (logged in at least once)
2. Search by their exact username
3. Check backend logs for errors

### Issue: Messages not sending
**Fix**:
1. Check browser console for errors
2. Verify WebSocket connection (should see ✅ WebSocket connected)
3. Check backend terminal for API errors

### Issue: Login loops or errors
**Fix**:
1. Clear browser cache and localStorage
2. Check Azure AD configuration
3. Verify environment variables in .env

---

## 📞 Need Help?

### Check Documentation
- `PROJECT_COMPLETE.md` - Full overview
- `BACKEND_SETUP.md` - Backend configuration
- `ENV_SETUP.md` - Environment variables
- `AZURE_JWT_SETUP.md` - Azure AD setup

### Check Logs
- Browser console (F12)
- Backend terminal
- Network tab in DevTools

### Verify Configuration
- `.env` file in frontend
- `local.settings.json` in backend
- Azure Portal for resource status

---

## 🎉 Enjoy Your Chat App!

You now have a fully functional WhatsApp-style chat application with:
- ✅ Real-time messaging
- ✅ Secure authentication
- ✅ Message persistence
- ✅ User search
- ✅ Professional UI

**Start chatting at http://localhost:3000** 🚀
