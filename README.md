# TeePublic Store Scraper & Enricher

A Python tool to crawl, scrape, and AI-enrich all product listings from a TeePublic store.

## Features

- 🕷️ **Crawl** — Discovers all design pages from your TeePublic store
- 📥 **Parse & Store** — Extracts product metadata and stores it in SQLite
- 📤 **Export** — Exports to CSV / JSON
- 🤖 **AI Enrichment** — Enriches designs with Gemini Flash-Lite (FREE tier only, zero cost)

## Safety Features (Enrichment)

- Pinned to `gemini-2.0-flash-lite` — **no fallback to paid models**
- Hard stop on 429 / quota exhaustion — saves progress, tells you to come back tomorrow
- 2-second delay between calls (well within free-tier limits)
- Resume-safe — skips already-enriched designs

## Setup

1. **Clone the repo and install dependencies:**
   ```bash
   git clone https://github.com/Pieterhb/teepublic.git
   cd teepublic
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure your API key:**
   ```bash
   cp .env.example .env
   # Edit .env and add your FREE Gemini API key
   ```
   Get a free key (no billing needed) at: https://aistudio.google.com/apikey

3. **Edit `config/config.yaml`** and set your TeePublic store URL.

## Usage

Run each step in order using the provided batch files:

| Script | Description |
|--------|-------------|
| `1_SETUP_SESSION.bat` | Set up browser session / cookies |
| `2_CRAWL.bat` | Crawl and scrape all designs |
| `3_EXPORT.bat` | Export to CSV/JSON |
| `4_ENRICH.bat` | AI-enrich with Gemini (FREE tier) |
| `CHECK_PROGRESS.bat` | Check enrichment progress |

## Project Structure

```
teepublic/
├── config/          # Configuration files
├── crawler/         # Web crawling logic
├── parser/          # HTML parsing & normalization
├── db/              # Database layer (SQLite)
├── enrichment/      # Gemini AI enrichment
├── export/          # CSV/JSON export
├── models/          # Data models
├── tests/           # Unit tests
├── main.py          # Main entry point
├── enrich_batch.py  # Standalone enrichment runner
└── requirements.txt
```

## Important Notes

- **Never commit API keys** — use `.env` file (gitignored) or environment variables
- The `data/`, `logs/`, and `venv/` directories are gitignored (too large)
- The `.env` file is gitignored — see `.env.example` for the required format
