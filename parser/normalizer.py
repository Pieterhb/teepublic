import re
import html

def clean_text(text: str | None) -> str | None:
    """Removes extra whitespace and decodes HTML entities."""
    if not text:
        return None
    text = html.unescape(text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def normalize_url(url: str, base_url: str = "https://www.teepublic.com") -> str | None:
    """Ensures absolute URLs."""
    if not url:
        return None
    if url.startswith("http"):
        return url
    if url.startswith("/"):
        return f"{base_url}{url}"
    return f"{base_url}/{url}"
