import sqlite3
import os

conn = sqlite3.connect('data/processed/master_database.sqlite')

print('=== PENDING URLs (first 10) ===')
rows = conn.execute("SELECT url, status FROM crawl_queue WHERE status='pending' LIMIT 10").fetchall()
for r in rows:
    print(f'  [{r[1]}] {r[0]}')

print()
print('=== ERROR URLs ===')
rows = conn.execute("SELECT url, error_message FROM crawl_queue WHERE status='error' LIMIT 10").fetchall()
for r in rows:
    print(f'  ERROR: {r[0]} -> {r[1]}')

print()
print('=== Chrome profile exists? ===')
print('  Profile dir:', os.path.exists('data/chrome_profile'))
if os.path.exists('data/chrome_profile'):
    files = os.listdir('data/chrome_profile')
    print(f'  Files in profile: {len(files)} items')

conn.close()
