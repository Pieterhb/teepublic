@echo off
title TeePublic - Step 2: Full Crawl (running...)
color 0B
echo.
echo ============================================================
echo  STEP 2 - FULL CRAWL
echo ============================================================
echo.
echo  A Chrome window will open and stay visible while crawling.
echo  This is NORMAL - it needs to be visible to bypass
echo  Cloudflare's bot detection. Do NOT close it.
echo.
echo  This will scrape all ~4000 products from your store.
echo  Estimated time: 6-8 hours (leave this overnight).
echo.
echo  - Progress is saved continuously to the database.
echo  - You can stop at any time with CTRL+C
echo  - Re-run this file to RESUME from where it stopped.
echo.
echo  TIP: If Cloudflare keeps looping, run 1_SETUP_SESSION.bat
echo  first to refresh your browser session.
echo.
echo ============================================================
echo.
pause

cd /d C:\teepublic
call venv\Scripts\activate.bat
python main.py --crawl

echo.
echo ============================================================
echo  Crawl finished (or stopped). Run 3_EXPORT.bat to export.
echo ============================================================
echo.
pause
