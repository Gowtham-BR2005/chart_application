# How to Check JWT Tokens - Complete Guide

## 1. Check JWT in Browser (Local Storage)

### Method 1: Browser DevTools
1. Open your app at http://localhost:3000
2. Sign in with Microsoft
3. Press **F12** to open Developer Tools
4. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
5. Expand **Local Storage** → `http://localhost:3000`
6. Look for keys starting with:
   - `msal.*` - These contain your JWT tokens
   - `msal.token.keys.*` - Token metadata
   - `msal.account.keys` - Account information

### What You'll See:
```
Key: msal.token.keys.{clientId}
Value: {
  "accessToken": ["key1", "key2"],
  "idToken": ["key3"],
  "refreshToken": ["key4"]
}
```

### Method 2: Browser Console
1. Open DevTools Console (F12 → Console tab)
2. Paste this code:
```javascript
// Get all localStorage items
Object.keys(localStorage)
  .filter(key => key.startsWith('msal'))
  .forEach(key => {
    console.log(key, ':', localStorage.getItem(key));
  });
```

### Method 3: Check in React App Console
After signing in, check the browser console logs:
```
✅ Authentication successful via redirect
📜 JWT Payload: {
  aud: "8ae8251c-b72a-4687-8a12-8210373f3a16",
  iss: "https://login.microsoftonline.com/.../v2.0",
  name: "Your Name",
  preferred_username: "your.email@example.com",
  exp: 1234567890,
  ...
}
⏰ Token expires: Mon Jan 01 2024 12:00:00
```

---

## 2. Decode JWT Token

### Online Method (Quick):
1. Copy the token from localStorage or console
2. Go to **https://jwt.io/**
3. Paste the token in the "Encoded" section
4. View decoded **Header** and **Payload** on the right

### Browser Console Method:
```javascript
// Get the token from MSAL
const accounts = msalInstance.getAllAccounts();
if (accounts.length > 0) {
  msalInstance.acquireTokenSilent({
    scopes: ["User.Read"],
    account: accounts[0]
  }).then(response => {
    // Decode the token
    const token = response.idToken;
    const parts = token.split('.');
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    
    console.log('Header:', header);
    console.log('Payload:', payload);
    console.log('Full Token:', token);
  });
}
```

---

## 3. Check JWT Activity in Azure Portal

### A. Sign-in Logs (See Authentication Events)

1. Go to **Azure Portal**: https://portal.azure.com
2. Navigate to: **Azure Active Directory** → **Monitoring** → **Sign-in logs**

**What you'll see:**
- All sign-in attempts
- Date/time of authentication
- User who signed in
- Application used (chartApp)
- Success/failure status
- IP address
- Device/browser information

**Filter Options:**
- Date range
- User (search by email)
- Application (filter by chartApp)
- Status (Success/Failure)

### B. Token Details in Sign-in Logs

1. Click on any sign-in event
2. Go to **Authentication Details** tab
3. You'll see:
   - **Authentication method** (OAuth 2.0)
   - **Token issued** ✅
   - **Token lifetime** (usually 1 hour)
   - **Scopes granted** (User.Read, openid, profile, email)

### C. Check Token Configuration

**Path**: Azure Portal → App Registrations → chartApp → Token configuration

**What's configured:**
- Optional claims added to ID token
- Optional claims added to Access token
- Token version (v2.0)

### D. Check Token via Microsoft Graph Explorer

1. Go to: https://developer.microsoft.com/en-us/graph/graph-explorer
2. Sign in with your account
3. Click **Access token** in the header
4. You'll see:
   - Your current JWT token
   - Decoded claims
   - Expiration time

---

## 4. Programmatically Access JWT in Your App

### Add This to Auth.js for Debugging:

```javascript
// Add this function to inspect tokens
const inspectToken = async () => {
  const accounts = msalInstance.getAllAccounts();
  
  if (accounts.length === 0) {
    console.log('❌ No accounts found');
    return;
  }

  try {
    const response = await msalInstance.acquireTokenSilent({
      scopes: ["User.Read"],
      account: accounts[0]
    });

    console.log('🔑 Token Information:');
    console.log('==================');
    console.log('Access Token:', response.accessToken);
    console.log('ID Token:', response.idToken);
    console.log('Expires On:', response.expiresOn);
    
    // Decode ID Token
    if (response.idToken) {
      const parts = response.idToken.split('.');
      const payload = JSON.parse(atob(parts[1]));
      
      console.log('\n📜 ID Token Claims:');
      console.log('==================');
      console.log('User ID (oid):', payload.oid);
      console.log('Name:', payload.name);
      console.log('Email:', payload.preferred_username);
      console.log('Tenant ID:', payload.tid);
      console.log('Issued At:', new Date(payload.iat * 1000));
      console.log('Expires At:', new Date(payload.exp * 1000));
      console.log('Audience:', payload.aud);
      console.log('Issuer:', payload.iss);
      
      // Check token validity
      const now = Math.floor(Date.now() / 1000);
      if (now < payload.exp) {
        console.log('✅ Token is valid');
        console.log(`⏰ Expires in ${Math.floor((payload.exp - now) / 60)} minutes`);
      } else {
        console.log('❌ Token has expired');
      }
    }
  } catch (error) {
    console.error('Error getting token:', error);
  }
};

// Call this in browser console after login:
// window.inspectToken = inspectToken;
```

---

## 5. Azure Monitor & Diagnostics

### Application Insights (If Configured)

1. Go to: Azure Portal → your App Service/Function App
2. Navigate to: **Monitoring** → **Application Insights**
3. Click **Logs**
4. Run this query:

```kusto
requests
| where timestamp > ago(1d)
| where url contains "login" or url contains "token"
| project timestamp, url, resultCode, duration
| order by timestamp desc
```

### Azure AD Audit Logs

1. Azure Portal → **Azure Active Directory**
2. **Monitoring** → **Audit logs**
3. Filter by:
   - Service: **Core Directory**
   - Category: **ApplicationManagement**
   - Activity: **Update application**

---

## 6. Create a Debug Component

Add this to your app for easy token inspection:

```javascript
// src/components/TokenDebugger.js
import React, { useState } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '../authConfig';

const msalInstance = new PublicClientApplication(msalConfig);

export default function TokenDebugger() {
  const [tokenInfo, setTokenInfo] = useState(null);

  const showToken = async () => {
    const accounts = msalInstance.getAllAccounts();
    
    if (accounts.length === 0) {
      alert('No active account');
      return;
    }

    try {
      const response = await msalInstance.acquireTokenSilent({
        scopes: ["User.Read"],
        account: accounts[0]
      });

      const parts = response.idToken.split('.');
      const payload = JSON.parse(atob(parts[1]));
      
      setTokenInfo({
        token: response.idToken,
        payload: payload,
        expiresOn: response.expiresOn,
        account: accounts[0]
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to get token: ' + error.message);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 20, 
      right: 20, 
      background: '#fff', 
      padding: 20, 
      borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      maxWidth: 400,
      maxHeight: 500,
      overflow: 'auto'
    }}>
      <h3>🔍 Token Debugger</h3>
      <button onClick={showToken}>Show Current Token</button>
      
      {tokenInfo && (
        <div style={{ marginTop: 20, fontSize: 12 }}>
          <h4>User Info:</h4>
          <pre>{JSON.stringify(tokenInfo.account, null, 2)}</pre>
          
          <h4>Token Payload:</h4>
          <pre>{JSON.stringify(tokenInfo.payload, null, 2)}</pre>
          
          <h4>Expires:</h4>
          <p>{tokenInfo.expiresOn?.toLocaleString()}</p>
          
          <h4>Raw Token:</h4>
          <textarea 
            value={tokenInfo.token} 
            readOnly 
            style={{ width: '100%', height: 100, fontSize: 10 }}
          />
          <button onClick={() => {
            navigator.clipboard.writeText(tokenInfo.token);
            alert('Token copied to clipboard!');
          }}>
            Copy Token
          </button>
        </div>
      )}
    </div>
  );
}
```

Add to your App.js:
```javascript
import TokenDebugger from './components/TokenDebugger';

// In your render:
{authenticated && <TokenDebugger />}
```

---

## 7. Common JWT Claims Explained

When you decode the token, here's what each field means:

```json
{
  "aud": "8ae8251c-b72a-4687-8a12-8210373f3a16",  // Audience - your app's client ID
  "iss": "https://login.microsoftonline.com/TENANT_ID/v2.0",  // Issuer - Microsoft
  "iat": 1704067200,  // Issued At - when token was created (Unix timestamp)
  "exp": 1704070800,  // Expiration - when token expires (Unix timestamp)
  "name": "John Doe",  // User's full name
  "preferred_username": "john@example.com",  // User's email/UPN
  "oid": "00000000-0000-0000-0000-000000000000",  // Object ID - unique user ID
  "tid": "d91f6753-b409-4f30-80a7-a76ed56bff58",  // Tenant ID - your organization
  "sub": "AAAAAAAAAAAAAAAAAAAAABbaDgJJM5A",  // Subject - another user identifier
  "ver": "2.0",  // Token version
  "azp": "8ae8251c-b72a-4687-8a12-8210373f3a16",  // Authorized party
  "scp": "User.Read openid profile email"  // Scopes/permissions
}
```

---

## Quick Checklist

- [ ] Check localStorage in browser DevTools (Application tab)
- [ ] View console logs after signing in
- [ ] Copy token and decode at jwt.io
- [ ] Check Azure AD Sign-in logs for authentication events
- [ ] Verify token configuration in App Registration
- [ ] Use Microsoft Graph Explorer to see your token
- [ ] Add TokenDebugger component for easy access
- [ ] Monitor token expiration time

---

## Need Help?

If you see errors:
- **Token expired**: Normal - tokens expire after 1 hour, MSAL auto-refreshes
- **Invalid audience**: Check clientId matches in authConfig.js and Azure
- **Missing claims**: Configure optional claims in Azure Token configuration
- **CORS errors**: Configure CORS in backend Azure Function/App Service
