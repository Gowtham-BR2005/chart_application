@echo off
color 0E
title Finding Your Azure Resources

echo ================================================
echo   FINDING YOUR AZURE RESOURCES
echo ================================================
echo.

echo Your Function Apps:
echo ------------------------------------------------
az functionapp list --query "[].{Name:name, ResourceGroup:resourceGroup, DefaultHostName:defaultHostName}" -o table
echo.

echo.
echo Your Resource Groups:
echo ------------------------------------------------
az group list --query "[].{Name:name, Location:location}" -o table
echo.

echo ================================================
echo.
echo Look for: mychat-functions-1778393386
echo Note the Resource Group name next to it
echo.
echo Then edit the deploy script to use that name!
echo.
pause
cmd /k
