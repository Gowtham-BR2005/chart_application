# Fix Multi-Tenant Authentication Error

## Error: AADSTS90123
**Problem**: Azure AD app is configured for single-tenant, but users from other tenants/personal accounts can't sign in.

## Solution: Enable Multi-Tenant Support

### Step 1: Update Azure Portal Configuration

1. Go to **Azure Portal** (https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click on your app: **chartApp** (Client ID: 8ae8251c-b72a-4687-8a12-8210373f3a16)
4. Click **Authentication** in the left menu
5. Scroll to **Supported account types**
6. Change from:
   - ❌ "Accounts in this organizational directory only (Single tenant)"
   
   To:
   - ✅ "Accounts in any organizational directory and personal Microsoft accounts (Multitenant and personal accounts)"

7. Click **Save** at the top

### Step 2: Update Redirect URIs (if needed)

While in the Authentication section:
1. Under **Platform configurations** → **Web**
2. Make sure these redirect URIs are added:
   - `http://localhost:3000`
   - `http://localhost:3000/`
   - `https://your-production-domain.azurestaticapps.net` (for production)

3. Under **Implicit grant and hybrid flows**, ensure:
   - ✅ ID tokens (used for implicit and hybrid flows)

4. Click **Save**

### What This Changes

**Before (Single-tenant)**:
- Only users from your Azure AD tenant (d91f6753-b409-4f30-80a7-a76ed56bff58) could sign in
- Personal Microsoft accounts were blocked
- Other organizations' accounts were blocked

**After (Multi-tenant)**:
- ✅ Any work/school account from any organization
- ✅ Personal Microsoft accounts (@outlook.com, @hotmail.com, @live.com)
- ✅ Multiple users can test the app

### Security Note

Multi-tenant is safe when:
- ✅ You validate users on the backend (we do this with JWT)
- ✅ Users must explicitly be added as contacts (search function)
- ✅ Each user is isolated in their own chat context
- ⚠️ For production, consider adding user approval flow or whitelisting

---

## After Making These Changes

1. Clear browser cache and localStorage:
   ```javascript
   // In browser console (F12)
   localStorage.clear();
   location.reload();
   ```

2. Try signing in again with the different account

3. Should work without the AADSTS90123 error!

---

## Alternative: Keep Single-Tenant

If you want to keep it single-tenant but allow specific external users:

1. Go to Azure Portal → Azure Active Directory
2. Click **Users** → **New guest user**
3. Enter the external user's email
4. Send invitation
5. They can then sign in with their account

This is more secure but requires manual approval for each user.
