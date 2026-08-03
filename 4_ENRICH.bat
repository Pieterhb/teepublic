@echo off
title TeePublic - Step 4: Batch Enrichment (PAID Gemini)
color 0A
echo.
echo ============================================================
echo  STEP 4 - BATCH ENRICHMENT (PAID TIER)
echo ============================================================
echo.
echo  This enriches all scraped designs with SEO metadata
echo  using Gemini 3.5 Flash-Lite on the PAID tier.
echo.
echo  - Model  : gemini-3.5-flash-lite ONLY (no fallbacks)
echo  - Delay  : 0.1 seconds between each API call
echo  - Cost   : Est. $2.66 total (HARD LIMIT at $3.00)
echo  - Limit  : No daily quota on paid tier
echo  - Time   : ~5-10 minutes for 3,000+ designs
echo  - Safe   : Can stop (Ctrl+C) and resume any time
echo.
echo  SAFETY: A hard limit of $3.00 is built into the script.
echo  It will automatically stop and save if this is reached.
echo.
echo  Run this AFTER 2_CRAWL.bat has finished scraping.
echo ============================================================
echo.
pause

cd /d C:\teepublic
call venv\Scripts\activate.bat
python enrich_batch.py --paid

echo.
echo ============================================================
echo  Session done! Check the output above for details.
echo  When all done, run 3_EXPORT.bat to export CSV/JSON.
echo ============================================================
echo.
pause
