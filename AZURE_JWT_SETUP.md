# Azure AD JWT Authentication Setup Guide

This guide explains how to configure Azure Active Directory for JWT authentication in the Chat App.

## Prerequisites
- Access to Azure Portal (portal.azure.com)
- App Registration already created (chartApp)
- Client ID: `8ae8251c-b72a-4687-8a12-8210373f3a16`
- Tenant ID: `d91f6753-b409-4f30-80a7-a76ed56bff58`

---

## Step 1: Configure Token Claims (Required for JWT)

JWT tokens need to include user information. Add optional claims:

1. Go to **Azure Portal** → **App Registrations** → **chartApp**
2. Click **Token configuration** in left sidebar
3. Click **Add optional claim**

### Add ID Token Claims:
- Select token type: **ID**
- Select these claims:
  - ✅ `email`
  - ✅ `preferred_username`
  - ✅ `family_name`
  - ✅ `given_name`
- Click **Add**
- If prompted, check "Turn on Microsoft Graph profile permission" → **Add**

### Add Access Token Claims:
- Repeat the process for token type: **Access**
- Add the same claims

**Why?** These claims are embedded in the JWT and used by your app to identify the user.

---

## Step 2: Configure API Permissions

Ensure these permissions are granted:

1. Click **API permissions** in left sidebar
2. Verify these are added:
   - ✅ `User.Read` (Microsoft Graph)
   - ✅ `openid` (Microsoft Graph)
   - ✅ `profile` (Microsoft Graph)
   - ✅ `email` (Microsoft Graph)

3. **IMPORTANT**: Click **Grant admin consent for [Your Org]**
   - This allows users to sign in without admin approval

---

## Step 3: Verify Redirect URIs

1. Click **Authentication** in left sidebar
2. Under **Platform configurations** → **Single-page application**
3. Ensure these redirect URIs are added:
   - ✅ `http://localhost:3000`
   - ✅ `http://localhost:5500` (optional, for other dev servers)
   - ✅ Your production URL (e.g., `https://yourapp.azurewebsites.net`)

4. Under **Implicit grant and hybrid flows**:
   - ✅ Check **ID tokens**
   - ✅ Check **Access tokens**

---

## Step 4: Configure Token Settings

1. Click **Token configuration** in left sidebar
2. Verify token lifetime settings in **Manifest** (optional):
   ```json
   {
     "accessTokenAcceptedVersion": 2,
     "signInAudience": "AzureADMyOrg"
   }
   ```

---

## Step 5: Test JWT Token Structure

After implementing the code, you can decode the JWT token to verify it contains the correct information.

### JWT Token Structure:
```
Header.Payload.Signature
```

### Expected Payload Claims:
```json
{
  "aud": "8ae8251c-b72a-4687-8a12-8210373f3a16",  // Your client ID
  "iss": "https://login.microsoftonline.com/.../v2.0",  // Microsoft issuer
  "iat": 1234567890,  // Issued at (timestamp)
  "exp": 1234571490,  // Expires at (timestamp)
  "name": "John Doe",  // User's full name
  "preferred_username": "john@example.com",  // User's email
  "oid": "00000000-0000-0000-0000-000000000000",  // User's unique ID
  "tid": "d91f6753-b409-4f30-80a7-a76ed56bff58",  // Your tenant ID
  "sub": "...",  // Subject (user identifier)
  "ver": "2.0"  // Token version
}
```

You can decode JWT tokens at: https://jwt.io/

---

## Step 6: Backend Validation (If Using Backend API)

If you have a backend API that needs to validate these JWT tokens:

### Install Dependencies:
```bash
npm install jsonwebtoken jwks-rsa
```

### Validation Code Example:
```javascript
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

// Middleware to validate JWT
function validateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const options = {
    audience: '8ae8251c-b72a-4687-8a12-8210373f3a16', // Your client ID
    issuer: `https://login.microsoftonline.com/d91f6753-b409-4f30-80a7-a76ed56bff58/v2.0`,
    algorithms: ['RS256']
  };

  jwt.verify(token, getKey, options, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = decoded;
    next();
  });
}
```

---

## Step 7: CORS Configuration (For Backend API)

If you're calling a backend API from localhost:

1. Go to your **Azure Function App** or **App Service**
2. Navigate to **CORS** settings
3. Add allowed origins:
   - `http://localhost:3000`
   - `http://localhost:5500`
4. Click **Save**

---

## Testing the Implementation

### 1. Test Login Flow:
- Click "Sign in with Microsoft"
- You'll be redirected to Microsoft login
- After successful login, you're redirected back with JWT token

### 2. Verify Token in Console:
Check browser console for logs:
```
✅ Authentication successful via redirect
📜 JWT Payload: { ... }
⏰ Token expires: [Date]
```

### 3. Decode Token:
- Copy the token from console
- Go to https://jwt.io/
- Paste token to verify structure and claims

### 4. Check Token Expiration:
- ID tokens typically expire in 1 hour
- Access tokens can be refreshed silently
- MSAL handles refresh automatically

---

## Troubleshooting

### Error: "AADSTS50011: Reply URL mismatch"
**Fix**: Add your exact redirect URI in Azure Portal → Authentication

### Error: "CORS policy blocked"
**Fix**: Configure CORS in backend Azure Function/App Service

### Error: "interaction_in_progress"
**Fix**: Refresh the page to clear stale authentication state

### Token doesn't contain email/name
**Fix**: Configure optional claims in Token configuration (Step 1)

### "Invalid token" errors in backend
**Fix**: Verify audience and issuer match in validation code

---

## Security Best Practices

1. **Never expose Client Secret** (not needed for SPA with MSAL)
2. **Always validate tokens on backend** - Don't trust frontend
3. **Use HTTPS in production** - Azure Static Web Apps provides this
4. **Set appropriate token lifetimes** - Balance security vs UX
5. **Implement token refresh** - MSAL handles this automatically
6. **Log authentication events** - For security auditing

---

## Production Checklist

- [ ] Update `redirectUri` in authConfig.js to production URL
- [ ] Add production URL to Azure redirect URIs
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS (required by Azure AD)
- [ ] Test authentication flow end-to-end
- [ ] Verify JWT validation in backend
- [ ] Set up monitoring and logging
- [ ] Review token expiration settings

---

## Additional Resources

- [Microsoft Authentication Library (MSAL) Docs](https://learn.microsoft.com/en-us/azure/active-directory/develop/msal-overview)
- [JWT.io - Token Decoder](https://jwt.io/)
- [Azure AD Token Reference](https://learn.microsoft.com/en-us/azure/active-directory/develop/access-tokens)
- [MSAL.js Browser Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-browser-samples)
