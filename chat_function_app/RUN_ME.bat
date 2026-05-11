@echo off
title Azure Deploy - Keep Window Open
color 0A

echo ================================================
echo   DEPLOYING BACKEND TO AZURE
echo ================================================
echo.

cd /d "%~dp0"

echo Installing dependencies...
npm install
echo.

echo Creating zip...
powershell -Command "Compress-Archive -Path . -DestinationPath deployment.zip -Force"
echo.

echo Deploying to Azure (takes 3 minutes)...
az functionapp deployment source config-zip --resource-group myResourceGroup --name mychat-functions-1778393386 --src deployment.zip --timeout 600
echo.

echo Testing...
curl https://mychat-functions-1778393386.azurewebsites.net/api/negotiate
echo.

echo ================================================
echo   COMPLETE!
echo ================================================
echo.
cmd /k
