# Azure Static Web App Deployment Guide

## What I Fixed

1. ✅ Created `staticwebapp.config.json` for SPA routing (fixes page refresh 404 errors)
2. ✅ Added environment variables to GitHub Actions workflow
3. ✅ Configured proper MIME types and security headers

## Next Steps - YOU NEED TO DO THIS

### Step 1: Add GitHub Secrets

Go to your GitHub repository settings and add these secrets:

1. Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`
2. Click "New repository secret" and add each of these:

```
Name: REACT_APP_AZURE_CLIENT_ID
Value: 8ae8251c-b72a-4687-8a12-8210373f3a16

Name: REACT_APP_AZURE_TENANT_ID  
Value: d91f6753-b409-4f30-80a7-a76ed56bff58

Name: REACT_APP_AZURE_AUTHORITY
Value: https://login.microsoftonline.com/common

Name: REACT_APP_API_BASE_URL
Value: https://mychat-functions-1778393386.azurewebsites.net/api

Name: REACT_APP_AUTH_SCOPES
Value: openid,profile,User.Read,email
```

⚠️ **IMPORTANT**: Without these secrets, your Azure deployment will fail or not connect to your backend!

### Step 2: Commit and Push

After I create the files, commit them:

```bash
git add staticwebapp.config.json .github/workflows/azure-static-web-apps-kind-cliff-05ea40100.yml DEPLOYMENT.md
git commit -m "fix: Configure Azure Static Web App with environment variables"
git push origin main
```

### Step 3: Verify Deployment

1. Go to GitHub Actions: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`
2. Watch the latest workflow run
3. Once complete, visit your Azure URL

## Common Issues & Solutions

### Issue: White blank page
**Cause**: Build failed or routing not configured  
**Solution**: Check GitHub Actions logs for build errors

### Issue: Works on home but 404 on refresh
**Cause**: Missing `staticwebapp.config.json`  
**Solution**: Already fixed! The file is now added.

### Issue: Cannot connect to backend
**Cause**: Environment variables not set in GitHub Secrets  
**Solution**: Follow Step 1 above

### Issue: CORS errors
**Cause**: Azure Functions not configured to allow your Static Web App origin  
**Solution**: Update your Azure Functions CORS settings to include your static web app URL

## Testing Locally Before Deployment

```bash
# Build production bundle
npm run build

# Serve the build folder (install serve globally if needed)
npx serve -s build
```

This simulates the Azure environment locally.

## Current Azure Configuration

- **Deployment URL**: Check Azure Portal for your static web app URL
- **Backend API**: https://mychat-functions-1778393386.azurewebsites.net/api
- **Build Output**: `build/` folder
- **Framework**: React (Create React App)

## Architecture

```
GitHub (push to main)
    ↓
GitHub Actions
    ↓
Build React App (with env vars)
    ↓
Deploy to Azure Static Web Apps
    ↓
Serve from CDN
```

## Monitoring

Check deployment status:
- GitHub Actions: See build logs
- Azure Portal → Static Web Apps → Your app → Deployment History

## Rollback

If deployment breaks, you can revert:

```bash
git revert HEAD
git push origin main
```

This will trigger a new deployment with the previous working code.
