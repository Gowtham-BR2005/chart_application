@echo off
echo ========================================
echo Restarting Function App
echo ========================================
echo.

set FUNCTION_APP=mychat-functions-1778393386
set RESOURCE_GROUP=chat-app-rg

echo [1/2] Restarting Function App...
call az functionapp restart --name %FUNCTION_APP% --resource-group %RESOURCE_GROUP%
echo Done!

echo.
echo [2/2] Waiting 30 seconds for restart to complete...
timeout /t 30 /nobreak

echo.
echo ========================================
echo Function App Restarted!
echo ========================================
echo.
echo Next steps:
echo 1. Go to: https://kind-cliff-05ea40100.7.azurestaticapps.net
echo 2. Press F12 to open Developer Console
echo 3. Refresh the page (Ctrl+R)
echo 4. Click "Sign in with Microsoft"
echo 5. After login, check console for "WebSocket connected" message
echo.
echo If you see "WebSocket connected" - SUCCESS!
echo If not, take a screenshot of the console errors.
echo.
pause
