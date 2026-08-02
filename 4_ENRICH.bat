@echo off
title TeePublic - Step 4: Batch Enrichment (FREE Gemini)
color 0A
echo.
echo ============================================================
echo  STEP 4 - BATCH ENRICHMENT (FREE TIER)
echo ============================================================
echo.
echo  This enriches all scraped designs with SEO metadata
echo  using Gemini 3.5 Flash-Lite on the FREE tier.
echo.
echo  - Model  : gemini-3.5-flash-lite ONLY (no fallbacks)
echo  - Delay  : 2 seconds between each API call
echo  - Cost   : $0.00 (free-tier API key, no billing)
echo  - Limit  : ~1,000 calls/day on free tier
echo  - Time   : Run once per day, ~4 days for 3,700 designs
echo  - Safe   : Can stop (Ctrl+C) and resume any time
echo.
echo  SAFETY: If daily quota is reached, script STOPS
echo  automatically and saves all progress. Just run again
echo  tomorrow!
echo.
echo  Run this AFTER 2_CRAWL.bat has finished scraping.
echo ============================================================
echo.
pause

cd /d C:\teepublic
call venv\Scripts\activate.bat
python enrich_batch.py

echo.
echo ============================================================
echo  Session done! Check the output above for details.
echo  If quota was hit, run this again tomorrow.
echo  When all done, run 3_EXPORT.bat to export CSV/JSON.
echo ============================================================
echo.
pause
