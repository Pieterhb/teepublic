# Pinterest 11-Board RSS Auto-Publishing & Setup Guide

This guide explains how to set up and maintain the **100% Free & Zero-API Native RSS Auto-Publishing System** for your 11 Pinterest boards on [za.pinterest.com/PantherMerch](https://za.pinterest.com/PantherMerch/).

---

## 🎯 How The System Works

1. **Daily Automation (03:17, 09:17, 15:17, 21:17 UTC — 4× redundant)**:
   - GitHub Actions runs 4 times daily (idempotent — only advances once per calendar day).
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

3. **Pinterest-Optimized Feed Engine (Rolling 7-Item Buffer)**:
   - Feeds maintain a rolling window of the **7 most recent pins** in chronological order.
   - **Why 7 items?** Pinterest's scraper visits on a 24–72 hour crawl window. A 7-item buffer ensures Pinterest's crawler never misses a daily pin if a crawl is delayed.
   - **Why no duplicates?** Pinterest tracks the unique opaque `<guid>` of every pin it creates. When Pinterest crawls the feed, it skips the 6 previously pinned items and publishes **only the 1 new daily pin**.
   - **Staggered pubDates**: Each board's new pin is published 1 minute apart (board 1 at 08:11, board 2 at 08:12, etc.) to look like organic publishing rather than a simultaneous batch upload.

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
- `<guid isPermaLink="false">pin-{boardSlug}-{designId}</guid>` — **Opaque non-URL GUID** (correct RSS 2.0 pattern). URL-fragment GUIDs caused Pinterest's deduplication to misfire.
- `<media:content url="..." medium="image" type="image/jpeg" />` (Standard image tag).
- `<enclosure url="..." type="image/jpeg" length="0" />` — `length="0"` means "unknown" per RSS 2.0 spec; avoids false size mismatch errors.
- `<description><![CDATA[<img src="..." /><p>...</p>]]></description>` (Embedded image fallback).
- `<pubDate>` (RFC 822 UTC timestamp, staggered 1 minute per board).
- `<image>` channel element for feed identity and Pinterest claiming.
- `<lastBuildDate>` is derived from the newest item's pubDate (stable — doesn't change on rebuilds).

---

## 🛠️ CLI Commands & Testing

Inside `trust/pseo-app`:

- **Run Automated Verification Suite (340-day simulation, 7 validation tests)**:
  ```bash
  npm run test:rss
  ```
- **Generate next day's pins (daily use)**:
  ```bash
  npm run rss
  ```
- **Rebuild XML without advancing (build step only)**:
  ```bash
  npm run rss:rebuild
  ```
- **Live feed diagnostic — checks all 11 boards vs live Cloudflare site**:
  ```bash
  node scripts/check-status.mjs
  ```
- **Dry run (audit without writing any files)**:
  ```bash
  node scripts/generate-rss.mjs --dry-run
  ```

---

## 🚨 Troubleshooting

### Pinterest says "RSS feed does not work"
This is most commonly caused by one of these issues (all now fixed):

| # | Issue | Status |
|---|-------|--------|
| 1 | GUID was a URL-fragment (`design/slug#pin-board-id`) — caused deduplication misfires | ✅ Fixed: opaque `pin-{board}-{id}` |
| 2 | `enclosure length="150000"` was fabricated — flagged as untrustworthy | ✅ Fixed: `length="0"` (unknown) |
| 3 | `<lastBuildDate>` changed on every deploy — Pinterest thought feed was entirely new | ✅ Fixed: derived from newest item |
| 4 | Missing `<image>` channel element — Pinterest couldn't claim the feed | ✅ Fixed: added |
| 5 | All 11 boards pinned simultaneously — looked like spam batch | ✅ Fixed: staggered 1 min apart |
| 6 | Cloudflare 1-hour cache — Pinterest bot saw stale feed after deploy | ✅ Fixed: 5-minute cache |

### All boards show "STALE" in check-status.mjs
Usually means your local machine hasn't pulled the latest from GitHub. Run:
```bash
git pull origin master
node scripts/check-status.mjs
```

### A board ran out of products
The system falls back through 3 tiers. If Tier 3 (global catalog) is exhausted (~340 days), re-import the product catalog.

---

## ⚠️ Important Notes

> [!WARNING]
> **Always run `git pull origin master` before running `PIN_DAILY_PINS.bat` manually.** GitHub Actions commits back to the repo every day. If you run the BAT file on a stale local copy, you'll create a divergent history that can cause merge conflicts.

> [!NOTE]
> Pinterest's crawler visits every 24–72 hours. New pins may take up to 3 days to appear on your board after the feed is updated. This is normal — the 7-item buffer ensures no pin is ever missed.
