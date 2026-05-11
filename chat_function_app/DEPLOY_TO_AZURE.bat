@echo off
REM ============================================================================
REM  DEPLOY TO AZURE - PRODUCTION
REM  Resource Group: chat-app-rg
REM  Function App: mychat-functions-1778393386
REM ============================================================================

color 0A
title Deploying to Azure Production

cls

echo.
echo ============================================================================
echo   DEPLOYING TO AZURE PRODUCTION
echo ============================================================================
echo.
echo Resource Group: chat-app-rg
echo Function App: mychat-functions-1778393386
echo.
echo ============================================================================
echo.

REM Change to script directory
cd /d "%~dp0"

REM ============================================================================
echo [Step 1/6] Stopping all local servers...
echo ============================================================================
echo.

echo Killing Node.js processes...
taskkill /F /IM node.exe /T >nul 2>&1
if %errorlevel% EQU 0 (
    echo   - Node.js stopped
) else (
    echo   - No Node.js running
)

echo Killing Azure Functions Core Tools...
taskkill /F /IM func.exe /T >nul 2>&1
if %errorlevel% EQU 0 (
    echo   - Azure Functions stopped
) else (
    echo   - No Azure Functions running
)

echo.
echo All local servers stopped!
echo.
timeout /t 3 /nobreak >nul

REM ============================================================================
echo [Step 2/6] Checking Azure CLI...
echo ============================================================================
echo.

where az >nul 2>nul
if %errorlevel% NEQ 0 (
    echo ERROR: Azure CLI not installed!
    echo.
    echo Download from: https://aka.ms/installazurecliwindows
    echo.
    pause
    exit /b 1
)

echo Azure CLI found!
echo.

REM ============================================================================
echo [Step 3/6] Checking Azure login...
echo ============================================================================
echo.

az account show >nul 2>nul
if %errorlevel% NEQ 0 (
    echo Not logged in. Opening Azure login...
    echo.
    az login
    if %errorlevel% NEQ 0 (
        echo ERROR: Login failed!
        echo.
        pause
        exit /b 1
    )
)

echo Logged in to Azure!
echo.

REM ============================================================================
echo [Step 4/6] Installing dependencies...
echo ============================================================================
echo.
echo This may take 1-2 minutes...
echo.

call npm install --production
if %errorlevel% NEQ 0 (
    echo.
    echo ERROR: npm install failed!
    echo.
    pause
    exit /b 1
)

echo Dependencies installed!
echo.

REM ============================================================================
echo [Step 5/6] Creating deployment package...
echo ============================================================================
echo.

if exist deployment.zip (
    echo Removing old deployment.zip...
    del /q deployment.zip
)

echo Creating zip file (excluding node_modules, logs)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path . -Exclude node_modules,deployment.zip,*.log,*.output,.git | Compress-Archive -DestinationPath .\deployment.zip -Force"
if %errorlevel% NEQ 0 (
    echo.
    echo ERROR: Failed to create deployment package!
    echo.
    pause
    exit /b 1
)

echo Deployment package created!
echo.

REM ============================================================================
echo [Step 6/6] Deploying to Azure...
echo ============================================================================
echo.
echo Deploying to:
echo   Resource Group: chat-app-rg
echo   Function App: mychat-functions-1778393386
echo.
echo This will take 2-3 minutes...
echo Please wait...
echo.

az functionapp deployment source config-zip --resource-group chat-app-rg --name mychat-functions-1778393386 --src deployment.zip --timeout 600

if %errorlevel% NEQ 0 (
    echo.
    echo ============================================================================
    echo   DEPLOYMENT FAILED!
    echo ============================================================================
    echo.
    echo Please check:
    echo   1. Resource group name is correct: chat-app-rg
    echo   2. Function app name is correct: mychat-functions-1778393386
    echo   3. You have permissions to deploy
    echo.
    pause
    exit /b 1
)

REM ============================================================================
echo.
echo.
echo ============================================================================
echo   DEPLOYMENT SUCCESSFUL!
echo ============================================================================
echo.
echo Backend is now live at:
echo https://mychat-functions-1778393386.azurewebsites.net/api
echo.
echo New features deployed:
echo   - markAsRead.js (Blue tick feature!)
echo   - sendReadReceipt.js
echo   - Updated sendMessage.js
echo   - All other functions
echo.
echo ============================================================================
echo.

REM ============================================================================
echo Testing deployment...
echo ============================================================================
echo.
echo Waiting 15 seconds for Azure to initialize...
timeout /t 15 /nobreak >nul
echo.
echo Testing endpoint...
echo.
curl -s https://mychat-functions-1778393386.azurewebsites.net/api/negotiate
echo.
echo.

REM ============================================================================
echo.
echo ============================================================================
echo   NEXT STEPS
echo ============================================================================
echo.
echo 1. Your backend is deployed and running
echo.
echo 2. Frontend will automatically use this backend:
echo    https://mychat-functions-1778393386.azurewebsites.net/api
echo.
echo 3. Test blue ticks:
echo    - User A sends messages
echo    - User B opens chat
echo    - User A's messages turn blue!
echo.
echo 4. To deploy frontend:
echo    - Push to GitHub (auto-deploys via GitHub Actions)
echo    - OR upload 'build' folder in Azure Portal
echo.
echo ============================================================================
echo.
echo Deployment complete! Window will stay open...
echo.
pause

REM Keep window open
cmd /k
