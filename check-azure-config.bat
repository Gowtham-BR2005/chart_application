@echo off
echo Checking Azure Function App Configuration...
echo.

set FUNCTION_APP=mychat-functions-1778393386
set RESOURCE_GROUP=chat-app-rg

echo Fetching current app settings...
call az functionapp config appsettings list --name %FUNCTION_APP% --resource-group %RESOURCE_GROUP% --output table

echo.
pause
