@echo off
setlocal enabledelayedexpansion

color 0E
title Deploy Backend to Azure

echo ========================================
echo   DEPLOYING BACKEND TO AZURE
echo ========================================
echo.

REM Change to script directory
cd /d "%~dp0"

REM Check if Azure CLI is installed
where az >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Azure CLI not found!
    echo.
    echo Please install Azure CLI:
    echo https://aka.ms/installazurecliwindows
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo [1/5] Checking Azure login...
az account show >nul 2>nul
if %errorlevel% neq 0 (
    echo You are not logged in.
    echo Opening Azure login...
    az login
    if %errorlevel% neq 0 (
        echo ERROR: Login failed!
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
)

echo.
echo [2/5] Installing dependencies...
echo Please wait...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo.
echo [3/5] Building deployment package...
if exist deployment.zip (
    echo Removing old deployment.zip...
    del /q deployment.zip
)

echo.
echo [4/5] Creating zip file...
echo This may take a moment...
powershell -Command "Get-ChildItem -Path . -Exclude node_modules,deployment.zip,*.log | Compress-Archive -DestinationPath .\deployment.zip -Force"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create zip!
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo.
echo [5/5] Deploying to Azure Functions...
echo This may take 2-3 minutes...
echo Please be patient...
az functionapp deployment source config-zip --resource-group myResourceGroup --name mychat-functions-1778393386 --src deployment.zip --timeout 600

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Deployment failed!
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo.
echo ========================================
echo   DEPLOYMENT SUCCESSFUL!
echo ========================================
echo.
echo Your backend is now live at:
echo https://mychat-functions-1778393386.azurewebsites.net
echo.
echo Testing endpoint...
timeout /t 10 /nobreak >nul
curl -s https://mychat-functions-1778393386.azurewebsites.net/api/negotiate
echo.
echo.
echo Press any key to exit...
pause >nul
exit /b 0
