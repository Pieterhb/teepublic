import sqlite3
import os

db = 'data/processed/master_database.sqlite'

print("=" * 50)
print("  TEEPUBLIC SCRAPER - PROGRESS CHECK")
print("=" * 50)
print()

if not os.path.exists(db):
    print("  No database found yet.")
    print("  Run TEST_3_PAGES.bat or 2_CRAWL.bat first.")
else:
    conn = sqlite3.connect(db)
    designs = conn.execute('SELECT COUNT(*) FROM designs').fetchone()[0]
    pending = conn.execute("SELECT COUNT(*) FROM crawl_queue WHERE status='pending'").fetchone()[0]
    done    = conn.execute("SELECT COUNT(*) FROM crawl_queue WHERE status='parsed'").fetchone()[0]
    errors  = conn.execute("SELECT COUNT(*) FROM crawl_queue WHERE status='error'").fetchone()[0]
    total   = pending + done + errors
    pct     = round(done / total * 100, 1) if total > 0 else 0

    print(f"  Designs saved in DB : {designs}")
    print(f"  URLs completed      : {done}")
    print(f"  URLs still pending  : {pending}")
    print(f"  URLs with errors    : {errors}")
    print(f"  Overall progress    : {pct}% ({done}/{total})")

    if designs > 0:
        print()
        print("  Last 5 designs saved:")
        rows = conn.execute(
            "SELECT title, scrape_timestamp FROM designs ORDER BY scrape_timestamp DESC LIMIT 5"
        ).fetchall()
        for row in rows:
            print(f"    - {row[0]}")

    conn.close()

print()
print("=" * 50)
