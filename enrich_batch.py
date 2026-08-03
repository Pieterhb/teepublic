"""
Batch Enrichment Script — FREE TIER ONLY
=========================================
Enriches all un-enriched designs using Gemini Flash-Lite on the FREE tier.

Safety features:
  - Pinned to gemini-3.5-flash-lite ONLY — zero fallback models
  - In paid mode: Hard stop at $3.00 cost limit to prevent overspending
  - In free mode: HARD STOP on 429 / RESOURCE_EXHAUSTED
  - Daily call counter — tracks how many calls today in logs/enrich_daily_count.json
  - Resume-safe — skips already-enriched designs, safe to Ctrl+C and restart
  - Commits to DB every 25 designs so progress is never lost
  - $0.00 cost in free mode / tracked cost in paid mode
"""

import sqlite3
import json
import time
import logging
import sys
import os
from datetime import datetime, date

# Load .env file if present (keeps API keys out of config.yaml / git)
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"), override=False)
except ImportError:
    pass  # python-dotenv not installed — fall back to env vars already set

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("logs/enrich_batch.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)

# ── Configuration ────────────────────────────────────────────────────────────
DB_PATH           = "data/processed/master_database.sqlite"
CONFIG_PATH       = "config/config.yaml"
DAILY_COUNT_PATH  = "logs/enrich_daily_count.json"

# PINNED MODEL — absolutely NO fallbacks to expensive models
MODEL             = "gemini-3.5-flash-lite"

DELAY_SECONDS     = 2.0          # pause between API calls (15 RPM limit = 4s min, we use 2s for safety)
BATCH_SIZE        = 25           # commit to DB every N designs
MAX_CONSECUTIVE_ERRORS = 5       # stop after this many consecutive errors (not just 429)

COST_PER_M_INPUT  = 0.30         # USD per million input tokens
COST_PER_M_OUTPUT = 2.50         # USD per million output tokens
MAX_COST_USD      = 3.00         # Hard stop if cost exceeds this
# ─────────────────────────────────────────────────────────────────────────────


class QuotaExhaustedError(Exception):
    """Raised when the free-tier daily quota is exhausted (429)."""
    pass


def load_api_key(is_paid: bool = False) -> str:
    """Read the Gemini API key. If is_paid is True, requires GEMINI_PAID_API_KEY from .env."""
    if is_paid:
        key = os.environ.get("GEMINI_PAID_API_KEY", "")
        if not key:
            logger.error(
                "Paid mode requested, but GEMINI_PAID_API_KEY is not set.\n"
                "Please add your paid API key to the .env file."
            )
            sys.exit(1)
        return key

    import yaml
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    enrichment = cfg.get("enrichment", {})

    # Use free_api_key ONLY — never fall back to the paid api_key
    key = enrichment.get("free_api_key", "")

    # Resolve ${ENV_VAR} placeholders from the environment
    if key and key.startswith("${") and key.endswith("}"):
        env_var = key[2:-1]
        key = os.environ.get(env_var, "")
        if not key:
            logger.error(
                f"Config references ${{{env_var}}} but that environment variable is not set.\n"
                "Set it in your .env file or as a system environment variable.\n"
                "See .env.example for the required format."
            )
            sys.exit(1)

    if not key:
        logger.error(
            "No 'free_api_key' found in config/config.yaml [enrichment] section.\n"
            "Please add your free-tier API key (from a project WITHOUT billing).\n"
            "See: https://aistudio.google.com/apikey"
        )
        sys.exit(1)

    # Safety check: refuse to use the old paid key
    paid_key = enrichment.get("api_key", "")
    if paid_key and key == paid_key:
        logger.error(
            "DANGER: free_api_key is the same as the old paid api_key!\n"
            "Please use a key from a project WITHOUT billing attached."
        )
        sys.exit(1)

    return key


def load_taxonomy() -> dict:
    """Load the taxonomy file."""
    import yaml
    with open("config/taxonomy.yaml", "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def build_prompt(design: dict, taxonomy: dict) -> str:
    return f"""
You are an expert SEO specialist for a Print-on-Demand (pSEO) website.
Enrich the following design with SEO metadata using the provided taxonomy.

Design:
Title: {design.get('title')}
Description: {design.get('description')}
Tags: {design.get('tags')}

Taxonomy:
{json.dumps(taxonomy, indent=2)}

Output a JSON object with EXACTLY these keys:
- niche, secondary_niche, recipient, occasion, style, theme
- primary_keyword, secondary_keyword, long_tail_keyword
- seo_title (max 60 chars), h1, meta_description (max 155 chars)
- image_alt, canonical_url (path only, e.g. /designs/cool-shirt), jsonld_type

Respond ONLY with valid JSON. No markdown, no code block.
""".strip()


# ── Daily call counter ───────────────────────────────────────────────────────

def load_daily_count() -> dict:
    """Load today's call count from the JSON tracker file."""
    today = date.today().isoformat()
    try:
        with open(DAILY_COUNT_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        if data.get("date") != today:
            # New day — reset counter
            return {"date": today, "calls": 0, "enriched": 0, "errors": 0}
        return data
    except (FileNotFoundError, json.JSONDecodeError):
        return {"date": today, "calls": 0, "enriched": 0, "errors": 0}


def save_daily_count(data: dict):
    """Save the daily call count."""
    os.makedirs(os.path.dirname(DAILY_COUNT_PATH), exist_ok=True)
    with open(DAILY_COUNT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


# ── API call with safety ─────────────────────────────────────────────────────

def enrich_one(api_key: str, design: dict, taxonomy: dict) -> tuple[dict | None, dict | None]:
    """
    Call Gemini flash-lite for one design via raw HTTP.
    Returns (enriched_fields_dict, usage_metadata_dict), or (None, None) on non-quota error.
    Raises QuotaExhaustedError on 429.
    """
    import requests

    prompt = build_prompt(design, taxonomy)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={api_key}"

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.3,
        },
    }

    try:
        resp = requests.post(url, json=payload, timeout=30)

        # ── HARD STOP on quota exhaustion ──
        if resp.status_code == 429:
            raise QuotaExhaustedError(
                "FREE TIER DAILY QUOTA EXHAUSTED (HTTP 429).\n"
                "All progress has been saved. Run this script again tomorrow.\n"
                "The free tier resets at midnight Pacific Time (PT)."
            )

        if resp.status_code != 200:
            error_msg = resp.json().get("error", {}).get("message", resp.text[:200])
            logger.error(f"  API error ({resp.status_code}) for {design.get('design_id')}: {error_msg}")
            return None, None

        # Parse the response
        data = resp.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(text), data.get("usageMetadata", {})

    except QuotaExhaustedError:
        raise  # Re-raise — this must stop the script
    except json.JSONDecodeError as e:
        logger.error(f"  JSON parse error for {design.get('design_id')}: {e}")
        return None, None
    except requests.exceptions.Timeout:
        logger.error(f"  Timeout for {design.get('design_id')}")
        return None, None
    except Exception as e:
        err_str = str(e)
        # Also catch quota errors that might come through exceptions
        if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
            raise QuotaExhaustedError(
                "FREE TIER DAILY QUOTA EXHAUSTED.\n"
                "All progress has been saved. Run this script again tomorrow."
            )
        logger.error(f"  Unexpected error for {design.get('design_id')}: {e}")
        return None, None


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    import argparse
    parser = argparse.ArgumentParser(description="TeePublic Batch Enrichment")
    parser.add_argument("--paid", action="store_true", help="Use paid API key with cost cap and faster rate limit")
    args = parser.parse_args()

    is_paid = args.paid
    delay = 0.1 if is_paid else DELAY_SECONDS

    os.makedirs("logs", exist_ok=True)

    print()
    print("=" * 60)
    print("  TEEPUBLIC BATCH ENRICHMENT")
    print("=" * 60)
    print(f"  Model  : {MODEL} (pinned, NO fallbacks)")
    if is_paid:
        print(f"  Mode   : PAID (cost cap: ${MAX_COST_USD:.2f})")
        print(f"  Delay  : {delay}s between calls")
    else:
        print("  Mode   : FREE TIER ONLY")
        print(f"  Delay  : {delay}s between calls")
        print("  Cost   : $0.00 (free-tier API key)")
    print("=" * 60)
    print()

    # Load dependencies
    try:
        api_key  = load_api_key(is_paid)
        taxonomy = load_taxonomy()
    except Exception as e:
        logger.error(f"Startup error: {e}")
        sys.exit(1)

    # ── Pre-flight test call ──
    print("  Running pre-flight test call...")
    import requests
    test_url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={api_key}"
    test_payload = {
        "contents": [{"parts": [{"text": "Reply with just: ok"}]}],
        "generationConfig": {"temperature": 0.0},
    }
    try:
        test_resp = requests.post(test_url, json=test_payload, timeout=15)
        if test_resp.status_code == 429:
            print()
            print("  !! FREE TIER QUOTA ALREADY EXHAUSTED FOR TODAY !!")
            print("  !! Try again tomorrow (resets at midnight Pacific Time) !!")
            print()
            sys.exit(0)
        if test_resp.status_code != 200:
            error_msg = test_resp.json().get("error", {}).get("message", "Unknown error")
            print(f"  !! Pre-flight test FAILED: {error_msg}")
            sys.exit(1)
        print(f"  Pre-flight OK — model {MODEL} is responding")
    except Exception as e:
        print(f"  !! Pre-flight test FAILED: {e}")
        sys.exit(1)

    # Load daily counter
    daily = load_daily_count()
    print(f"  Calls today so far: {daily['calls']}")
    print()

    # Find all designs that need enrichment
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    pending = conn.execute(
        "SELECT * FROM designs WHERE seo_title IS NULL ORDER BY scrape_timestamp"
    ).fetchall()
    total_pending = len(pending)
    total_all     = conn.execute("SELECT COUNT(*) FROM designs").fetchone()[0]

    print(f"  Designs in DB       : {total_all}")
    print(f"  Already enriched    : {total_all - total_pending}")
    print(f"  Pending enrichment  : {total_pending}")
    print(f"  Est. free calls/day : ~1,000")
    if total_pending > 0:
        days_needed = max(1, total_pending // 1000 + (1 if total_pending % 1000 > 0 else 0))
        print(f"  Est. days to finish : ~{days_needed}")
    print("=" * 60)
    print()

    if total_pending == 0:
        print("  Nothing to enrich — all designs already have SEO data!")
        conn.close()
        return

    enriched_count = 0
    error_count    = 0
    consecutive_errors = 0
    start_time     = time.time()
    stopped_reason = None
    total_cost     = 0.0

    try:
        for i, row in enumerate(pending, start=1):
            design = dict(row)
            design_id = design.get("design_id")
            title = design.get("title", "")[:55]

            print(f"  [{i}/{total_pending}] {title}")

            fields, usage = enrich_one(api_key, design, taxonomy)

            daily["calls"] += 1

            if is_paid and usage:
                in_tokens = usage.get("promptTokenCount", 0)
                out_tokens = usage.get("candidatesTokenCount", 0)
                cost = (in_tokens / 1_000_000 * COST_PER_M_INPUT) + (out_tokens / 1_000_000 * COST_PER_M_OUTPUT)
                total_cost += cost

            if fields:
                consecutive_errors = 0
                # Update only the enrichment columns
                update_sql = """
                    UPDATE designs SET
                        niche              = ?,
                        secondary_niche    = ?,
                        recipient          = ?,
                        occasion           = ?,
                        style              = ?,
                        theme              = ?,
                        primary_keyword    = ?,
                        secondary_keyword  = ?,
                        long_tail_keyword  = ?,
                        seo_title          = ?,
                        h1                 = ?,
                        meta_description   = ?,
                        image_alt          = ?,
                        canonical_url      = ?,
                        jsonld_type        = ?
                    WHERE design_id = ?
                """
                conn.execute(update_sql, [
                    fields.get("niche"),
                    fields.get("secondary_niche"),
                    fields.get("recipient"),
                    fields.get("occasion"),
                    fields.get("style"),
                    fields.get("theme"),
                    fields.get("primary_keyword"),
                    fields.get("secondary_keyword"),
                    fields.get("long_tail_keyword"),
                    fields.get("seo_title"),
                    fields.get("h1"),
                    fields.get("meta_description"),
                    fields.get("image_alt"),
                    fields.get("canonical_url"),
                    fields.get("jsonld_type"),
                    design_id,
                ])
                enriched_count += 1
                daily["enriched"] += 1

                # Commit every BATCH_SIZE designs
                if enriched_count % BATCH_SIZE == 0:
                    conn.commit()
                    save_daily_count(daily)
                    elapsed  = time.time() - start_time
                    rate     = enriched_count / elapsed if elapsed > 0 else 0
                    remaining = (total_pending - i) / rate if rate > 0 else 0
                    if is_paid:
                        print(
                            f"    >> Saved {enriched_count} designs "
                            f"(~{remaining/60:.0f} min remaining, "
                            f"Cost so far: ${total_cost:.4f})"
                        )
                    else:
                        print(
                            f"    >> Saved {enriched_count} designs "
                            f"(~{remaining/60:.0f} min remaining, "
                            f"{daily['calls']} calls today)"
                        )

                if is_paid and total_cost >= MAX_COST_USD:
                    stopped_reason = f"Stopped: Hard cost cap of ${MAX_COST_USD:.2f} reached (Spent: ${total_cost:.4f})"
                    logger.warning(stopped_reason)
                    break
            else:
                error_count += 1
                daily["errors"] += 1
                consecutive_errors += 1

                if consecutive_errors >= MAX_CONSECUTIVE_ERRORS:
                    stopped_reason = (
                        f"Stopped: {MAX_CONSECUTIVE_ERRORS} consecutive errors. "
                        "Something may be wrong with the API."
                    )
                    logger.warning(stopped_reason)
                    break

            # Rate limit: wait before next call
            if i < total_pending:
                time.sleep(delay)

    except QuotaExhaustedError as e:
        stopped_reason = str(e)
        print()
        print("=" * 60)
        print(f"  !! {stopped_reason}")
        print("=" * 60)

    except KeyboardInterrupt:
        stopped_reason = "Stopped by user (Ctrl+C). Progress has been saved."
        print()
        print(f"\n  {stopped_reason}")

    finally:
        # Always commit remaining progress and save daily count
        conn.commit()
        conn.close()
        save_daily_count(daily)

    # Summary
    elapsed_min = (time.time() - start_time) / 60
    print()
    print("=" * 60)
    if stopped_reason:
        print(f"  Session stopped: {stopped_reason[:80]}")
    else:
        print("  Enrichment complete!")
    print("=" * 60)
    print(f"  Enriched this session  : {enriched_count} designs")
    print(f"  Errors this session    : {error_count} designs (skipped)")
    print(f"  Time                   : {elapsed_min:.1f} minutes")
    print(f"  API calls today (total): {daily['calls']}")
    if is_paid:
        print(f"  Est. Cost (session)    : ${total_cost:.4f}")
    else:
        print(f"  Cost                   : $0.00 (free tier)")
    remaining = total_pending - enriched_count - error_count
    if remaining > 0:
        print(f"  Still pending          : {remaining} designs")
        print(f"  >> Run this script again tomorrow to continue!")
    print("=" * 60)
    print()


if __name__ == "__main__":
    main()
