/**
 * generate-rss.mjs
 *
 * Multi-Board RSS 2.0 Feed Generator for Pinterest Auto-Publishing.
 *
 * Requirements:
 *   1. Generates 1 fresh product pin for ALL 11 Pinterest boards every single day.
 *   2. Full RSS 2.0 + Yahoo Media RSS compliance (<title>, <link>, <description>, <guid>, <pubDate>, <media:content>, <enclosure>).
 *   3. 100% Duplicate Prevention:
 *      - Permanent static GUIDs: <guid isPermaLink="false">teepublic-prod-{design_id}</guid>
 *      - Global history tracking in data/pinned_history.json (persisted across git runs).
 *      - Once a product ID is pinned, it is never emitted as a new pin again.
 *   4. Outputs all 11 feeds to public/rss/{slug}.xml (deployed to https://blackpantherstore.co.za/rss/{slug}.xml).
 *
 * CLI Usage:
 *   node scripts/generate-rss.mjs --advance       (Daily cron: advances day & adds 1 new pin to all 11 boards)
 *   node scripts/generate-rss.mjs --rebuild-only  (Build step: re-renders existing XML without adding new pins)
 *   node scripts/generate-rss.mjs --dry-run       (Simulate run without writing files)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR   = path.join(__dirname, '..', 'data');
const PUBLIC_RSS = path.join(__dirname, '..', 'public', 'rss');

// ── Configuration ─────────────────────────────────────────────────────────────

const SITE_URL = 'https://blackpantherstore.co.za';
const MAX_FEED_BUFFER = 10; // Keep up to 10 recent items per feed for RSS health

const BOARD_SLUGS = [
  'astronomy-shirts',          // 1. Astronomy Shirts
  'hobbies-shirts',            // 2. Hobbies Shirts
  'animals-shirts',            // 3. Animals Shirts
  'minimalist-engineer-shirts', // 4. Minimalist Engineer Shirts
  'minimalist-shirts',         // 5. Minimalist Shirts
  'math-shirts',               // 6. Math Shirts
  'engineer-shirts',           // 7. Engineer Shirts
  'everyday-shirts',           // 8. Everyday Shirts
  'professions-shirts',        // 9. Professions Shirts
  'science-shirts',            // 10. Science Shirts
  'social',                    // 11. Social / All Collections
];

// ── Parse CLI Flags ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const IS_ADVANCE      = args.includes('--advance') || (!args.includes('--rebuild-only') && !args.includes('--dry-run'));
const IS_REBUILD_ONLY = args.includes('--rebuild-only');
const IS_DRY_RUN      = args.includes('--dry-run');

// ── Load Catalog Data ─────────────────────────────────────────────────────────

const productsPath   = path.join(DATA_DIR, 'products.json');
const categoriesPath = path.join(DATA_DIR, 'categories.json');
const historyPath    = path.join(DATA_DIR, 'pinned_history.json');

const products   = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

// ── Load / Initialize History ─────────────────────────────────────────────────

let history = {
  lastUpdated: new Date().toISOString(),
  dayCounter: 0,
  totalPinned: 0,
  pinnedIds: [],
  boardFeeds: {},
};

if (fs.existsSync(historyPath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    if (Array.isArray(raw)) {
      history.pinnedIds = raw.map(String);
      history.totalPinned = raw.length;
    } else {
      history.dayCounter  = typeof raw.dayCounter === 'number' ? raw.dayCounter : 0;
      history.pinnedIds   = Array.isArray(raw.pinnedIds) ? raw.pinnedIds.map(String) : [];
      history.totalPinned = history.pinnedIds.length;
      history.boardFeeds  = (raw.boardFeeds && typeof raw.boardFeeds === 'object') ? raw.boardFeeds : {};
    }
  } catch (e) {
    console.warn(`⚠️ Could not parse pinned_history.json (${e.message}). Initializing fresh.`);
  }
}

// Ensure every board has an array in boardFeeds
BOARD_SLUGS.forEach(slug => {
  if (!Array.isArray(history.boardFeeds[slug])) {
    history.boardFeeds[slug] = [];
  }
});

const pinnedSet = new Set(history.pinnedIds);

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

function ensureHttps(url) {
  if (!url) return '';
  return url.startsWith('http://') ? url.replace('http://', 'https://') : url;
}

function buildHashtags(product) {
  const tags = new Set(['teepublic', 'apparel', 'merch']);
  if (product.niche) tags.add(product.niche.replace(/[^a-zA-Z0-9]/g, '').toLowerCase());
  if (product.secondary_niche) tags.add(product.secondary_niche.replace(/[^a-zA-Z0-9]/g, '').toLowerCase());
  if (product.primary_keyword) {
    const clean = product.primary_keyword.replace(/[^a-zA-Z0-9]/g, '');
    if (clean) tags.add(clean);
  }
  return [...tags].slice(0, 4).map(t => `#${t}`).join(' ');
}

function getCategoryTitle(slug) {
  if (slug === 'social') return 'All Collections';
  const cat = categories.find(c => c.slug === slug);
  return cat ? cat.title : slug;
}

function getCandidatesForSlug(slug) {
  if (slug === 'social') return [...products];
  const cat = categories.find(c => c.slug === slug);
  if (!cat || !Array.isArray(cat.productIds)) return [...products];
  return cat.productIds
    .map(id => products.find(p => String(p.design_id) === String(id)))
    .filter(Boolean);
}

// ── Processing: 1 New Pin for ALL 11 Boards Daily ─────────────────────────────

console.log(`\n📅 Daily Pinterest RSS Engine — Day ${history.dayCounter}`);
console.log(`🎯 Processing ALL ${BOARD_SLUGS.length} Pinterest Boards (1 fresh product pin per board daily)\n`);

const isFirstRun = history.totalPinned === 0 && Object.values(history.boardFeeds).every(arr => arr.length === 0);

if (isFirstRun && !IS_REBUILD_ONLY) {
  console.log('🌱 Initializing brand-new RSS feeds (seeding 1 initial product per board)...');
  BOARD_SLUGS.forEach(slug => {
    const candidates = getCandidatesForSlug(slug).filter(p => !pinnedSet.has(String(p.design_id)));
    if (candidates.length > 0) {
      const selected = candidates[0];
      pinnedSet.add(String(selected.design_id));
      history.boardFeeds[slug].push({
        design_id: String(selected.design_id),
        slug: selected.slug,
        title: selected.title,
        seo_title: selected.seo_title,
        description: selected.meta_description || selected.description,
        image_url: selected.image_url,
        image_alt: selected.image_alt,
        niche: selected.niche,
        secondary_niche: selected.secondary_niche,
        primary_keyword: selected.primary_keyword,
        tags: selected.tags,
        pubDate: new Date().toUTCString(),
      });
      console.log(`   ✅ Seeded [${slug}]: "${selected.title}" (ID: ${selected.design_id})`);
    }
  });
} else if (IS_ADVANCE && !IS_REBUILD_ONLY) {
  console.log('⚡ Adding 1 fresh unpinned product to ALL 11 board feeds:');

  BOARD_SLUGS.forEach(slug => {
    const candidates = getCandidatesForSlug(slug).filter(p => !pinnedSet.has(String(p.design_id)));

    if (candidates.length > 0) {
      const selected = candidates[0];
      pinnedSet.add(String(selected.design_id));

      // Prepend newest item to the top of the board's feed buffer
      history.boardFeeds[slug].unshift({
        design_id: String(selected.design_id),
        slug: selected.slug,
        title: selected.title,
        seo_title: selected.seo_title,
        description: selected.meta_description || selected.description,
        image_url: selected.image_url,
        image_alt: selected.image_alt,
        niche: selected.niche,
        secondary_niche: selected.secondary_niche,
        primary_keyword: selected.primary_keyword,
        tags: selected.tags,
        pubDate: new Date().toUTCString(),
      });

      // Trim feed buffer to max 10 items
      if (history.boardFeeds[slug].length > MAX_FEED_BUFFER) {
        history.boardFeeds[slug] = history.boardFeeds[slug].slice(0, MAX_FEED_BUFFER);
      }

      console.log(`   ➕ [${slug}] Added: "${selected.title}" (ID: ${selected.design_id})`);
    } else {
      console.warn(`   ⚠️ [${slug}] All candidate products in this category have already been pinned.`);
    }
  });

  // Increment day counter
  history.dayCounter += 1;
}

// Update history totals
history.pinnedIds   = Array.from(pinnedSet);
history.totalPinned = pinnedSet.size;
history.lastUpdated = new Date().toISOString();

// ── Generate RSS 2.0 XML Feeds ────────────────────────────────────────────────

function buildRssXml(slug, title, items) {
  const now = new Date().toUTCString();
  const feedUrl = `${SITE_URL}/rss/${slug}.xml`;

  const itemsXml = items.map(item => {
    const productLink = `${SITE_URL}/design/${item.slug}`;
    const imageUrl    = ensureHttps(item.image_url);
    const hashtags    = buildHashtags(item);
    const descContent = item.description || item.title;
    const fullDesc    = `${descContent} ${hashtags}`.trim();
    const itemTitle   = item.seo_title || item.title;

    return `
    <item>
      <guid isPermaLink="false">teepublic-prod-${escapeXml(String(item.design_id))}</guid>
      <title><![CDATA[${itemTitle}]]></title>
      <link>${escapeXml(productLink)}</link>
      <description><![CDATA[${fullDesc}]]></description>
      <pubDate>${item.pubDate || now}</pubDate>
      <media:content url="${escapeXml(imageUrl)}" medium="image" type="image/jpeg" />
      <enclosure url="${escapeXml(imageUrl)}" type="image/jpeg" length="0" />
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`Black Panther Store — ${title}`)}</title>
    <link>${SITE_URL}/</link>
    <description>${escapeXml(`TeePublic products for ${title}`)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    ${itemsXml}
  </channel>
</rss>`;
}

if (!IS_DRY_RUN) {
  // Ensure output directory exists
  fs.mkdirSync(PUBLIC_RSS, { recursive: true });

  // Save history state
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8');

  // Write all 11 RSS files
  console.log(`\n📝 Writing 11 RSS feeds to public/rss/:`);
  BOARD_SLUGS.forEach(slug => {
    const title = getCategoryTitle(slug);
    const items = history.boardFeeds[slug] || [];
    const xml = buildRssXml(slug, title, items);
    const filePath = path.join(PUBLIC_RSS, `${slug}.xml`);
    fs.writeFileSync(filePath, xml, 'utf8');
    console.log(`   ✅ ${slug}.xml (${items.length} items in feed) [🟢 +1 new pin daily]`);
  });

  console.log(`\n✨ Done! Total unique products recorded in history: ${history.totalPinned}\n`);

  // ── Print Clean Summary Table ───────────────────────────────────────────────
  console.log('┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐');
  console.log('│                                  11 PINTEREST RSS FEEDS (1 PIN/BOARD/DAY)                               │');
  console.log('├────┬─────────────────────────────┬───────────────────────────────────────────────────────────────────────┤');
  console.log('│ #  │ Board Name                  │ Public RSS Feed URL                                                   │');
  console.log('├────┼─────────────────────────────┼───────────────────────────────────────────────────────────────────────┤');
  BOARD_SLUGS.forEach((slug, idx) => {
    const num = String(idx + 1).padEnd(2);
    const title = getCategoryTitle(slug).padEnd(27);
    const url = `${SITE_URL}/rss/${slug}.xml`.padEnd(69);
    console.log(`│ ${num} │ ${title} │ ${url} │`);
  });
  console.log('└────┴─────────────────────────────┴───────────────────────────────────────────────────────────────────────┘\n');
} else {
  console.log('\n🔍 DRY RUN: No files written.\n');
}
