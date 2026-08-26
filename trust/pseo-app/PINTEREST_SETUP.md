# Pinterest 11-Board RSS Auto-Publishing & Setup Guide

This guide explains how to set up and maintain the **100% Free & Zero-API Native RSS Auto-Publishing System** for your 11 Pinterest boards on [za.pinterest.com/PantherMerch](https://za.pinterest.com/PantherMerch/).

---

## 🎯 How The System Works

1. **Daily Automation (05:00 UTC / 07:00 SAST)**:
   - GitHub Actions runs every morning automatically.
   - It selects **exactly 1 brand-new, unpinned product** for each of your 11 boards.
   - It writes 11 RSS 2.0 XML feeds to `public/rss/{slug}.xml` and deploys them to `https://blackpantherstore.co.za/rss/{slug}.xml`.
   - It updates `data/pinned_history.json` and commits back to GitHub so no product is ever pinned twice across any board.

2. **100% Duplicate Prevention & Multi-Tier Selection**:
   - **Global Unique ID Tracking**: Every product ID ever selected is recorded in `pinnedIds`. Once an ID is pinned on ANY board, it is permanently locked out from all boards.
   - **Multi-Tier Candidate Fallback**:
     - *Tier 1*: Direct category product list.
     - *Tier 2*: Related niche/theme matches (e.g. `professions-shirts` pulls from Teacher, Developer, Engineer, Doctor, Nurse, Chef, etc.).
     - *Tier 3*: General unpinned catalog fallback.
     - Guarantees continuous daily pinning for 340+ days across all 11 boards without category exhaustion.

3. **Pinterest-Optimized Feed Engine (Rolling 10-Item Buffer)**:
   - Feeds maintain a rolling window of the **10 most recent pins** in chronological order.
   - **Why 10 items?** Pinterest's scraper visits on a 24–48 hour crawl window. A 10-item buffer ensures Pinterest's crawler never misses a daily pin if a crawl is delayed.
   - **Why no duplicates?** Pinterest tracks the unique canonical `<guid isPermaLink="true">` of every pin it creates. When Pinterest crawls the feed, it skips the 9 previously pinned items and publishes **only the 1 new daily pin**.

---

## ⚙️ Step-by-Step Pinterest Setup (One-Time Configuration)

### Step 1: Clear Any Old / Broken Feed Connections
1. Log into your Pinterest Business account at [pinterest.com](https://pinterest.com).
2. Go to **Settings** (top right profile icon → Settings).
3. In the left-hand navigation, click **Bulk create Pins** (or **Auto-publish**).
4. If you have any existing RSS feeds listed, click the **Disconnect** or **Delete** button next to each one to start completely fresh.

---

### Step 2: Connect the 11 RSS Feeds to Their Respective Boards
In the **Bulk create Pins / Auto-publish** section, click **Connect RSS Feed** for each of the 11 boards below.

> [!IMPORTANT]
> **For every feed you add**, ensure you select the **matching board name** from the Pinterest dropdown before clicking Save!
> Each RSS feed corresponds to ONE specific board.

| # | Board Name on Pinterest | Exact Public RSS Feed URL | Destination Board in Dropdown |
|---|---|---|---|
| 1 | **Astronomy Shirts** | `https://blackpantherstore.co.za/rss/astronomy-shirts.xml` | Select: **Astronomy Shirts** |
| 2 | **Hobbies Shirts** | `https://blackpantherstore.co.za/rss/hobbies-shirts.xml` | Select: **Hobbies Shirts** |
| 3 | **Animals Shirts** | `https://blackpantherstore.co.za/rss/animals-shirts.xml` | Select: **Animals Shirts** |
| 4 | **Minimalist Engineer Shirts** | `https://blackpantherstore.co.za/rss/minimalist-engineer-shirts.xml` | Select: **Minimalist Engineer Shirts** |
| 5 | **Minimalist Shirts** | `https://blackpantherstore.co.za/rss/minimalist-shirts.xml` | Select: **Minimalist Shirts** |
| 6 | **Math Shirts** | `https://blackpantherstore.co.za/rss/math-shirts.xml` | Select: **Math Shirts** |
| 7 | **Engineer Shirts** | `https://blackpantherstore.co.za/rss/engineer-shirts.xml` | Select: **Engineer Shirts** |
| 8 | **Everyday Shirts** | `https://blackpantherstore.co.za/rss/everyday-shirts.xml` | Select: **Everyday Shirts** |
| 9 | **Professions Shirts** | `https://blackpantherstore.co.za/rss/professions-shirts.xml` | Select: **Professions Shirts** |
| 10 | **Science Shirts** | `https://blackpantherstore.co.za/rss/science-shirts.xml` | Select: **Science Shirts** |
| 11 | **Social / All Collections** | `https://blackpantherstore.co.za/rss/social.xml` | Select: **Social** (or All Collections / Main Board) |

---

## 🔍 RSS Specification & Bot Compatibility

Every `<item>` in the RSS feeds conforms to standard RSS 2.0 + Media RSS:
- `<guid isPermaLink="true">https://blackpantherstore.co.za/design/{slug}</guid>` (Matches claimed domain).
- `<media:content url="..." medium="image" type="image/jpeg" />` (Standard image tag).
- `<enclosure url="..." type="image/jpeg" length="150000" />` (Valid byte-length enclosure).
- `<description><![CDATA[<img src="..." /><p>...</p>]]></description>` (Embedded image fallback).
- `<pubDate>` (RFC 822 UTC timestamp).

---

## 🛠️ CLI Commands & Testing

Inside `trust/pseo-app`:

- **Run Automated Verification Suite (340-day simulation & 0 duplicate test)**:
  ```bash
  npm run test:rss
  ```
- **Generate next day's pins**:
  ```bash
  npm run rss
  ```
- **Rebuild XML without advancing (build step)**:
  ```bash
  npm run rss:rebuild
  ```
- **Test run without writing files**:
  ```bash
  node scripts/generate-rss.mjs --dry-run
  ```
