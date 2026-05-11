@echo off
REM Keep window open
setlocal enabledelayedexpansion

color 0A
title Deploy All - Chat App to Azure

echo ========================================
echo   DEPLOYING CHAT APP TO AZURE
echo   Backend + Frontend
echo ========================================
echo.

REM Change to script directory
cd /d "%~dp0"

REM Check if Azure CLI is installed
where az >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Azure CLI not found!
    echo.
    echo Please install Azure CLI from:
    echo https://aka.ms/installazurecliwindows
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo [Step 1] Checking Azure login...
az account show >nul 2>nul
if %errorlevel% neq 0 (
    echo You are not logged in.
    echo Opening Azure login...
    az login
    if %errorlevel% neq 0 (
        echo ERROR: Login failed
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
)

echo.
echo ========================================
echo   DEPLOYING BACKEND (Azure Functions)
echo ========================================
echo.

cd chat_function_app
if %errorlevel% neq 0 (
    echo ERROR: Cannot find chat_function_app folder!
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo [1/5] Installing backend dependencies...
echo Please wait...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend npm install failed!
    cd ..
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo.
echo [2/5] Creating deployment package...
if exist deployment.zip del /q deployment.zip

echo [3/5] Zipping backend files...
powershell -Command "Get-ChildItem -Path . -Exclude node_modules,deployment.zip,*.log | Compress-Archive -DestinationPath .\deployment.zip -Force"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create zip!
    cd ..
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo.
echo [4/5] Uploading to Azure Functions...
echo This may take 2-3 minutes...
az functionapp deployment source config-zip --resource-group myResourceGroup --name mychat-functions-1778393386 --src deployment.zip --timeout 600

if %errorlevel% neq 0 (
    echo ERROR: Backend deployment failed!
    cd ..
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo.
echo [5/5] Waiting for backend to be ready...
timeout /t 15 /nobreak >nul

echo.
echo Backend deployed successfully!
echo Testing endpoint...
curl -s https://mychat-functions-1778393386.azurewebsites.net/api/negotiate
echo.

cd ..

echo.
echo ========================================
echo   BUILDING FRONTEND
echo ========================================
echo.

echo [1/2] Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend npm install failed!
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo.
echo [2/2] Building React app...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo.
echo ========================================
echo   DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Backend: https://mychat-functions-1778393386.azurewebsites.net
echo.
echo Frontend build folder: %cd%\build
echo.
echo TO DEPLOY FRONTEND:
echo   Option 1: Push to GitHub (auto-deploys via GitHub Actions)
echo   Option 2: Upload 'build' folder in Azure Portal
echo.
echo IMPORTANT: New function added - /api/messages/mark-read
echo This enables blue tick functionality!
echo.
echo.
echo Press any key to exit...
pause >nul
exit /b 0
