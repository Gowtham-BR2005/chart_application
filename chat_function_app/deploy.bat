@echo off
cls
color 0B
title Azure Deployment

echo.
echo ================================================================
echo   DEPLOYING TO AZURE
echo ================================================================
echo.

cd /d "%~dp0"

echo Step 1: Installing...
call npm install
echo.

echo Step 2: Creating package...
if exist deployment.zip del /q deployment.zip
powershell -Command "Compress-Archive -Path .\* -DestinationPath .\deployment.zip -Force"
echo.

echo Step 3: Deploying to Azure...
az functionapp deployment source config-zip --resource-group myResourceGroup --name mychat-functions-1778393386 --src deployment.zip --timeout 600
echo.

echo Step 4: Testing...
timeout /t 10 /nobreak
curl https://mychat-functions-1778393386.azurewebsites.net/api/negotiate
echo.

echo.
echo ================================================================
echo   DONE!
echo ================================================================
echo.
echo Backend: https://mychat-functions-1778393386.azurewebsites.net
echo.
pause
