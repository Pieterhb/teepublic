# BlackPantherStore — pSEO App

Next.js static site for [blackpantherstore.co.za](https://blackpantherstore.co.za) deployed on Cloudflare Pages.  
Generates ~7,500 SEO-optimised product and category pages from a curated products database.

---

## Architecture

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (static export) |
| Hosting | Cloudflare Pages |
| Data | `data/products.json` + `data/categories.json` |
| Pinterest automation | GitHub Actions + Pinterest API v5 |

---

## Local Development

```bash
npm install
npm run dev       # Start dev server at http://localhost:3000
```

---

## Building & Deploying

```bash
npm run build     # Generate RSS feed + build static site into /out
npm run deploy    # Build + deploy to Cloudflare Pages via wrangler
```

---

## Pinterest Auto-Pinning

Pins are published automatically by GitHub Actions — **no cron-job.com, Make.com, or local machine required**.

The workflow runs every 2 hours (UTC) and posts one pin to the board scheduled for that hour:

| UTC Hour | Board |
|----------|-------|
| 00:00 | Astronomy Shirts |
| 02:00 | Hobbies Shirts |
| 04:00 | Animals Shirts |
| 06:00 | Minimalist Engineer Shirts |
| 08:00 | Minimalist Shirts |
| 10:00 | Math Shirts |
| 12:00 | Engineer Shirts |
| 14:00 | Everyday Shirts |
| 16:00 | Professions Shirts |
| 18:00 | Science Shirts |
| 20:00 | Social |
| 22:00 | *(4-hour gap — no pin)* |

### Setup (one-time)

See **[PINTEREST_SETUP.md](./PINTEREST_SETUP.md)** for full instructions.

Requires two GitHub repository secrets:
- `PINTEREST_ACCESS_TOKEN` — Pinterest OAuth2 access token
- `PINTEREST_BOARD_IDS` — JSON map of board slugs to Pinterest board IDs

### Manual pin / testing

```bash
# Dry run (prints what would be pinned, doesn't post)
DRY_RUN=true PINTEREST_ACCESS_TOKEN=... PINTEREST_BOARD_IDS='...' node scripts/publish-pin.mjs

# Force a specific hour for testing
FORCE_HOUR=0 PINTEREST_ACCESS_TOKEN=... PINTEREST_BOARD_IDS='...' node scripts/publish-pin.mjs
```

Or trigger from the [GitHub Actions tab](https://github.com/Pieterhb/teepublic/actions) using the manual dispatch button.

---

## Project Structure

```
trust/pseo-app/
├── .github/workflows/
│   └── pinterest-pins.yml   # Runs every 2 hours
├── data/
│   ├── products.json        # 3,756 products
│   ├── categories.json      # 501 categories
│   └── internalLinks.json   # Internal link graph
├── scripts/
│   ├── publish-pin.mjs      # Pinterest pin publisher
│   └── generate-rss.mjs     # RSS feed generator
├── src/
│   ├── app/                 # Next.js pages
│   ├── components/          # React components
│   └── lib/data.ts          # Data access layer
├── PINTEREST_SETUP.md       # Pinterest API setup guide
└── README.md
```
