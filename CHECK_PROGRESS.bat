@echo off
title TeePublic - Progress Check
color 0F

cd /d C:\teepublic
call venv\Scripts\activate.bat

echo.
python progress.py
echo.
pause
