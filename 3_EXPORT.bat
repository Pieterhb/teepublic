@echo off
title TeePublic - Step 3: Export Results
color 0E
echo.
echo ============================================================
echo  STEP 3 - EXPORT RESULTS
echo ============================================================
echo.
echo  Exporting your scraped designs to:
echo    data\processed\master_database.csv
echo    data\processed\master_database.json
echo    data\processed\master_database.sqlite
echo    logs\validation_report.json
echo.
echo ============================================================
echo.

cd /d C:\teepublic
call venv\Scripts\activate.bat
python main.py --export

echo.
echo ============================================================
echo  Export complete! Check the data\processed\ folder.
echo ============================================================
echo.
pause
