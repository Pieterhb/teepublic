import sqlite3
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

SCHEMA_SQL = """
-- Master database schema
CREATE TABLE IF NOT EXISTS designs (
    design_id TEXT PRIMARY KEY,
    title TEXT,
    slug TEXT UNIQUE,
    teepublic_url TEXT UNIQUE,
    image_url TEXT,
    description TEXT,
    tags TEXT,
    artist TEXT,
    collection TEXT,
    product_types TEXT,
    niche TEXT,
    secondary_niche TEXT,
    recipient TEXT,
    occasion TEXT,
    style TEXT,
    theme TEXT,
    primary_keyword TEXT,
    secondary_keyword TEXT,
    long_tail_keyword TEXT,
    seo_title TEXT,
    h1 TEXT,
    meta_description TEXT,
    image_alt TEXT,
    canonical_url TEXT,
    breadcrumbs TEXT,
    content_cluster TEXT,
    pillar_page TEXT,
    jsonld_type TEXT,
    scrape_timestamp DATETIME
);

-- Crawl queue / Checkpointing table
CREATE TABLE IF NOT EXISTS crawl_queue (
    url TEXT PRIMARY KEY,
    status TEXT DEFAULT 'pending', -- pending, fetched, parsed, error
    retry_count INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT
);
"""

class DatabaseManager:
    def __init__(self, db_path: str):
        self.db_path = db_path
        # Ensure parent directories exist
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self.init_db()

    def get_connection(self):
        # Allow multi-threading access if needed, with isolation level
        conn = sqlite3.connect(self.db_path, isolation_level=None)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        try:
            with self.get_connection() as conn:
                conn.executescript(SCHEMA_SQL)
                logger.info("Database schema initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise
