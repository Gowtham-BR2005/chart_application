const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

// Multi-tenant support: Use common endpoint for JWKS
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/common/discovery/v2.0/keys`,
  cache: true,
  rateLimit: true,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

async function verifyToken(req) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) throw new Error("No token");

  return new Promise((resolve, reject) => {
    // First decode to check issuer (multi-tenant)
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) return reject(new Error("Invalid token format"));

    // Extract tenant ID from issuer
    const issuerMatch = decoded.payload.iss.match(/https:\/\/login\.microsoftonline\.com\/([^\/]+)\/v2\.0/);
    const tenantId = issuerMatch ? issuerMatch[1] : null;

    // Verify token with flexible issuer validation
    jwt.verify(token, getKey, {
      audience: process.env.AZURE_AD_CLIENT_ID,
      // Accept tokens from any tenant (multi-tenant support)
      issuer: tenantId ? `https://login.microsoftonline.com/${tenantId}/v2.0` : undefined,
    }, (err, verified) => {
      if (err) return reject(err);
      resolve(verified);
    });
  });
}

module.exports = { verifyToken };
