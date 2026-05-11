@echo off
echo Adding staging URL to CORS...

set FUNCTION_APP=mychat-functions-1778393386
set RESOURCE_GROUP=chat-app-rg

call az functionapp cors add --name %FUNCTION_APP% --resource-group %RESOURCE_GROUP% --allowed-origins https://kind-cliff-05ea40100.7.azurestaticapps.net

echo.
echo Done! You can now use the .7 staging URL
echo.
pause
