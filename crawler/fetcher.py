import time
import random
import json
import logging
from pathlib import Path
from config.config_loader import CrawlerConfig

logger = logging.getLogger(__name__)

# Where cookies are persisted between runs
COOKIES_FILE = Path("data") / "session_cookies.json"
# Persistent Chrome profile dir — same identity every run
CHROME_PROFILE_DIR = Path("data") / "chrome_profile"

# Selector present on any real TeePublic listing page
LISTING_CONTENT_SELECTOR = "a[href*='/t-shirt/'], a[href*='/sticker/'], a[href*='/hoodie/']"

# Cloudflare challenge detection strings
CF_TITLES = ("just a moment", "performing security verification", "security verification")


class Fetcher:
    """
    SeleniumBase Undetected Chrome (UC) fetcher for Cloudflare bypass.

    UC mode patches the ChromeDriver binary so Cloudflare's Turnstile
    fingerprinting cannot detect automation. Uses a persistent Chrome
    profile so the browser identity is trusted across all runs.

    Workflow:
      1. Run --setup-session once (visible browser, CF verifies you)
      2. Run --crawl — reuses the same profile, CF recognises you
    """

    def __init__(self, config: CrawlerConfig):
        self.config = config
        self.last_request_time = 0.0
        self._driver = None

    def start(self, headless: bool = False):
        """Launch Undetected Chrome with persistent profile."""
        from seleniumbase import Driver

        CHROME_PROFILE_DIR.mkdir(parents=True, exist_ok=True)

        logger.info(
            f"Starting SeleniumBase UC driver (headless={headless}, "
            f"profile={CHROME_PROFILE_DIR})"
        )
        self._driver = Driver(
            uc=True,
            headless=headless,
            user_data_dir=str(CHROME_PROFILE_DIR.resolve()),
        )
        logger.info("UC driver started.")

    def stop(self):
        """Close the browser cleanly."""
        try:
            if self._driver:
                self._driver.quit()
        except Exception as e:
            logger.warning(f"Error closing UC driver: {e}")
        self._driver = None
        logger.info("UC driver stopped.")

    def save_session(self):
        """Save current cookies to JSON for diagnostics."""
        if not self._driver:
            return
        try:
            COOKIES_FILE.parent.mkdir(parents=True, exist_ok=True)
            cookies = self._driver.get_cookies()
            state = {"cookies": cookies}
            with open(COOKIES_FILE, "w", encoding="utf-8") as f:
                json.dump(state, f, indent=2)
            logger.debug(f"Cookies saved to {COOKIES_FILE}")
        except Exception as e:
            logger.warning(f"Could not save cookies: {e}")

    def setup_session_interactive(self, store_url: str):
        """
        Opens the store in a visible UC Chrome window.
        User presses ENTER once the page loads — profile is saved automatically
        (it's a persistent profile, so nothing extra to save).
        """
        if not self._driver:
            raise RuntimeError("Fetcher not started. Call start() first.")

        print("\n" + "=" * 60)
        print("INTERACTIVE SESSION SETUP")
        print("=" * 60)
        print(f"Opening: {store_url}")
        print()
        print("1. Wait for Chrome to open and the store page to load.")
        print("2. If you see a security check, wait for it to auto-resolve.")
        print("3. Scroll around, click a product or two to build trust.")
        print("4. Come back HERE and press ENTER when products are visible.")
        print("=" * 60 + "\n")

        try:
            # Use uc_open_with_reconnect for better CF handling during setup
            self._driver.uc_open_with_reconnect(store_url, reconnect_time=6)
        except Exception as e:
            logger.warning(f"Navigation warning: {e}")
            try:
                self._driver.get(store_url)
            except Exception:
                pass

        # Extra wait for CF to fully settle
        time.sleep(8)

        input("Press ENTER when the TeePublic store page is fully loaded... ")
        self.save_session()
        print(f"\n✅ Profile saved at: {CHROME_PROFILE_DIR}")
        print("You can now run 2_CRAWL.bat\n")

    def _rate_limit(self):
        now = time.time()
        elapsed = now - self.last_request_time
        delay = self.config.rate_limit_seconds + random.uniform(0.5, 2.0)
        if elapsed < delay:
            time.sleep(delay - elapsed)
        self.last_request_time = time.time()

    def _is_cloudflare_challenge(self) -> bool:
        """Check if current page is a CF challenge."""
        try:
            title = self._driver.title.lower()
            if any(t in title for t in CF_TITLES):
                return True
            url = self._driver.current_url
            if "cdn-cgi/challenge-platform" in url:
                return True
            # Also check page text for CF-style content
            page_src = self._driver.page_source.lower()
            if "performing security verification" in page_src:
                return True
        except Exception:
            pass
        return False

    def _wait_for_cloudflare(self, timeout_s: int = 90) -> bool:
        """
        Wait for CF to auto-resolve. UC mode usually solves it in <5s.
        If it doesn't resolve, try moving the mouse to help trigger the CF checkbox.
        """
        logger.info("CF challenge detected — UC mode attempting auto-solve...")

        for i in range(timeout_s // 2):
            time.sleep(2)
            if not self._is_cloudflare_challenge():
                logger.info("CF challenge resolved.")
                return True

            # Every 10s, try a small mouse movement to help CF solve
            if i > 0 and i % 5 == 0:
                try:
                    self._driver.execute_script(
                        "document.dispatchEvent(new MouseEvent('mousemove', "
                        "{clientX: Math.random()*200+100, clientY: Math.random()*200+100}));"
                    )
                    logger.debug("Simulated mouse movement to assist CF solve.")
                except Exception:
                    pass

        logger.error(
            "CF not resolved after 90s. Delete data/chrome_profile and "
            "re-run 1_SETUP_SESSION.bat"
        )
        return False

    def fetch(self, url: str, is_listing: bool = False) -> str | None:
        """
        Navigate to a URL and return the rendered HTML.

        Uses uc_open_with_reconnect which is SeleniumBase's most robust
        CF-bypass method — it disconnects CDP after navigation so CF's
        bot checks don't detect the automated driver connection.

        Args:
            url: Target URL.
            is_listing: True for store/paginated listing pages.
        """
        if not self._driver:
            raise RuntimeError("Fetcher not started. Call start() first.")

        self._rate_limit()

        for attempt in range(1, self.config.max_retries + 1):
            try:
                logger.info(f"Fetching (attempt {attempt}/{self.config.max_retries}): {url}")

                # uc_open_with_reconnect: best CF bypass in seleniumbase
                # It navigates, disconnects CDP, waits, then reconnects
                try:
                    self._driver.uc_open_with_reconnect(url, reconnect_time=4)
                except Exception:
                    # Fallback to normal get if uc method fails
                    self._driver.get(url)

                # Give the page time to settle / CF to auto-resolve
                time.sleep(random.uniform(2.5, 4.0))

                # Check for CF and wait if needed
                if self._is_cloudflare_challenge():
                    resolved = self._wait_for_cloudflare(timeout_s=90)
                    if not resolved:
                        if attempt < self.config.max_retries:
                            logger.warning(f"CF not resolved on attempt {attempt}, retrying in 10s...")
                            time.sleep(10)
                            continue
                        logger.error(f"Giving up on {url} after {self.config.max_retries} attempts.")
                        return None

                # Save cookies after each successful fetch
                self.save_session()

                html = self._driver.page_source
                logger.debug(f"Fetched {len(html)} bytes from {url}")
                return html

            except Exception as e:
                logger.error(f"Failed to fetch {url} (attempt {attempt}): {e}")
                if attempt < self.config.max_retries:
                    time.sleep(5)

        return None
