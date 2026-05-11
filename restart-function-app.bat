@echo off
echo ========================================
echo Restarting Azure Function App
echo ========================================
echo.

set FUNCTION_APP=mychat-functions-1778393386
set RESOURCE_GROUP=chat-app-rg

echo Restarting %FUNCTION_APP%...
call az functionapp restart --name %FUNCTION_APP% --resource-group %RESOURCE_GROUP%

echo.
echo Done! Wait 30 seconds for the app to fully restart.
echo.
pause
