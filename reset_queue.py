import sqlite3, os
db = 'data/processed/master_database.sqlite'
if os.path.exists(db):
    conn = sqlite3.connect(db)
    conn.execute("UPDATE crawl_queue SET status='pending', error_message=NULL WHERE status='error'")
    conn.execute("UPDATE crawl_queue SET status='pending' WHERE url='https://www.teepublic.com/user/theblackpanther'")
    conn.commit()
    pending = conn.execute("SELECT COUNT(*) FROM crawl_queue WHERE status='pending'").fetchone()[0]
    done    = conn.execute("SELECT COUNT(*) FROM crawl_queue WHERE status='parsed'").fetchone()[0]
    designs = conn.execute('SELECT COUNT(*) FROM designs').fetchone()[0]
    conn.close()
    print(f'Queue reset. Pending={pending}, Done={done}, Designs saved={designs}')
else:
    print('No DB yet - will be created fresh on first crawl run.')
