export const msalConfig = {
  auth: {
    clientId: "8ae8251c-b72a-4687-8a12-8210373f3a16",
    authority: "https://login.microsoftonline.com/d91f6753-b409-4f30-80a7-a76ed56bff58",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true,
  }
};

export const loginRequest = {
  scopes: ["openid", "profile", "User.Read"]
};

export const API_BASE = "https://mychat-functions-1778393386.azurewebsites.net/api";