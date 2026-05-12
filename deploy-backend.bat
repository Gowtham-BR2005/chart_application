@echo off
REM ========================================
REM Azure Functions Backend Deployment Script
REM Deploy backend directly to Azure Functions
REM ========================================

echo.
echo ========================================
echo Deploying Backend to Azure Functions
echo ========================================
echo.

REM Check if Azure CLI is installed
az --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Azure CLI is not installed!
    echo.
    echo Install it from: https://aka.ms/installazurecliwindows
    echo Then run: az login
    echo Then run this script again.
    pause
    exit /b 1
)

REM Check if authenticated
az account show >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Not authenticated with Azure!
    echo.
    echo Run: az login
    echo Then run this script again.
    pause
    exit /b 1
)

echo Authenticated with Azure successfully!
echo.

REM Set variables
set FUNCTION_APP_NAME=mychat-functions-17783933867
set RESOURCE_GROUP=mychat-resources
set BACKEND_PATH=chat_function_app

echo Function App: %FUNCTION_APP_NAME%
echo Resource Group: %RESOURCE_GROUP%
echo Backend Path: %BACKEND_PATH%
echo.

echo [1/5] Navigating to backend directory...
cd %BACKEND_PATH%
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Backend directory not found!
    pause
    exit /b 1
)

echo [2/5] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed!
    cd ..
    pause
    exit /b 1
)

echo [3/5] Building backend...
call npm run build --if-present

echo [4/5] Deploying to Azure Functions...
call func azure functionapp publish %FUNCTION_APP_NAME% --javascript
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Deployment failed!
    cd ..
    pause
    exit /b 1
)

echo [5/5] Setting environment variables...
call az functionapp config appsettings set --name %FUNCTION_APP_NAME% --resource-group %RESOURCE_GROUP% --settings AZURE_AD_CLIENT_ID="8ae8251c-b72a-4687-8a12-8210373f3a16" AZURE_AD_TENANT_ID="d91f6753-b409-4f30-80a7-a76ed56bff58" COSMOS_ENDPOINT="https://mychat-cosmos-1778393386.documents.azure.com:443/" COSMOS_DATABASE="chatdb" PUBSUB_HUB="chat" >nul

cd ..

echo.
echo ========================================
echo SUCCESS! Backend deployed!
echo ========================================
echo.
echo Backend URL: https://%FUNCTION_APP_NAME%.azurewebsites.net/api
echo.
echo Next steps:
echo 1. Enable backend in frontend: Set ENABLE_BACKEND = true in src/App.js
echo 2. Commit and push the change
echo 3. Test the app at: https://kind-cliff-05ea40100.7.azurestaticapps.net
echo.
pause
