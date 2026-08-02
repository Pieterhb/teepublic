from parser.normalizer import clean_text, normalize_url
from parser.design_parser import parse_design_page

def test_clean_text():
    assert clean_text("  hello \n world  ") == "hello world"
    assert clean_text("T-Shirt &amp; Mug") == "T-Shirt & Mug"
    assert clean_text(None) is None

def test_normalize_url():
    assert normalize_url("/t-shirt/123-slug") == "https://www.teepublic.com/t-shirt/123-slug"
    assert normalize_url("https://www.teepublic.com/t-shirt/123-slug") == "https://www.teepublic.com/t-shirt/123-slug"
    assert normalize_url(None) is None

def test_parse_design_page_basic():
    """Tests core field extraction (design_id, slug, title, description, image_url)."""
    html_mock = """
    <html>
        <head>
            <meta name="description" content="A cool shirt">
            <meta property="og:image" content="https://example.com/img.png">
        </head>
        <body>
            <h1>Cool Shirt</h1>
        </body>
    </html>
    """
    url = "https://www.teepublic.com/t-shirt/123-cool-shirt"
    data = parse_design_page(html_mock, url)

    assert data["design_id"] == "123"
    assert data["slug"] == "cool-shirt"
    assert data["title"] == "Cool Shirt"
    assert data["description"] == "A cool shirt"
    assert data["image_url"] == "https://example.com/img.png"


def test_parse_design_page_tags():
    """Tests tag extraction from the TeePublic h4.m-design__subtitles + nav pattern."""
    html_mock = """
    <html>
        <head>
            <meta name="description" content="A cool shirt">
        </head>
        <body>
            <h1>Cool Shirt</h1>
            <h4 class="m-design__subtitles">Tags</h4>
            <nav>
                <a href="/tag1">Tag 1</a>
                <a href="/tag2">Tag 2</a>
            </nav>
        </body>
    </html>
    """
    url = "https://www.teepublic.com/t-shirt/456-cool-shirt"
    data = parse_design_page(html_mock, url)

    assert data["tags"] == "Tag 1, Tag 2"
