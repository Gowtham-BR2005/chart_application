@echo off
color 0A
title Deploy to Azure - Finding Resource Group

echo ================================================
echo   DEPLOYING TO AZURE
echo ================================================
echo.

cd /d "%~dp0"

REM Find the correct resource group
echo Step 1: Finding your resource group...
echo.
az functionapp list --query "[?name=='mychat-functions-1778393386'].{Name:name, ResourceGroup:resourceGroup}" -o table > temp_rg.txt
type temp_rg.txt
echo.

REM Extract resource group name
for /f "skip=2 tokens=2" %%a in (temp_rg.txt) do set RESOURCE_GROUP=%%a
del temp_rg.txt

if "%RESOURCE_GROUP%"=="" (
    echo ERROR: Could not find resource group!
    echo.
    echo Let's list all your function apps:
    az functionapp list --query "[].{Name:name, ResourceGroup:resourceGroup}" -o table
    echo.
    echo Please find your function app name above and note the Resource Group.
    echo Then run: az functionapp deployment source config-zip --resource-group YOUR_RESOURCE_GROUP --name mychat-functions-1778393386 --src deployment.zip
    echo.
    pause
    cmd /k
    exit /b 1
)

echo Found Resource Group: %RESOURCE_GROUP%
echo.
pause

echo Step 2: Installing dependencies...
npm install
echo.

echo Step 3: Creating deployment package...
if exist deployment.zip del /q deployment.zip
powershell -Command "Get-ChildItem -Exclude node_modules,deployment.zip | Compress-Archive -DestinationPath deployment.zip -Force"
echo.

echo Step 4: Deploying to Azure...
echo Resource Group: %RESOURCE_GROUP%
echo Function App: mychat-functions-1778393386
echo.
echo This will take 2-3 minutes...
az functionapp deployment source config-zip --resource-group %RESOURCE_GROUP% --name mychat-functions-1778393386 --src deployment.zip --timeout 600
echo.

if %errorlevel% EQU 0 (
    echo ================================================
    echo   SUCCESS!
    echo ================================================
    echo.
    echo Backend is live at:
    echo https://mychat-functions-1778393386.azurewebsites.net/api
    echo.
    echo Blue ticks feature deployed!
    echo.
) else (
    echo ================================================
    echo   DEPLOYMENT FAILED
    echo ================================================
    echo.
)

echo.
echo Window will stay open...
cmd /k
