# Project Guidelines: Black Panther Store (blackpantherstore.co.za)

## Git & Deployment Protocol
- **Cloudflare Pages Project Name**: `pseo-app`
- **Cloudflare Production Branch**: `master`
- **Instant Production Deployment Command** (from this folder):
  ```bash
  npm run build
  npx wrangler pages deploy out --project-name=pseo-app --branch=master
  ```
- **GitHub Backup Rule**: Whenever committing or backing up changes to GitHub, ALWAYS push to BOTH `main` and `master`:
  ```bash
  git checkout -B main
  git push origin main
  git checkout master
  git push origin master
  ```
- **Live Domain**: https://blackpantherstore.co.za

## App Architecture
- Run `npm run build` to compile and export static pages to `out/`.
- Pinterest automatic pinning is controlled by `.github/workflows/pinterest-pins.yml` and `scripts/publish-pin.mjs`.
