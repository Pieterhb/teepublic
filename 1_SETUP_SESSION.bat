@echo off
title TeePublic - Step 1: Setup Session
color 0A
echo.
echo ============================================================
echo  STEP 1 - SETUP SESSION (run this ONCE before crawling)
echo ============================================================
echo.
echo  A Chrome window will open to your TeePublic store.
echo  SeleniumBase UC mode will auto-bypass Cloudflare.
echo  Browse around briefly, then press ENTER here to save.
echo.
echo ============================================================
echo.
pause

cd /d C:\teepublic
call venv\Scripts\activate.bat
python main.py --setup-session

echo.
echo ============================================================
echo  Session saved! You can now run 2_CRAWL.bat
echo ============================================================
echo.
pause
