@echo off
REM ========================================
REM GitHub Secrets Setup Script
REM Run this to add all secrets automatically
REM ========================================

echo.
echo ========================================
echo Adding GitHub Secrets for Deployment
echo ========================================
echo.

REM Check if gh CLI is installed
gh --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: GitHub CLI is not installed!
    echo.
    echo Install it from: https://cli.github.com/
    echo Then run: gh auth login
    echo Then run this script again.
    pause
    exit /b 1
)

REM Check if authenticated
gh auth status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Not authenticated with GitHub!
    echo.
    echo Run: gh auth login
    echo Then run this script again.
    pause
    exit /b 1
)

echo Adding Frontend Secrets...
echo.

gh secret set REACT_APP_AZURE_CLIENT_ID --body "8ae8251c-b72a-4687-8a12-8210373f3a16"
echo [1/12] REACT_APP_AZURE_CLIENT_ID added

gh secret set REACT_APP_AZURE_TENANT_ID --body "d91f6753-b409-4f30-80a7-a76ed56bff58"
echo [2/12] REACT_APP_AZURE_TENANT_ID added

gh secret set REACT_APP_AZURE_AUTHORITY --body "https://login.microsoftonline.com/common"
echo [3/12] REACT_APP_AZURE_AUTHORITY added

gh secret set REACT_APP_API_BASE_URL --body "https://mychat-functions-17783933867.azurewebsites.net/api"
echo [4/12] REACT_APP_API_BASE_URL added

gh secret set REACT_APP_AUTH_SCOPES --body "openid,profile,User.Read,email"
echo [5/12] REACT_APP_AUTH_SCOPES added

echo.
echo Adding Backend Secrets...
echo.

gh secret set AZURE_AD_CLIENT_ID --body "8ae8251c-b72a-4687-8a12-8210373f3a16"
echo [6/12] AZURE_AD_CLIENT_ID added

gh secret set AZURE_AD_TENANT_ID --body "d91f6753-b409-4f30-80a7-a76ed56bff58"
echo [7/12] AZURE_AD_TENANT_ID added

gh secret set COSMOS_ENDPOINT --body "https://mychat-cosmos-1778393386.documents.azure.com:443/"
echo [8/12] COSMOS_ENDPOINT added

REM Read COSMOS_KEY from .env file
for /f "tokens=2 delims==" %%a in ('findstr "COSMOS_KEY=" chat_function_app\.env') do set COSMOS_KEY=%%a
gh secret set COSMOS_KEY --body "%COSMOS_KEY%"
echo [9/12] COSMOS_KEY added

gh secret set COSMOS_DATABASE --body "chatdb"
echo [10/12] COSMOS_DATABASE added

REM Read PUBSUB_CONNECTION from .env file
for /f "tokens=2 delims==" %%a in ('findstr "PUBSUB_CONNECTION=" chat_function_app\.env') do set PUBSUB_CONN=%%a
gh secret set PUBSUB_CONNECTION --body "%PUBSUB_CONN%"
echo [11/12] PUBSUB_CONNECTION added

gh secret set PUBSUB_HUB --body "chat"
echo [12/12] PUBSUB_HUB added

echo.
echo ========================================
echo SUCCESS! All 12 secrets added!
echo ========================================
echo.
echo Next steps:
echo 1. Go to: https://github.com/Gowtham-BR2005/chart_application/actions
echo 2. Watch the deployments run
echo 3. Frontend will deploy to: https://kind-cliff-05ea40100.7.azurestaticapps.net
echo 4. Backend will deploy to: https://mychat-functions-17783933867.azurewebsites.net/api
echo.
pause
