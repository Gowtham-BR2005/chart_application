@echo off
echo Checking Web PubSub Configuration...
echo.

set PUBSUB_NAME=mychat-pubsub-1778393386
set RESOURCE_GROUP=chat-app-rg

echo Checking if Web PubSub exists...
call az webpubsub show --name %PUBSUB_NAME% --resource-group %RESOURCE_GROUP% --output table

echo.
echo Checking hub settings...
call az webpubsub hub show --name %PUBSUB_NAME% --resource-group %RESOURCE_GROUP% --hub-name chat --output table 2>nul

if errorlevel 1 (
    echo.
    echo WARNING: Hub 'chat' not found! Creating it now...
    call az webpubsub hub create --name %PUBSUB_NAME% --resource-group %RESOURCE_GROUP% --hub-name chat
    echo Hub created!
)

echo.
pause
