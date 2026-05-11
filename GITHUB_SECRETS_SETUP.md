# GitHub Secrets Setup Guide

## 🔴 CRITICAL: You MUST Add These Secrets Now!

Go to: **https://github.com/Gowtham-BR2005/chart_application/settings/secrets/actions**

Click "New repository secret" and add **ALL** of these secrets:

---

## Frontend Secrets (React App)

### 1. REACT_APP_AZURE_CLIENT_ID
```
8ae8251c-b72a-4687-8a12-8210373f3a16
```

### 2. REACT_APP_AZURE_TENANT_ID
```
d91f6753-b409-4f30-80a7-a76ed56bff58
```

### 3. REACT_APP_AZURE_AUTHORITY
```
https://login.microsoftonline.com/common
```

### 4. REACT_APP_API_BASE_URL
```
https://mychat-functions-17783933867.azurewebsites.net/api
```

### 5. REACT_APP_AUTH_SCOPES
```
openid,profile,User.Read,email
```

---

## Backend Secrets (Azure Functions)

### 6. AZURE_AD_CLIENT_ID
```
8ae8251c-b72a-4687-8a12-8210373f3a16
```

### 7. AZURE_AD_TENANT_ID
```
d91f6753-b409-4f30-80a7-a76ed56bff58
```

### 8. COSMOS_ENDPOINT
```
https://mychat-cosmos-1778393386.documents.azure.com:443/
```

### 9. COSMOS_KEY
```
[Get from: E:\cc\chart_application\chat_function_app\.env file - line 10]
```

### 10. COSMOS_DATABASE
```
chatdb
```

### 11. PUBSUB_CONNECTION
```
[Get from: E:\cc\chart_application\chat_function_app\.env file - line 14]
```

### 12. PUBSUB_HUB
```
chat
```

---

## Azure Service Principal Secrets (Already Configured)

These should already exist from Azure setup:
- ✅ AZUREAPPSERVICE_CLIENTID_398563AE29344C76B33BCE92D9656ACA
- ✅ AZUREAPPSERVICE_TENANTID_6BCBD8AC2E8A413E93DE59C1B93DA5CA
- ✅ AZUREAPPSERVICE_SUBSCRIPTIONID_6D829D0381B8422AADA1949976047DA9

---

## How to Add Secrets (Step-by-Step)

1. **Open GitHub Secrets Page**:
   - Go to: https://github.com/Gowtham-BR2005/chart_application/settings/secrets/actions

2. **Click "New repository secret"**

3. **For each secret above**:
   - Copy the **Name** (e.g., `REACT_APP_AZURE_CLIENT_ID`)
   - Copy the **Value** (the long string below it)
   - Click "Add secret"

4. **Repeat for all 12 secrets**

---

## Verification

After adding secrets, check:

1. **GitHub Actions** → Should see 2 workflows running:
   - "Azure Static Web Apps CI/CD" (Frontend)
   - "Build and deploy Node.js project to Azure Function App" (Backend)

2. **Frontend URL**: https://kind-cliff-05ea40100.7.azurestaticapps.net
3. **Backend URL**: https://mychat-functions-17783933867.azurewebsites.net/api

---

## What Happens Next

1. ✅ Push to GitHub (DONE - just pushed!)
2. 🔴 Add GitHub Secrets (YOU NEED TO DO THIS NOW)
3. ⏳ GitHub Actions will deploy automatically
4. ✅ Your app will be live on Azure!

---

## Troubleshooting

### Frontend deploys but shows errors
- Check that all `REACT_APP_*` secrets are added correctly
- Verify the API URL ends with `/api`

### Backend fails to deploy
- Check that all Azure secrets (COSMOS_*, PUBSUB_*) are added
- Verify function app name is `mychat-functions-17783933867` (with the 7!)

### CORS errors
- Update `chat_function_app/host.json` CORS settings to include your Static Web App URL

---

## Current Deployment Status

| Component | Status | URL |
|-----------|--------|-----|
| Frontend | ⏳ Waiting for secrets | https://kind-cliff-05ea40100.7.azurestaticapps.net |
| Backend | ⏳ Waiting for secrets | https://mychat-functions-17783933867.azurewebsites.net/api |
| GitHub Actions | ✅ Configured | https://github.com/Gowtham-BR2005/chart_application/actions |

---

## Security Note

⚠️ **NEVER commit `.env` files to git!**

These secrets are stored securely in GitHub and injected during deployment. Your local `.env` files should remain in `.gitignore`.
