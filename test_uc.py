"""Quick smoke test: does SeleniumBase UC mode bypass TeePublic's CF?"""
import time
from seleniumbase import Driver

print("Starting SeleniumBase UC driver (visible Chrome)...")
driver = Driver(uc=True, headless=False)

try:
    print("Navigating to TeePublic store...")
    driver.get("https://www.teepublic.com/user/theblackpanther")
    print("Waiting 8 seconds for CF to resolve...")
    time.sleep(8)

    title = driver.title
    url = driver.current_url
    html = driver.page_source
    cf_blocked = any(t in title.lower() for t in ("just a moment", "security verification", "performing security"))
    has_products = "t-shirt" in html.lower() or "design" in html.lower()

    print(f"\nTitle:       {title}")
    print(f"URL:         {url}")
    print(f"CF blocked:  {cf_blocked}")
    print(f"Has products: {has_products}")

    if not cf_blocked and has_products:
        print("\n✅ SUCCESS - CF bypass working!")
    else:
        print("\n❌ BLOCKED - CF still showing challenge")

finally:
    driver.quit()
