@echo off
title Pinterest Demo Video Generator
cd /d "%~dp0"
echo ======================================================
echo   Generating Pinterest Approval Demo Video (MP4)
echo ======================================================
python pinterest_oauth_demo\generate_video.py
echo.
echo Process complete. The video is saved at:
echo %~dp0pinterest_sandbox_demo_video.mp4
echo.
pause
