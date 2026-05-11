@echo off
REM Keep window open even if script fails
if not "%1"=="am_admin" (powershell start -verb runas '%0' am_admin & exit /b)

color 0B
title Quick Deploy - Backend to Azure

echo ========================================
echo   QUICK DEPLOY - BACKEND ONLY
echo   (Backend Functions to Azure)
echo ========================================
echo.

REM Change to script directory
cd /d "%~dp0"

REM Check if Azure CLI is installed
where az >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Azure CLI not found!
    echo.
    echo Please install Azure CLI:
    echo https://aka.ms/installazurecliwindows
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo [1/4] Installing dependencies...
echo Please wait...
call npm install --production
if %errorlevel% neq 0 (
    echo.
    echo ERROR: npm install failed!
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo.
echo [2/4] Creating deployment package...
if exist deployment.zip (
    echo Removing old deployment.zip...
    del /q deployment.zip
)

echo Creating zip file (this may take a moment)...
powershell -Command "Get-ChildItem -Path . -Exclude node_modules,deployment.zip,*.log | Compress-Archive -DestinationPath .\deployment.zip -Force"
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to create zip file!
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo.
echo [3/4] Deploying to Azure Functions...
echo This may take 2-3 minutes...
echo Please be patient...
echo.
az functionapp deployment source config-zip --resource-group myResourceGroup --name mychat-functions-1778393386 --src deployment.zip --timeout 600

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo   ERROR: Deployment failed!
    echo ========================================
    echo.
    echo Possible reasons:
    echo   1. Not logged in to Azure
    echo   2. Incorrect resource group name
    echo   3. Network issue
    echo.
    echo Try: az login
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo.
echo [4/4] Testing deployment...
echo Waiting for backend to be ready...
timeout /t 15 /nobreak >nul
echo.
echo Testing endpoint...
curl -s https://mychat-functions-1778393386.azurewebsites.net/api/negotiate
echo.

echo.
echo ========================================
echo   SUCCESS! Backend deployed!
echo ========================================
echo.
echo Your functions are now live:
echo   - sendMessage
echo   - getMessages
echo   - markAsRead (NEW - for blue ticks!)
echo   - sendReadReceipt (NEW)
echo   - All other functions...
echo.
echo Base URL:
echo https://mychat-functions-1778393386.azurewebsites.net/api
echo.
echo Refresh your frontend to see changes!
echo.
echo.
echo Press any key to exit...
pause >nul
exit /b 0
