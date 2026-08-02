from crawler.discovery import extract_design_urls, extract_pagination_urls

def test_extract_design_urls():
    html_mock = """
    <a href="/t-shirt/123-slug?store_id=999">Product 1</a>
    <a href="/sticker/456-other-slug">Product 2</a>
    <a href="/about">About</a>
    """
    urls = extract_design_urls(html_mock)
    assert len(urls) == 2
    assert "https://www.teepublic.com/t-shirt/123-slug" in urls
    assert "https://www.teepublic.com/sticker/456-other-slug" in urls

def test_extract_pagination_urls():
    html_mock = """
    <a href="/user/theblackpanther?page=2">Next</a>
    <a href="/user/theblackpanther?page=3">3</a>
    <a href="/about">About</a>
    """
    current_url = "https://www.teepublic.com/user/theblackpanther"
    urls = extract_pagination_urls(html_mock, current_url)
    assert len(urls) == 2
    assert "https://www.teepublic.com/user/theblackpanther?page=2" in urls
    assert "https://www.teepublic.com/user/theblackpanther?page=3" in urls
