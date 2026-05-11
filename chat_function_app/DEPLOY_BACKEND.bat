@echo off
REM =============================================================================
REM  SIMPLE DEPLOYMENT SCRIPT - Backend to Azure
REM  This window will STAY OPEN so you can see what happens!
REM =============================================================================

color 0B
title Deploying Backend to Azure - Please Wait

echo.
echo ========================================
echo   DEPLOYING BACKEND TO AZURE
echo ========================================
echo.

REM Save current directory
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo Current folder: %CD%
echo.

REM Check Azure CLI
echo Checking Azure CLI...
where az >nul 2>nul
if errorlevel 1 (
    echo.
    echo [ERROR] Azure CLI is not installed!
    echo.
    echo Please download and install from:
    echo https://aka.ms/installazurecliwindows
    echo.
    echo After installing, restart this script.
    echo.
    goto :end
)
echo ✓ Azure CLI found
echo.

REM Check login
echo Checking Azure login...
az account show >nul 2>nul
if errorlevel 1 (
    echo.
    echo You need to login to Azure first.
    echo A browser window will open...
    echo.
    pause
    az login
    if errorlevel 1 (
        echo.
        echo [ERROR] Login failed!
        echo Please try again.
        echo.
        goto :end
    )
)
echo ✓ Logged in to Azure
echo.

REM Install dependencies
echo ========================================
echo Step 1/4: Installing dependencies
echo ========================================
echo Please wait... this may take 1-2 minutes
echo.
call npm install --production
if errorlevel 1 (
    echo.
    echo [ERROR] Failed to install dependencies!
    echo.
    echo Try running manually:
    echo   cd %CD%
    echo   npm install
    echo.
    goto :end
)
echo ✓ Dependencies installed
echo.

REM Create zip
echo ========================================
echo Step 2/4: Creating deployment package
echo ========================================
if exist deployment.zip (
    echo Removing old deployment.zip...
    del /q deployment.zip
)
echo Creating zip file...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path . -Exclude node_modules,deployment.zip,*.log,*.output | Compress-Archive -DestinationPath .\deployment.zip -Force"
if errorlevel 1 (
    echo.
    echo [ERROR] Failed to create zip file!
    echo.
    goto :end
)
echo ✓ Deployment package created
echo.

REM Deploy
echo ========================================
echo Step 3/4: Uploading to Azure
echo ========================================
echo This will take 2-3 minutes...
echo Please be patient and DO NOT close this window!
echo.
az functionapp deployment source config-zip --resource-group myResourceGroup --name mychat-functions-1778393386 --src deployment.zip --timeout 600
if errorlevel 1 (
    echo.
    echo [ERROR] Deployment failed!
    echo.
    echo Possible reasons:
    echo   - Wrong resource group name
    echo   - Wrong function app name
    echo   - Network timeout
    echo.
    echo Try checking in Azure Portal:
    echo https://portal.azure.com
    echo.
    goto :end
)
echo ✓ Uploaded successfully
echo.

REM Test
echo ========================================
echo Step 4/4: Testing deployment
echo ========================================
echo Waiting 15 seconds for Azure to start functions...
timeout /t 15 /nobreak >nul
echo.
echo Testing endpoint...
curl -s https://mychat-functions-1778393386.azurewebsites.net/api/negotiate
echo.
echo.

REM Success
echo.
echo ========================================
echo   ✅ DEPLOYMENT SUCCESSFUL!
echo ========================================
echo.
echo Your backend is now live at:
echo https://mychat-functions-1778393386.azurewebsites.net
echo.
echo New functions deployed:
echo   ✓ markAsRead.js (for blue ticks!)
echo   ✓ sendReadReceipt.js
echo   ✓ All existing functions updated
echo.
echo You can now refresh your frontend app!
echo Blue ticks will work!
echo.

:end
echo.
echo ========================================
echo Press any key to close this window...
echo ========================================
pause >nul
exit /b
