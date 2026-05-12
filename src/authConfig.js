// Microsoft Azure AD Configuration for JWT Authentication
// Configuration values are loaded from environment variables (.env file)

export const msalConfig = {
  auth: {
    // Your Azure AD App Registration Client ID
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID || "8ae8251c-b72a-4687-8a12-8210373f3a16",

    // Your Azure AD Tenant ID
    authority: process.env.REACT_APP_AZURE_AUTHORITY || "https://login.microsoftonline.com/d91f6753-b409-4f30-80a7-a76ed56bff58",

    // The URL where Microsoft will redirect after authentication
    redirectUri: window.location.origin, // Will be http://localhost:3000 in development
  },
  cache: {
    // Store tokens in localStorage
    cacheLocation: process.env.REACT_APP_CACHE_LOCATION || "localStorage",

    // Recommended for IE11 or Edge compatibility
    storeAuthStateInCookie: process.env.REACT_APP_STORE_AUTH_STATE_IN_COOKIE === 'true' || true,
  }
};

// Scopes (permissions) requested from Microsoft
export const loginRequest = {
  scopes: process.env.REACT_APP_AUTH_SCOPES
    ? process.env.REACT_APP_AUTH_SCOPES.split(',')
    : [
        "openid",          // Required for authentication
        "profile",         // Get user's profile information
        "User.Read",       // Read user's profile from Microsoft Graph
        "email"            // Get user's email
      ]
};

// Backend API URL (optional - only needed if using backend)
export const API_BASE = process.env.REACT_APP_API_BASE_URL || "https://mychat-functions-1778393386.azurewebsites.net/api";

// Token claims to extract from JWT
export const tokenClaims = {
  idToken: [
    "aud",             // Audience (should match your clientId)
    "iss",             // Issuer (Microsoft)
    "iat",             // Issued at time
    "exp",             // Expiration time
    "name",            // User's full name
    "preferred_username", // User's email
    "oid",             // Object ID (unique user identifier)
    "tid"              // Tenant ID
  ]
};

// Validation: Warn if environment variables are missing
if (!process.env.REACT_APP_AZURE_CLIENT_ID) {
  console.warn('⚠️ REACT_APP_AZURE_CLIENT_ID not found in .env, using fallback value');
}

if (!process.env.REACT_APP_AZURE_TENANT_ID) {
  console.warn('⚠️ REACT_APP_AZURE_TENANT_ID not found in .env, using fallback value');
}

// Export helper to check if environment is properly configured
export const isConfigValid = () => {
  return !!(
    process.env.REACT_APP_AZURE_CLIENT_ID &&
    process.env.REACT_APP_AZURE_TENANT_ID &&
    process.env.REACT_APP_API_BASE_URL
  );
};

// Log configuration status in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Azure AD Configuration:');
  console.log('  Client ID:', msalConfig.auth.clientId.substring(0, 8) + '...');
  console.log('  Tenant ID:', msalConfig.auth.authority.split('/').pop().substring(0, 8) + '...');
  console.log('  API Base:', API_BASE);
  console.log('  Config Valid:', isConfigValid() ? '✅' : '⚠️ Using fallback values');
}
