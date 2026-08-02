@echo off
title TeePublic - TEST: 3 pages only
color 0E
echo.
echo ============================================================
echo  TEST RUN - Crawling first 3 pages only
echo ============================================================
echo.
echo  A Chrome window will open automatically.
echo  This should scrape ~30 designs as a quick test.
echo.
echo ============================================================
echo.

cd /d C:\teepublic
call venv\Scripts\activate.bat
python main.py --crawl --max-pages 3

echo.
echo ============================================================
echo  Test done! Run CHECK_PROGRESS.bat to see results.
echo ============================================================
echo.
pause
