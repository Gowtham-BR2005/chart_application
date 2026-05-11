# Add Redirect URI to Azure AD

## Quick Steps:

1. Go to: https://portal.azure.com
2. Navigate to: **Azure Active Directory**
3. Click: **App registrations**
4. Select: **chartApp** (Client ID: 8ae8251c-b72a-4687-8a12-8210373f3a16)
5. Click: **Authentication** in the left menu
6. Under **Single-page application**, click **Add URI**
7. Add these URIs:
   ```
   https://kind-cliff-05ea40100.azurestaticapps.net
   https://mychat-functions-1778393386.azurewebsites.net
   ```
8. Click **Save**

## Screenshot Guide:

### Step 1: Find App Registrations
![App Registrations](https://docs.microsoft.com/en-us/azure/active-directory/develop/media/quickstart-register-app/portal-02-app-reg-01.png)

### Step 2: Authentication Tab
![Authentication](https://docs.microsoft.com/en-us/azure/active-directory/develop/media/quickstart-configure-app-access-web-apis/portal-02-authentication-01.png)

### Step 3: Add Redirect URI
- Click **Add URI** under "Single-page application"
- Paste: `https://kind-cliff-05ea40100.azurestaticapps.net`
- Click **Save**

## Verify it worked:
After saving, try opening your app again:
https://kind-cliff-05ea40100.azurestaticapps.net

You should be able to login!

## Troubleshooting:

If you still get redirect_uri error:
1. Make sure you added it under **Single-page application** (not Web)
2. Make sure there's no trailing slash
3. Wait 1-2 minutes for changes to propagate
4. Clear browser cache and try again

## Your Current Redirect URIs should be:
- http://localhost:3000 (for local development)
- https://kind-cliff-05ea40100.azurestaticapps.net (for production)
- https://mychat-functions-1778393386.azurewebsites.net (for backend)
