# Pinterest API Setup Guide

Complete step-by-step guide to connect the auto-pinning system to your Pinterest account.

> **Pinterest API is free** — both Trial (development) and Standard (production) tiers cost nothing.
> Standard is not a paid subscription; it's an approval/upgrade process.

---

## ⚠️ URGENT: Stop the RSS-based auto-pinning first!

Before activating the proper API-based pinning, you **must** disconnect your Pinterest boards from the RSS feeds. This is what has been creating duplicate pins without going through the API.

**How to disconnect RSS feeds from each board:**
1. Go to [pinterest.com](https://pinterest.com) and log in
2. Click on each of your 11 boards (e.g. "Astronomy Shirts")
3. Click the **pencil/edit icon** on the board
4. Look for **"RSS feed URL"** or a feed link — **delete it / clear it**
5. Save the board settings
6. Repeat for all 11 boards

Once all RSS feeds are removed, **only the GitHub Actions API-based system will create pins** — and that system has full duplicate prevention.

---

## Understanding Trial vs Standard Access

| | Trial | Standard |
|---|---|---|
| **Cost** | Free | Free |
| **Create Pins** | ✅ Yes | ✅ Yes |
| **Pins visible publicly?** | ✅ Yes (for your own account) | ✅ Yes — fully public |
| **Rate limit** | 1,000 requests/day | 100 requests/minute for pin creation |
| **Purpose** | Build & test your code | Production / real pinning |
| **Approval** | Application required | Upgrade from Trial |

Your App ID **1600990** has been approved for Trial access. You can start pinning immediately.

---

## Your App Details

- **App ID**: `1600990`
- **App Name**: BlackPantherStore Auto-Pinner (or as you named it)
- **Pinterest Account**: [za.pinterest.com/PantherMerch](https://za.pinterest.com/PantherMerch/)

---

## Step 1: Generate an Access Token (using your approved App ID 1600990)

1. Go to **[developers.pinterest.com](https://developers.pinterest.com)**
2. Log in with your Pinterest account (the one that owns the PantherMerch boards)
3. Click **My Apps** → find your app with ID `1600990`
4. Click on the app → go to the **"Access token"** tab
5. Click **Generate access token**
6. Select these **scopes** (checkboxes):
   - ✅ `pins:write` — create pins
   - ✅ `boards:read` — read your board IDs
7. Click **Generate** — **copy the token immediately** (it won't be shown again)

> **Token expiry**: Trial tokens last **60 days**. Set a calendar reminder to regenerate before expiry — GitHub will email you when a run fails with `401 Unauthorized`.

---

## Step 2: Find Your Pinterest Board IDs

You need the numeric ID for each of your 11 boards.

**Use the Pinterest API Explorer:**

1. Go to: [developers.pinterest.com/tools/api-explorer](https://developers.pinterest.com/tools/api-explorer/)
2. Authenticate with your PantherMerch account
3. Select **GET /boards** → click **Try it out** → **Execute**
4. Find your boards in the response. Copy the `id` field for each:

```json
{
  "items": [
    { "id": "1234567890123456789", "name": "Astronomy Shirts" },
    { "id": "9876543210987654321", "name": "Hobbies Shirts" }
  ]
}
```

**Your 11 boards — collect IDs for each:**

| Slug (used in code) | Expected Pinterest Board Name |
|---|---|
| `astronomy-shirts` | Astronomy Shirts |
| `hobbies-shirts` | Hobbies Shirts |
| `animals-shirts` | Animals Shirts |
| `minimalist-engineer-shirts` | Minimalist Engineer Shirts |
| `minimalist-shirts` | Minimalist Shirts |
| `math-shirts` | Math Shirts |
| `engineer-shirts` | Engineer Shirts |
| `everyday-shirts` | Everyday Shirts |
| `professions-shirts` | Professions Shirts |
| `science-shirts` | Science Shirts |
| `social` | (your social/general board) |

> **Board names don't need to match exactly** — only the IDs matter in the code.

---

## Step 3: Build the PINTEREST_BOARD_IDS JSON

Create a single-line JSON object mapping each slug → its board ID.
Replace the placeholder numbers with your real board IDs:

```json
{"astronomy-shirts":"1234567890123456789","hobbies-shirts":"9876543210987654321","animals-shirts":"1111111111111111111","minimalist-engineer-shirts":"2222222222222222222","minimalist-shirts":"3333333333333333333","math-shirts":"4444444444444444444","engineer-shirts":"5555555555555555555","everyday-shirts":"6666666666666666666","professions-shirts":"7777777777777777777","science-shirts":"8888888888888888888","social":"9999999999999999999"}
```

---

## Step 4: Add Secrets to GitHub

1. Go to: **[github.com/Pieterhb/teepublic/settings/secrets/actions](https://github.com/Pieterhb/teepublic/settings/secrets/actions)**
2. Click **New repository secret** — add these two:

| Secret Name | Value |
|---|---|
| `PINTEREST_ACCESS_TOKEN` | The token from Step 1 |
| `PINTEREST_BOARD_IDS` | The full JSON from Step 3 |

GitHub encrypts these — they are never visible after saving.

---

## Step 5: Test With a Dry Run

1. Go to **[github.com/Pieterhb/teepublic/actions](https://github.com/Pieterhb/teepublic/actions)**
2. Click **"Pinterest Auto-Pins"** workflow on the left
3. Click **Run workflow** (top right)
4. Set **Dry run** → `true` (safe — won't actually post anything)
5. Leave **Force hour** blank
6. Click **Run workflow**
7. Click the running job → watch the logs

You should see output like:
```
🎯 Targeting board: astronomy-shirts (UTC hour 0)
📅 Day index since launch: 11
📚 Loaded pinned history: 0 design(s) already pinned.
📌 Category "Astronomy Shirts": product index 11 of 585
📋 Pin details:
   Title   : Deep Space - Light Blue T-Shirt
   Board ID: 1234567890123456789
   ...
🔍 DRY RUN MODE — Pin NOT sent.
```

---

## Step 6: Send Your First Real Pin

Once dry run looks good:

1. Click **Run workflow** again
2. Set **Dry run** → `false`
3. Set **Force hour** → `0` (forces astronomy-shirts board)
4. Click **Run workflow**
5. Check your Pinterest board — the pin should appear within seconds

---

## Step 7: Apply for Standard Access (Optional — for public pins)

Your Trial access already creates real, visible pins on your own account. Standard access is mainly needed for enterprise-level rate limits.

If you want to upgrade:
1. In your Pinterest Developer dashboard → click **"Request upgrade"** or **"Apply for Standard"**
2. Fill out the short form explaining your use case:
   - "Automated pinning to promote t-shirt designs on blackpantherstore.co.za"
   - "~11 pins per day across 11 boards, scheduled every 2 hours"
3. Pinterest typically approves standard access within a few days

---

## How Duplicate Prevention Works

Every time a pin is successfully posted via the API, the `design_id` is recorded in `data/pinned_history.json`. This file is committed back to the GitHub repository after every successful pin.

**Key guarantee**: A `design_id` that appears in `pinned_history.json` will **NEVER** be pinned again — not on the same board, not on any other board. The script scans forward through the product list to find the next un-pinned product.

To inspect what has been pinned: [data/pinned_history.json](file:///c:/teepublic/trust/pseo-app/data/pinned_history.json)

---

## Keeping the System Running

### Renewing your access token (before expiry)

1. In the Pinterest Developer dashboard → app `1600990` → **Access token** tab → **Generate access token**
2. Use the same scopes (`pins:write`, `boards:read`)
3. Copy the new token
4. Update `PINTEREST_ACCESS_TOKEN` in GitHub secrets
5. The next scheduled run picks it up automatically

GitHub will email you when a run fails (e.g. `401 Unauthorized`) — this is your signal the token has expired.

### Monitoring runs

Every run is logged at: [github.com/Pieterhb/teepublic/actions](https://github.com/Pieterhb/teepublic/actions)

Each run shows a summary with the pin status, board targeted, and timestamp.

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `401 Unauthorized` | Token expired or wrong | Regenerate token, update GitHub secret |
| `403 Forbidden` | Missing `pins:write` scope | Regenerate token, select correct scopes |
| `422 Unprocessable Entity` | Bad board ID or inaccessible image URL | Verify board IDs via API Explorer |
| `No pin scheduled for UTC hour 22` | Normal — 4-hour gap | No action needed |
| `Category not found: [slug]` | Slug typo in BOARD_SCHEDULE | Check slugs match `data/categories.json` |
| `No board ID found for slug` | Missing entry in PINTEREST_BOARD_IDS | Add the missing slug to the JSON secret |
| `All products already pinned` | Entire category exhausted | Add more products or check pinned_history.json |

---

## What to Delete / Clean Up

Now that GitHub Actions handles everything:

- ✅ **Remove RSS feed URLs from all Pinterest boards** — the RSS feeds were causing duplicate pins
- ✅ **Delete your cron-job.com account** — no longer needed
- ✅ **Delete your Make.com account/scenarios** — no longer needed
- ✅ The `MAKE_WEBHOOK_URL` env var has already been removed from the codebase
