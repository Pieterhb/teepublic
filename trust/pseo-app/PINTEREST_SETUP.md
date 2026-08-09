# Pinterest API Setup Guide

Complete step-by-step guide to connect the auto-pinning system to your Pinterest account.

> **Pinterest API is free** — both Trial (development) and Standard (production) tiers cost nothing.
> Standard is not a paid subscription; it's an approval/upgrade process.

---

## Understanding Trial vs Standard Access

| | Trial | Standard |
|---|---|---|
| **Cost** | Free | Free |
| **Create Pins** | ✅ Yes | ✅ Yes |
| **Pins visible publicly?** | ❌ No — sandbox only | ✅ Yes — fully public |
| **Rate limit** | 1,000 requests/day | 100 requests/minute for pin creation |
| **Purpose** | Build & test your code | Production / real pinning |
| **Approval** | Immediate | Application required |

**The plan:**
1. Start with **Trial** → build and test everything (pins won't be public yet)
2. Once it works → apply to upgrade to **Standard** → pins go live publicly

Your automated system creates ~11 pins/day — Standard's 100/minute limit is more than sufficient.

---

## Step 1: Create a Pinterest Developer App

1. Go to **[developers.pinterest.com](https://developers.pinterest.com)**
2. Log in with the Pinterest account that **owns your boards**
3. Click **My Apps** → **Create App**
4. Fill in:
   - **App name**: `BlackPantherStore Auto-Pinner`
   - **Description**: Automated Pinterest pinning for blackpantherstore.co.za
   - **Website URL**: `https://blackpantherstore.co.za`
   - **Redirect URI**: `https://blackpantherstore.co.za`
5. Click **Create** and accept the terms

You'll start on **Trial** access automatically.

---

## Step 2: Generate an Access Token

1. In your app's dashboard → go to the **"Access token"** tab
2. Click **Generate access token**
3. Select these **scopes** (checkboxes):
   - ✅ `pins:write` — create pins
   - ✅ `boards:read` — read your board IDs
4. Click **Generate** — copy the token immediately

> **Token expiry**: Trial tokens last **60 days**. Standard tokens can last up to **365 days**. Set a calendar reminder to regenerate before expiry or GitHub Actions will start logging `401 Unauthorized`.

---

## Step 3: Find Your Pinterest Board IDs

You need the numeric ID for each of your 11 boards.

**Use the Pinterest API Explorer:**

1. Go to: [developers.pinterest.com/tools/api-explorer](https://developers.pinterest.com/tools/api-explorer/)
2. Authenticate with your account
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

## Step 4: Build the PINTEREST_BOARD_IDS JSON

Create a single-line JSON object mapping each slug → its board ID.  
Replace the placeholder numbers with your real board IDs:

```json
{"astronomy-shirts":"1234567890123456789","hobbies-shirts":"9876543210987654321","animals-shirts":"1111111111111111111","minimalist-engineer-shirts":"2222222222222222222","minimalist-shirts":"3333333333333333333","math-shirts":"4444444444444444444","engineer-shirts":"5555555555555555555","everyday-shirts":"6666666666666666666","professions-shirts":"7777777777777777777","science-shirts":"8888888888888888888","social":"9999999999999999999"}
```

---

## Step 5: Add Secrets to GitHub

1. Go to: **[github.com/Pieterhb/teepublic/settings/secrets/actions](https://github.com/Pieterhb/teepublic/settings/secrets/actions)**
2. Click **New repository secret** — add these two:

| Secret Name | Value |
|---|---|
| `PINTEREST_ACCESS_TOKEN` | The token from Step 2 |
| `PINTEREST_BOARD_IDS` | The full JSON from Step 4 |

GitHub encrypts these — they are never visible after saving.

---

## Step 6: Test With a Dry Run

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
📅 Day index since launch: 5
📌 Category "Astronomy Shirts": product index 5 of 585
📋 Pin details:
   Title   : Deep Space - Light Blue T-Shirt
   Board ID: 1234567890123456789
   ...
🔍 DRY RUN MODE — Pin NOT sent.
```

---

## Step 7: Send Your First Real Pin

Once dry run looks good:

1. Click **Run workflow** again
2. Set **Dry run** → `false`
3. Set **Force hour** → `0` (forces astronomy-shirts board)
4. Click **Run workflow**
5. Check your Pinterest board — the pin should appear within seconds

> **Trial note**: During Trial access, the pin will only be visible to you (sandbox). This is expected. Once you upgrade to Standard, all pins become public.

---

## Step 8: Apply for Standard Access

Once your automation is tested and working:

1. In your Pinterest Developer dashboard → click **"Request upgrade"** or **"Apply for Standard"**
2. Fill out the short form explaining your use case:
   - "Automated pinning to promote t-shirt designs on blackpantherstore.co.za"
   - "~11 pins per day across 11 boards, scheduled every 2 hours"
3. Pinterest typically approves standard access within a few days
4. Once approved, all future pins (and backdated ones) become public

---

## Keeping the System Running

### Renewing your access token (before expiry)

1. In the Pinterest Developer dashboard → **Access token** tab → **Generate access token**
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

---

## What to Delete

Now that GitHub Actions handles everything:

- ✅ **Delete your cron-job.com account** — no longer needed
- ✅ **Delete your Make.com account/scenarios** — no longer needed
- ✅ The `MAKE_WEBHOOK_URL` env var has already been removed from the codebase
