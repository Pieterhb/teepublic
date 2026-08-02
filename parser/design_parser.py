import re
import json
import datetime
import logging
from typing import Dict, Any
from bs4 import BeautifulSoup
from parser.normalizer import clean_text

logger = logging.getLogger(__name__)


def parse_design_page(html_content: str, url: str) -> Dict[str, Any]:
    """
    Parses a TeePublic design page and extracts metadata.

    Strategy:
      1. Primary: Extract from the JSON-LD Product schema (most reliable).
      2. Fallback: Extract from Open Graph meta tags and HTML elements.
    """
    soup = BeautifulSoup(html_content, "html.parser")

    data: Dict[str, Any] = {
        "design_id": None,
        "title": None,
        "slug": None,
        "teepublic_url": url,
        "image_url": None,
        "description": None,
        "tags": None,
        "artist": None,
        "collection": None,
        "product_types": None,
        "scrape_timestamp": datetime.datetime.now().isoformat(),
    }

    # ── 1. Extract design_id and slug from URL ────────────────────────────────
    match = re.search(r"/(\d+)-([a-zA-Z0-9\-]+)$", url.rstrip("/"))
    if match:
        data["design_id"] = match.group(1)
        data["slug"] = match.group(2)

    # ── 2. JSON-LD Product schema (primary source) ────────────────────────────
    jsonld_data = _extract_jsonld_product(soup)
    if jsonld_data:
        data["title"] = clean_text(jsonld_data.get("name"))
        data["description"] = clean_text(jsonld_data.get("description"))
        data["product_types"] = clean_text(jsonld_data.get("category"))

        image_obj = jsonld_data.get("image", {})
        if isinstance(image_obj, dict):
            data["image_url"] = image_obj.get("url")
        elif isinstance(image_obj, str):
            data["image_url"] = image_obj

    # ── 3. Fallback: OpenGraph and H1 ────────────────────────────────────────
    if not data["title"]:
        og_title = soup.find("meta", property="og:title")
        if og_title:
            data["title"] = clean_text(og_title.get("content"))
        else:
            h1 = soup.find("h1")
            if h1:
                data["title"] = clean_text(h1.get_text())

    if not data["image_url"]:
        og_image = soup.find("meta", property="og:image")
        if og_image:
            data["image_url"] = og_image.get("content")

    if not data["description"]:
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc:
            data["description"] = clean_text(meta_desc.get("content"))

    # ── 4. Artist name ────────────────────────────────────────────────────────
    artist_link = soup.find("a", href=re.compile(r"/user/"))
    if artist_link:
        data["artist"] = clean_text(artist_link.get_text())

    # ── 5. Tags (from m-design__subtitles nav) ────────────────────────────────
    tags_heading = soup.find("h4", class_=re.compile(r"m-design__subtitles"))
    if tags_heading:
        tags_nav = tags_heading.find_next_sibling("nav")
        if tags_nav:
            tag_list = [clean_text(a.get_text()) for a in tags_nav.find_all("a") if a.get_text(strip=True)]
            data["tags"] = ", ".join(tag_list) if tag_list else None

    # ── 6. Collection (breadcrumbs) ───────────────────────────────────────────
    breadcrumb_links = soup.find_all("a", href=re.compile(r"/collections?/|/user/"))
    if breadcrumb_links:
        # Last breadcrumb before the design title is often the collection
        data["collection"] = clean_text(breadcrumb_links[-1].get_text())

    return data


def _extract_jsonld_product(soup: BeautifulSoup) -> Dict[str, Any] | None:
    """Finds and parses the first JSON-LD script block with @type == 'Product'."""
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        if not script.string:
            continue
        try:
            data = json.loads(script.string)
            if data.get("@type") == "Product":
                return data
        except (json.JSONDecodeError, ValueError):
            continue
    return None
