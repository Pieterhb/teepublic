/**
 * generate-rss.mjs
 *
 * Generates static RSS 2.0 XML feeds (one per Pinterest board category + one
 * all-products "social" feed) and writes them to public/rss/{slug}.xml.
 *
 * These static files are served by Cloudflare Pages at:
 *   https://blackpantherstore.co.za/rss/{slug}.xml
 *
 * Publer ingests each feed URL and auto-schedules up to 10 pins per day to
 * the matching Pinterest board — no Pinterest API key required on our end.
 *
 * Feed spec:
 *   - RSS 2.0 + Yahoo Media RSS namespace (xmlns:media)
 *   - Rolling buffer of 20 items per feed (most-recently-scraped products first)
 *   - GUID = "teepublic-prod-{design_id}" — static, one pin per product, forever
 *   - <link> points to blackpantherstore.co.za/design/{slug} (your site first)
 *   - <media:content> + <enclosure> for image (required by Publer/Pinterest)
 *   - Description includes meta_description + hashtags from niche/tags
 *   - pubDate derived from scrape_timestamp (RFC 2822)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR   = path.join(__dirname, '..', 'data');
const PUBLIC_RSS = path.join(__dirname, '..', 'public', 'rss');

// ── Load data ─────────────────────────────────────────────────────────────────

const products   = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'products.json'),   'utf8'));
const categories = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'categories.json'), 'utf8'));

const SITE_URL = 'https://blackpantherstore.co.za';

// ── Board/Category configuration ─────────────────────────────────────────────
// These 11 slugs map 1-to-1 with your Pinterest boards.
// The "social" feed is the all-products fallback (no specific board).

const BOARD_SLUGS = [
  'astronomy-shirts',
  'hobbies-shirts',
  'animals-shirts',
  'minimalist-engineer-shirts',
  'minimalist-shirts',
  'math-shirts',
  'engineer-shirts',
  'everyday-shirts',
  'professions-shirts',
  'science-shirts',
];

const FEED_SIZE = 20; // rolling buffer: how many items to include per feed

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert an ISO timestamp string (or Date) to RFC 2822 format required by RSS.
 * Falls back to a deterministic offset from a base date using itemIndex so every
 * product always has a unique, stable pubDate.
 */
function toRfc2822(timestamp, itemIndex = 0) {
  if (timestamp) {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) return d.toUTCString();
  }
  // Fallback: stagger dates starting from launch day, 1 day apart per product
  const base = new Date('2026-08-01T08:00:00Z');
  base.setDate(base.getDate() + itemIndex);
  return base.toUTCString();
}

/**
 * Build 3–5 relevant hashtags from a product's niche and tags fields.
 */
function buildHashtags(product) {
  const tagPool = new Set(['teepublic', 'apparel', 'merch']);

  if (product.niche)           tagPool.add(product.niche.replace(/\s+/g, '').toLowerCase());
  if (product.secondary_niche) tagPool.add(product.secondary_niche.replace(/\s+/g, '').toLowerCase());
  if (product.primary_keyword) {
    // Convert "Bigfoot Fourier Transform" → #BigfootFourierTransform
    tagPool.add(product.primary_keyword.replace(/\s+/g, ''));
  }

  // Pull first 2 words from tags string
  if (product.tags) {
    product.tags.split(',').slice(0, 2).forEach(t => {
      const clean = t.trim().replace(/\s+/g, '');
      if (clean.length > 1 && clean.length < 25) tagPool.add(clean);
    });
  }

  return [...tagPool].slice(0, 5).map(h => `#${h}`).join(' ');
}

/**
 * Escape XML special characters outside of CDATA sections.
 */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

/**
 * Ensure an image URL is absolute HTTPS. TeePublic URLs are already absolute.
 */
function ensureHttps(url) {
  if (!url) return '';
  if (url.startsWith('http://')) return url.replace('http://', 'https://');
  return url;
}

// ── RSS XML builder ───────────────────────────────────────────────────────────

function buildRssXml({ slug, title, description, feedUrl, items }) {
  const now = new Date().toUTCString();

  const itemsXml = items.map(({ product, pubDate }) => {
    const productLink  = `${SITE_URL}/design/${product.slug}`;
    const imageUrl     = ensureHttps(product.image_url);
    const hashtags     = buildHashtags(product);
    const descContent  = product.meta_description || product.description || product.title;
    const fullDesc     = `${descContent} ${hashtags}`;

    return `
    <item>
      <guid isPermaLink="false">teepublic-prod-${escapeXml(String(product.design_id))}</guid>
      <title><![CDATA[${product.title}]]></title>
      <link>${escapeXml(productLink)}</link>
      <description><![CDATA[${fullDesc}]]></description>
      <pubDate>${pubDate}</pubDate>
      <media:content url="${escapeXml(imageUrl)}" medium="image" type="image/jpeg" />
      <enclosure url="${escapeXml(imageUrl)}" type="image/jpeg" length="0" />
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${SITE_URL}/</link>
    <description>${escapeXml(description)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    ${itemsXml}
  </channel>
</rss>`;
}

// ── Feed generation ───────────────────────────────────────────────────────────

/**
 * Pick the most-recently-scraped FEED_SIZE products from a list.
 * Products are sorted by scrape_timestamp descending (newest first).
 * GUID is static (design_id only) so Publer never re-pins the same product.
 */
function buildFeedItems(productList) {
  const sorted = [...productList].sort((a, b) => {
    const da = a.scrape_timestamp ? new Date(a.scrape_timestamp) : new Date(0);
    const db = b.scrape_timestamp ? new Date(b.scrape_timestamp) : new Date(0);
    return db - da; // newest first
  });

  return sorted.slice(0, FEED_SIZE).map((product, i) => ({
    product,
    pubDate: toRfc2822(product.scrape_timestamp, i),
  }));
}

// Ensure output directory exists
fs.mkdirSync(PUBLIC_RSS, { recursive: true });

console.log(`\n🗞  Generating RSS feeds → public/rss/  (${FEED_SIZE} items per feed)\n`);

// ── Per-board category feeds ──────────────────────────────────────────────────

let generated = 0;

for (const slug of BOARD_SLUGS) {
  const category = categories.find(c => c.slug === slug);
  if (!category) {
    console.warn(`  ⚠  Category not found in categories.json: "${slug}" — skipping`);
    continue;
  }

  const categoryProducts = category.productIds
    .map(id => products.find(p => String(p.design_id) === String(id)))
    .filter(Boolean);

  if (categoryProducts.length === 0) {
    console.warn(`  ⚠  No products for category: "${slug}" — skipping`);
    continue;
  }

  const items   = buildFeedItems(categoryProducts);
  const feedUrl = `${SITE_URL}/rss/${slug}.xml`;
  const xml     = buildRssXml({
    slug,
    title:       `Black Panther Store — ${category.title}`,
    description: `TeePublic products for ${category.title}`,
    feedUrl,
    items,
  });

  fs.writeFileSync(path.join(PUBLIC_RSS, `${slug}.xml`), xml, 'utf8');
  console.log(`  ✅  ${slug}.xml  (${items.length} items)`);
  generated++;
}

// ── All-products social / fallback feed ──────────────────────────────────────

const socialItems = buildFeedItems(products);
const socialXml   = buildRssXml({
  slug:        'social',
  title:       'Black Panther Store — All Products',
  description: 'All TeePublic products from Black Panther Store',
  feedUrl:     `${SITE_URL}/rss/social.xml`,
  items:       socialItems,
});

fs.writeFileSync(path.join(PUBLIC_RSS, 'social.xml'), socialXml, 'utf8');
console.log(`  ✅  social.xml  (${socialItems.length} items)`);
generated++;

console.log(`\n✔  Done — generated ${generated} RSS feeds\n`);
