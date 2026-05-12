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

echo Adding Azure Service Principal Secrets for Deployment...
echo.

gh secret set AZUREAPPSERVICE_CLIENTID_398563AE29344C76B33BCE92D9656ACA --body "8ae8251c-b72a-4687-8a12-8210373f3a16"
echo [1/15] AZUREAPPSERVICE_CLIENTID added

gh secret set AZUREAPPSERVICE_TENANTID_6BCBD8AC2E8A413E93DE59C1B93DA5CA --body "d91f6753-b409-4f30-80a7-a76ed56bff58"
echo [2/15] AZUREAPPSERVICE_TENANTID added

gh secret set AZUREAPPSERVICE_SUBSCRIPTIONID_6D829D0381B8422AADA1949976047DA9 --body "e63db705-9a0e-43d3-b22a-e9f24b1408c4"
echo [3/15] AZUREAPPSERVICE_SUBSCRIPTIONID added

echo.
echo Adding Frontend Secrets...
echo.

gh secret set REACT_APP_AZURE_CLIENT_ID --body "8ae8251c-b72a-4687-8a12-8210373f3a16"
echo [4/15] REACT_APP_AZURE_CLIENT_ID added

gh secret set REACT_APP_AZURE_TENANT_ID --body "d91f6753-b409-4f30-80a7-a76ed56bff58"
echo [5/15] REACT_APP_AZURE_TENANT_ID added

gh secret set REACT_APP_AZURE_AUTHORITY --body "https://login.microsoftonline.com/common"
echo [6/15] REACT_APP_AZURE_AUTHORITY added

gh secret set REACT_APP_API_BASE_URL --body "https://mychat-functions-17783933867.azurewebsites.net/api"
echo [7/15] REACT_APP_API_BASE_URL added

gh secret set REACT_APP_AUTH_SCOPES --body "openid,profile,User.Read,email"
echo [8/15] REACT_APP_AUTH_SCOPES added

echo.
echo Adding Backend Secrets...
echo.

gh secret set AZURE_AD_CLIENT_ID --body "8ae8251c-b72a-4687-8a12-8210373f3a16"
echo [9/15] AZURE_AD_CLIENT_ID added

gh secret set AZURE_AD_TENANT_ID --body "d91f6753-b409-4f30-80a7-a76ed56bff58"
echo [10/15] AZURE_AD_TENANT_ID added

gh secret set COSMOS_ENDPOINT --body "https://mychat-cosmos-1778393386.documents.azure.com:443/"
echo [11/15] COSMOS_ENDPOINT added

REM Read COSMOS_KEY from .env file
for /f "tokens=2 delims==" %%a in ('findstr "COSMOS_KEY=" chat_function_app\.env') do set COSMOS_KEY=%%a
gh secret set COSMOS_KEY --body "%COSMOS_KEY%"
echo [12/15] COSMOS_KEY added

gh secret set COSMOS_DATABASE --body "chatdb"
echo [13/15] COSMOS_DATABASE added

REM Read PUBSUB_CONNECTION from .env file
for /f "tokens=2 delims==" %%a in ('findstr "PUBSUB_CONNECTION=" chat_function_app\.env') do set PUBSUB_CONN=%%a
gh secret set PUBSUB_CONNECTION --body "%PUBSUB_CONN%"
echo [14/15] PUBSUB_CONNECTION added

gh secret set PUBSUB_HUB --body "chat"
echo [15/15] PUBSUB_HUB added

echo.
echo ========================================
echo SUCCESS! All 15 secrets added!
echo ========================================
echo.
echo Next steps:
echo 1. Go to: https://github.com/Gowtham-BR2005/chart_application/actions
echo 2. Watch the deployments run
echo 3. Frontend will deploy to: https://kind-cliff-05ea40100.7.azurestaticapps.net
echo 4. Backend will deploy to: https://mychat-functions-17783933867.azurewebsites.net/api
echo.
pause
