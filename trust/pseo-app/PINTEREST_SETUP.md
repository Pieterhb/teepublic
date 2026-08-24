# Pinterest 11-Board RSS Auto-Publishing & Setup Guide

This guide explains how to set up and maintain the **100% Free & Zero-API Native RSS Auto-Publishing System** for your 11 Pinterest boards on [za.pinterest.com/PantherMerch](https://za.pinterest.com/PantherMerch/).

---

## 🎯 How The System Works

1. **Daily Automation (05:00 UTC / 07:00 SAST)**:
   - GitHub Actions runs every morning automatically.
   - It selects **exactly 1 fresh, unpinned product** for each of your 11 boards.
   - It writes 11 RSS 2.0 XML feeds to `public/rss/{slug}.xml` and deploys them to `https://blackpantherstore.co.za/rss/{slug}.xml`.
   - It updates `data/pinned_history.json` and commits back to GitHub so no product is ever pinned twice.

2. **Strict 1-Pin-Per-Feed Duplicate Prevention**:
   - Each XML feed strictly contains **EXACTLY 1 active item for the day** (`MAX_FEED_BUFFER = 1`).
   - Because only 1 item exists in the feed at any time:
     - Pinterest can never dump a 10-pin backlog into your boards.
     - If you ever delete a pin on Pinterest, Pinterest will never re-pin it because past items are immediately cleared from the XML feed.
     - Pinterest auto-publishes exactly **1 pin per board per day**.

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

## 🔍 How Duplicate Prevention Works

1. **Permanent Global History**:
   - Every product ID selected is recorded in `data/pinned_history.json` under `pinnedIds`.
   - Once a product ID is stored in `pinnedIds`, the engine skips it forever across all boards.
2. **Single-Item Active Feed**:
   - Each XML feed contains only the current day's product.
   - When tomorrow's workflow runs, tomorrow's product replaces today's in the XML feed.
   - Old products are retired from the XML feed and saved in permanent history.
3. **Static Permanent GUIDs**:
   - Each `<item>` contains `<guid isPermaLink="false">teepublic-prod-{design_id}</guid>`.
   - Pinterest uses this GUID to verify uniqueness.

---

## 🛠️ CLI Commands & Maintenance

Inside `trust/pseo-app`:

- **Generate next day's pins**:
  ```bash
  node scripts/generate-rss.mjs --advance
  ```
- **Rebuild XML without advancing (build step)**:
  ```bash
  node scripts/generate-rss.mjs --rebuild-only
  ```
- **Reset feeds to fresh Day 1**:
  ```bash
  node scripts/generate-rss.mjs --reset
  ```
- **Test run without writing files**:
  ```bash
  node scripts/generate-rss.mjs --dry-run
  ```
