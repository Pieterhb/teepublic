import argparse
import logging
import sys
import yaml
from config.config_loader import load_config
from db.db import DatabaseManager
from export.exporter import Exporter
from crawler.fetcher import Fetcher
from crawler.discovery import extract_design_urls, extract_pagination_urls
from parser.design_parser import parse_design_page
from enrichment.ai_enricher import AIEnricher

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(open(1, 'w', encoding='utf-8', closefd=False)),  # stdout with utf-8
        logging.FileHandler("logs/crawl.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)


def crawl_store(config, db_manager, max_pages: int = 0):
    """
    Orchestrates the crawling of the store, queuing URLs and processing them.
    
    Args:
        config: App configuration.
        db_manager: DatabaseManager instance.
        max_pages: Max number of pages/URLs to process (0 = unlimited, crawl all).
    """
    fetcher = Fetcher(config.crawler)
    fetcher.start(headless=False)  # persistent Chrome profile — visible window, CF trusts the browser

    # Load taxonomy once
    taxonomy = {}
    try:
        with open(config.enrichment.taxonomy_path, "r", encoding="utf-8") as f:
            taxonomy = yaml.safe_load(f)
    except Exception as e:
        logger.warning(f"Could not load taxonomy: {e}")

    # Create enricher once
    enricher = AIEnricher(config.enrichment) if config.enrichment.enabled else None

    # Initialize crawl queue with store URL if empty
    with db_manager.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM crawl_queue WHERE status='pending'")
        if cursor.fetchone()["count"] == 0:
            logger.info("Initializing crawl queue with store URL")
            conn.execute(
                "INSERT OR IGNORE INTO crawl_queue (url, status) VALUES (?, ?)",
                (config.crawler.store_url, "pending"),
            )

    pages_processed = 0

    try:
        while True:
            if max_pages > 0 and pages_processed >= max_pages:
                logger.info(f"Reached max pages limit ({max_pages}). Stopping crawl.")
                break

            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT url FROM crawl_queue WHERE status = 'pending' LIMIT 1")
                row = cursor.fetchone()

            if not row:
                logger.info("Crawl queue is empty. Finished crawling.")
                break

            url = row["url"]
            logger.info(f"Processing URL [{pages_processed + 1}]: {url}")

            # Determine page type before fetching (to pass the right selector)
            is_listing = (
                url == config.crawler.store_url
                or "page=" in url
                or url.rstrip("/").endswith(config.crawler.store_url.rstrip("/").split("/")[-1])
            )
            new_urls: set = set()

            html_content = fetcher.fetch(url, is_listing=is_listing)
            if not html_content:
                with db_manager.get_connection() as conn:
                    conn.execute(
                        "UPDATE crawl_queue SET status='error', error_message='Failed to fetch' WHERE url=?",
                        (url,),
                    )
                pages_processed += 1
                continue

            if is_listing:
                design_urls = extract_design_urls(html_content)
                pagination_urls = extract_pagination_urls(html_content, url)
                new_urls.update(design_urls)
                new_urls.update(pagination_urls)
                logger.info(
                    f"  -> Found {len(design_urls)} design URLs, {len(pagination_urls)} pagination URLs."
                )
            else:
                # It's a design page
                data = parse_design_page(html_content, url)

                if data and data.get("title"):
                    # AI Enrichment
                    if enricher and taxonomy:
                        data = enricher.enrich(data, taxonomy)

                    # Build upsert SQL from data dict (only keys in our schema)
                    schema_keys = [
                        "design_id", "title", "slug", "teepublic_url", "image_url",
                        "description", "tags", "artist", "collection", "product_types",
                        "niche", "secondary_niche", "recipient", "occasion", "style",
                        "theme", "primary_keyword", "secondary_keyword", "long_tail_keyword",
                        "seo_title", "h1", "meta_description", "image_alt", "canonical_url",
                        "breadcrumbs", "content_cluster", "pillar_page", "jsonld_type",
                        "scrape_timestamp",
                    ]
                    filtered = {k: data.get(k) for k in schema_keys}
                    fields = ", ".join(filtered.keys())
                    placeholders = ", ".join(["?"] * len(filtered))
                    sql = f"""
                        INSERT INTO designs ({fields}) VALUES ({placeholders})
                        ON CONFLICT(design_id) DO UPDATE SET
                            title=excluded.title,
                            description=excluded.description,
                            tags=excluded.tags,
                            image_url=excluded.image_url,
                            niche=excluded.niche,
                            seo_title=excluded.seo_title,
                            meta_description=excluded.meta_description
                    """
                    try:
                        with db_manager.get_connection() as conn:
                            conn.execute(sql, list(filtered.values()))
                        logger.info(f"  -> Saved design: {data.get('title')}")
                    except Exception as e:
                        logger.error(f"  -> DB error saving {url}: {e}")
                else:
                    logger.warning(f"  -> Skipped (no title): {url}")

            # Update queue status and enqueue new URLs
            with db_manager.get_connection() as conn:
                conn.execute("UPDATE crawl_queue SET status='parsed' WHERE url=?", (url,))
                for new_url in new_urls:
                    conn.execute(
                        "INSERT OR IGNORE INTO crawl_queue (url, status) VALUES (?, ?)",
                        (new_url, "pending"),
                    )

            pages_processed += 1

    finally:
        fetcher.stop()

    logger.info(f"Crawl complete. Processed {pages_processed} URLs.")


def main():
    parser = argparse.ArgumentParser(description="TeePublic Scraper & pSEO Engine")
    parser.add_argument("--crawl", action="store_true", help="Run the crawler and parser")
    parser.add_argument("--export", action="store_true", help="Export the database to CSV and JSON")
    parser.add_argument(
        "--setup-session",
        action="store_true",
        help=(
            "Open an interactive browser to solve Cloudflare manually. "
            "Run this once before --crawl to save your session cookies."
        ),
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=0,
        help="Max number of pages to crawl (0 = unlimited, default=0)",
    )
    parser.add_argument(
        "--config",
        type=str,
        default="config/config.yaml",
        help="Path to config file (default: config/config.yaml)",
    )
    args = parser.parse_args()

    config = load_config(args.config)
    db_manager = DatabaseManager(config.database.db_path)

    import os
    os.makedirs("logs", exist_ok=True)

    if args.setup_session:
        logger.info("Starting interactive session setup...")
        fetcher = Fetcher(config.crawler)
        fetcher.start(headless=False)  # visible window for CF to verify once
        try:
            fetcher.setup_session_interactive(config.crawler.store_url)
        finally:
            fetcher.stop()

    elif args.crawl:
        logger.info("Starting crawl phase...")
        crawl_store(config, db_manager, max_pages=args.max_pages)

    elif args.export:
        logger.info("Starting export phase...")
        exporter = Exporter(db_manager, config.output)
        exporter.export_csv()
        exporter.export_json()
        exporter.generate_validation_report()
        logger.info("Export complete.")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
