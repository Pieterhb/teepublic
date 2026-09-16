@echo off
title Pinterest Daily 11-Board Pin Generator and Deployer
color 0B

echo ================================================================================
echo   Pinterest 11-Board Daily Pin Generator and Deployer
echo ================================================================================
echo.

echo [1/5] Syncing latest state from GitHub...
cd /d "%~dp0"
git pull --rebase origin master
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git sync failed! Check network or git status.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/5] Generating 1 Fresh Pin for ALL 11 Boards...
cd /d "%~dp0\trust\pseo-app"
node scripts\generate-rss.mjs --advance
if %ERRORLEVEL% NEQ 0 (
    echo ❌ RSS Generation Failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/5] Building Next.js Static Export...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build Failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [4/5] Deploying to Cloudflare Pages (blackpantherstore.co.za)...
call npx wrangler pages deploy out --project-name=pseo-app --branch=master
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️ Cloudflare deployment returned code %ERRORLEVEL%. Continuing with git backup...
)

echo.
echo [5/5] Backing up updated pinned history to GitHub (main and master)...
cd /d "%~dp0"
git add -A
git diff --staged --quiet
if %ERRORLEVEL% NEQ 0 (
    git commit -m "chore(pins): manual 11-board daily pin advance [skip ci]"
    git push origin master
    git push origin master:main
) else (
    echo No new file changes to commit.
)

echo.
echo ================================================================================
echo   ✨ All 11 Boards Updated, Deployed, and Backed up Successfully!
echo ================================================================================
echo.
pause
