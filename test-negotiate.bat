@echo off
echo Testing negotiate endpoint...
echo.
echo You need to provide a valid JWT token.
echo.
echo 1. Open your browser to: https://kind-cliff-05ea40100.7.azurestaticapps.net
echo 2. Press F12 to open Developer Tools
echo 3. Go to Console tab
echo 4. Type: localStorage.getItem('msal.account.keys')
echo 5. Copy the token value and paste it here when prompted
echo.
set /p TOKEN="Enter your Bearer token: "

curl -H "Authorization: Bearer %TOKEN%" https://mychat-functions-1778393386.azurewebsites.net/api/negotiate

echo.
echo.
pause
