# Project Guidelines: Black Panther Store (blackpantherstore.co.za)

## Git & Deployment Protocol
- **Production Deployment**: Cloudflare Pages builds and deploys from the `main` branch.
- **GitHub Backup Rule**: Whenever committing or backing up changes to GitHub, ALWAYS push to BOTH `main` and `master`:
  ```bash
  git checkout -B main
  git push origin main
  git checkout master
  git push origin master
  ```
- **Live URL**: https://blackpantherstore.co.za

## App Architecture
- The Next.js static export web app lives under `trust/pseo-app/`.
- Run `npm run build` inside `trust/pseo-app` to compile and export static pages to `out/`.
- Pinterest automatic pinning is controlled by `.github/workflows/pinterest-pins.yml` and `trust/pseo-app/scripts/publish-pin.mjs`.
