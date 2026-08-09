# Pinterest API Setup Guide

Follow these steps **once** to connect your Pinterest account to the auto-pinning system.

---

## Step 1: Create a Pinterest Developer App

1. Go to **[Pinterest Developers](https://developers.pinterest.com/)**
2. Log in with your Pinterest account (the one that owns your boards)
3. Click **My Apps** → **Create App**
4. Fill in the form:
   - **App name**: e.g. `BlackPantherStore Auto-Pinner`
   - **Description**: Automated Pinterest pinning for blackpantherstore.co.za
   - **Website URL**: `https://blackpantherstore.co.za`
   - **Redirect URI**: `https://blackpantherstore.co.za`
5. Click **Create** and accept the terms

Your new app will have a **Client ID** and **Client Secret**. Note them down.

---

## Step 2: Generate an Access Token

1. In your app's dashboard, go to the **"Access token"** tab
2. Click **Generate access token**
3. Select the following **scopes**:
   - `pins:write` — required to create pins
   - `boards:read` — required to read your board IDs
4. Click **Generate** and copy the token

**IMPORTANT**: This token lasts **60 days** by default. Set a calendar reminder to regenerate it before expiry!

---

## Step 3: Find Your Pinterest Board IDs

1. Go to: https://developers.pinterest.com/tools/api-explorer/
2. Select **GET /boards** > click **Try it out** > **Execute**
3. In the response, find each board. The `id` field is your board ID:

```json
{
  "items": [
    { "id": "1234567890123456789", "name": "Astronomy Shirts" },
    ...
  ]
}
```

Your 11 boards should match these slugs:

| Slug | Expected Board Name |
|------|---------------------|
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
| `social` | Your social/general board |

---

## Step 4: Build the PINTEREST_BOARD_IDS JSON

Create a JSON object mapping each slug to its board ID (replace placeholder IDs):

```json
{"astronomy-shirts":"1234567890123456789","hobbies-shirts":"9876543210987654321","animals-shirts":"1111111111111111111","minimalist-engineer-shirts":"2222222222222222222","minimalist-shirts":"3333333333333333333","math-shirts":"4444444444444444444","engineer-shirts":"5555555555555555555","everyday-shirts":"6666666666666666666","professions-shirts":"7777777777777777777","science-shirts":"8888888888888888888","social":"9999999999999999999"}
```

---

## Step 5: Add Secrets to GitHub Actions

1. Go to: **https://github.com/Pieterhb/teepublic/settings/secrets/actions**
2. Click **New repository secret** and add:

| Secret Name | Value |
|---|---|
| `PINTEREST_ACCESS_TOKEN` | Your token from Step 2 |
| `PINTEREST_BOARD_IDS` | The full JSON from Step 4 |

---

## Step 6: Push the code to GitHub

Run these commands from your terminal:

```powershell
cd c:\teepublic
git add trust/pseo-app/.github/workflows/pinterest-pins.yml
git add trust/pseo-app/scripts/publish-pin.mjs
git add trust/pseo-app/package.json
git add trust/pseo-app/PINTEREST_SETUP.md
git commit -m "feat: Pinterest auto-pinning via GitHub Actions and Pinterest API v5"
git push origin master
```

---

## Step 7: Test it (Dry Run first!)

1. Go to **https://github.com/Pieterhb/teepublic/actions**
2. Click **"Pinterest Auto-Pins"** workflow
3. Click **Run workflow**
   - Set **Dry run** to `true`
   - Leave **Force hour** empty
4. Click **Run workflow** — check the logs, you should see what pin WOULD be sent

To test posting a real pin:
- Set **Dry run**: `false`
- Set **Force hour**: `0` (tests astronomy-shirts board)

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | Token expired | Regenerate token, update GitHub secret |
| `403 Forbidden` | Missing `pins:write` scope | Regenerate token with correct scopes |
| `422 Unprocessable` | Bad board ID or image URL | Verify board IDs from API Explorer |
| `No pin scheduled for UTC hour 22` | Normal gap hour | No action needed |
| `Category not found` | Slug mismatch | Check BOARD_SCHEDULE slugs match categories.json |

---

## Renewing Your Access Token (Before Expiry)

1. Generate a new token (Step 2)
2. Update the `PINTEREST_ACCESS_TOKEN` secret in GitHub (Step 5)
3. The workflow picks it up on the next run automatically
