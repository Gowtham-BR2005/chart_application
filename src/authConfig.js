// Microsoft Azure AD Configuration for JWT Authentication
export const msalConfig = {
  auth: {
    // Your Azure AD App Registration Client ID
    clientId: "8ae8251c-b72a-4687-8a12-8210373f3a16",

    // Your Azure AD Tenant ID
    authority: "https://login.microsoftonline.com/d91f6753-b409-4f30-80a7-a76ed56bff58",

    // The URL where Microsoft will redirect after authentication
    redirectUri: window.location.origin, // Will be http://localhost:3000 in development
  },
  cache: {
    cacheLocation: "localStorage", // Store tokens in localStorage
    storeAuthStateInCookie: true, // Recommended for IE11 or Edge compatibility
  }
};

// Scopes (permissions) requested from Microsoft
export const loginRequest = {
  scopes: [
    "openid",          // Required for authentication
    "profile",         // Get user's profile information
    "User.Read",       // Read user's profile from Microsoft Graph
    "email"            // Get user's email
  ]
};

// Backend API URL (optional - only needed if using backend)
export const API_BASE = "https://mychat-functions-1778393386.azurewebsites.net/api";

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
