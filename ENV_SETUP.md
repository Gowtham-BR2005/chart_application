# Environment Variables Setup Guide

This project uses environment variables to store sensitive configuration like Azure AD credentials and API endpoints.

## Quick Setup

### 1. Copy the Example File
```bash
cp .env.example .env
```

### 2. Fill in Your Values

Open `.env` and replace the placeholder values:

```env
# Azure AD Configuration
REACT_APP_AZURE_CLIENT_ID=your-actual-client-id-here
REACT_APP_AZURE_TENANT_ID=your-actual-tenant-id-here
REACT_APP_AZURE_AUTHORITY=https://login.microsoftonline.com/your-tenant-id-here

# Backend API Configuration
REACT_APP_API_BASE_URL=https://your-backend-url.azurewebsites.net/api

# Authentication Scopes (comma-separated, no spaces)
REACT_APP_AUTH_SCOPES=openid,profile,User.Read,email

# Cache Configuration
REACT_APP_CACHE_LOCATION=localStorage
REACT_APP_STORE_AUTH_STATE_IN_COOKIE=true
```

### 3. Restart Development Server

**Important**: Environment variables are only loaded when you start the dev server.

```bash
# Stop the current server (Ctrl+C)
npm start
```

---

## Where to Find Your Values

### REACT_APP_AZURE_CLIENT_ID
1. Go to **Azure Portal** → **App Registrations**
2. Click on your app (**chartApp**)
3. Copy the **Application (client) ID** from the Overview page

### REACT_APP_AZURE_TENANT_ID
1. Same page as above
2. Copy the **Directory (tenant) ID**

### REACT_APP_AZURE_AUTHORITY
- Format: `https://login.microsoftonline.com/{TENANT_ID}`
- Replace `{TENANT_ID}` with your actual tenant ID

### REACT_APP_API_BASE_URL
- Your backend API URL
- Example: `https://mychat-functions.azurewebsites.net/api`

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_AZURE_CLIENT_ID` | Azure AD Application Client ID | `8ae8251c-b72a-4687-8a12-8210373f3a16` |
| `REACT_APP_AZURE_TENANT_ID` | Azure AD Tenant/Directory ID | `d91f6753-b409-4f30-80a7-a76ed56bff58` |
| `REACT_APP_AZURE_AUTHORITY` | Azure AD Authority URL | `https://login.microsoftonline.com/TENANT_ID` |
| `REACT_APP_API_BASE_URL` | Backend API Base URL | `https://api.example.com/api` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_AUTH_SCOPES` | Comma-separated OAuth scopes | `openid,profile,User.Read,email` |
| `REACT_APP_CACHE_LOCATION` | Where to store tokens | `localStorage` |
| `REACT_APP_STORE_AUTH_STATE_IN_COOKIE` | Store auth state in cookies | `true` |

---

## Security Best Practices

### ✅ DO:
- Keep `.env` file local (it's in `.gitignore`)
- Use different values for dev/staging/production
- Share `.env.example` in the repository
- Rotate credentials if exposed
- Use environment-specific values

### ❌ DON'T:
- Commit `.env` to git
- Share `.env` file publicly
- Hardcode credentials in source code
- Use production credentials in development
- Include sensitive data in `.env.example`

---

## Different Environments

### Development (.env.local)
```env
REACT_APP_AZURE_CLIENT_ID=dev-client-id
REACT_APP_API_BASE_URL=http://localhost:7071/api
```

### Staging (.env.staging)
```env
REACT_APP_AZURE_CLIENT_ID=staging-client-id
REACT_APP_API_BASE_URL=https://staging-api.azurewebsites.net/api
```

### Production (.env.production)
```env
REACT_APP_AZURE_CLIENT_ID=prod-client-id
REACT_APP_API_BASE_URL=https://api.yourdomain.com/api
```

**Load specific environment:**
```bash
# Development (default)
npm start

# Staging
REACT_APP_ENV=staging npm start

# Production build
npm run build
```

---

## Troubleshooting

### Error: "REACT_APP_AZURE_CLIENT_ID not found"

**Solution**: 
1. Make sure `.env` file exists in project root
2. Restart the development server
3. Variables must start with `REACT_APP_` for Create React App

### Error: "Invalid client ID"

**Solution**: 
1. Double-check the Client ID in Azure Portal
2. Make sure there are no extra spaces
3. Verify the value in `.env` matches Azure

### Changes Not Reflecting

**Solution**: 
1. Stop the dev server (Ctrl+C)
2. Restart: `npm start`
3. Environment variables are loaded at startup only

### Environment Variables Not Working

**Checklist**:
- [ ] File is named `.env` (not `.env.txt`)
- [ ] File is in project root (same level as `package.json`)
- [ ] Variables start with `REACT_APP_`
- [ ] No quotes around values
- [ ] No spaces around `=`
- [ ] Dev server was restarted

---

## Verification

### Check if Environment Variables are Loaded

Open browser console after starting the app. You should see:

```
🔧 Azure AD Configuration:
  Client ID: 8ae8251c...
  Tenant ID: d91f6753...
  API Base: https://mychat-functions...
  Config Valid: ✅
```

If you see `⚠️ Using fallback values`, your `.env` file isn't loaded properly.

### Test in Browser Console

```javascript
// Check if env variables are available
console.log(process.env.REACT_APP_AZURE_CLIENT_ID);
console.log(process.env.REACT_APP_API_BASE_URL);

// Should log your actual values, not undefined
```

---

## Azure Static Web Apps / Production

For production deployment on Azure Static Web Apps:

### 1. Configure in Azure Portal

1. Go to your **Static Web App** in Azure Portal
2. Click **Configuration** in the left menu
3. Click **+ Add**
4. Add each environment variable:
   - **Name**: `REACT_APP_AZURE_CLIENT_ID`
   - **Value**: Your production client ID

### 2. Build Configuration

The variables will be injected during build time by Azure.

---

## Support

If you encounter issues:
1. Check this guide thoroughly
2. Verify values in Azure Portal
3. Check browser console for error messages
4. Ensure dev server was restarted

For more information:
- [Create React App: Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Azure Portal](https://portal.azure.com)
