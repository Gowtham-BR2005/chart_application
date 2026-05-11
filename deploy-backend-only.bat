@echo off
echo ========================================
echo Deploying Backend Updates
echo ========================================
echo.

echo Changing to function app directory...
cd /d E:\cc\chart_application\chat_function_app

echo Current directory: %CD%
echo.

echo [1/2] Building and deploying Azure Functions...
call func azure functionapp publish mychat-functions-1778393386

echo.
echo [2/2] Waiting 15 seconds for deployment to stabilize...
timeout /t 15 /nobreak

echo.
echo ========================================
echo Backend Deployed!
echo ========================================
echo.
echo The following fixes are now live:
echo - Heartbeat every 5 seconds (was 30s)
echo - Inactive check at 10 seconds (was 60s)
echo - Faster online/offline status updates
echo.
echo Next: Refresh your browser to get the frontend updates
echo.
cd /d E:\cc\chart_application
pause
