import re
from typing import List, Set
from bs4 import BeautifulSoup
from parser.normalizer import normalize_url

def extract_design_urls(html_content: str, base_url: str = "https://www.teepublic.com") -> Set[str]:
    """Extracts unique design URLs from a store or listing page."""
    soup = BeautifulSoup(html_content, 'html.parser')
    design_urls = set()
    
    for a_tag in soup.find_all('a', href=True):
        href = a_tag['href']
        # We look for product links, typically starting with /t-shirt/, /sticker/, etc.
        # But to be safe, we can capture the core design slug.
        # Usually, TeePublic links are like /t-shirt/12345-slug-name
        if re.search(r'/(?:t-shirt|sticker|mug|hoodie|poster|phone-case)/(\d+-[a-zA-Z0-9\-]+)', href):
            # Let's normalize to the canonical design path if possible, or just keep the href.
            # We will clean the query parameters.
            clean_href = href.split('?')[0]
            normalized = normalize_url(clean_href, base_url)
            if normalized:
                design_urls.add(normalized)
                
    return design_urls

def extract_pagination_urls(html_content: str, current_url: str, base_url: str = "https://www.teepublic.com") -> Set[str]:
    """Extracts pagination URLs to discover more pages in the store."""
    soup = BeautifulSoup(html_content, 'html.parser')
    pagination_urls = set()
    
    for a_tag in soup.find_all('a', href=True):
        href = a_tag['href']
        if '?page=' in href or '&page=' in href:
            normalized = normalize_url(href, base_url)
            if normalized:
                pagination_urls.add(normalized)
                
    return pagination_urls
