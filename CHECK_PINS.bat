@echo off
title Pinterest 11-Board RSS Status Check
color 0A
cd /d "%~dp0\trust\pseo-app"

echo ================================================================================
echo   Checking Pinterest 11-Board RSS Feeds and History Status
echo ================================================================================
echo.
node scripts\check-status.mjs
echo.
pause
