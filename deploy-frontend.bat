@echo off
setlocal enabledelayedexpansion

color 0D
title Deploy Frontend to Azure

echo ========================================
echo   DEPLOYING FRONTEND TO AZURE
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

echo [1/3] Checking Azure login...
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
echo [2/3] Installing dependencies...
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
echo [3/3] Building React app for production...
echo This may take 2-3 minutes...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo.
echo ========================================
echo   BUILD SUCCESSFUL!
echo ========================================
echo.
echo Build folder: %cd%\build
echo.
echo TO DEPLOY:
echo   1. Push to GitHub (auto-deploys via GitHub Actions)
echo   2. Upload 'build' folder manually in Azure Portal
echo.
echo Frontend configured to use backend:
echo https://mychat-functions-1778393386.azurewebsites.net/api
echo.
echo.
echo Press any key to exit...
pause >nul
exit /b 0
