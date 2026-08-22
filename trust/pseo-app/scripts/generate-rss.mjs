/**
 * generate-rss.mjs
 *
 * Multi-Board Dynamic RSS Feed Generator with 6-Board Daily Rotation.
 *
 * Designed for Pinterest Native RSS Auto-Publishing (100% Free & Zero API Keys):
 *   1. 11 Board RSS Feeds (10 category feeds + 1 all-products "social" feed).
 *   2. Rotates 6 active boards per day (e.g. Day 1: Boards 1-6; Day 2: Boards 7-11 + Board 1; etc.).
 *   3. Exactly 6 new pins added across the entire store per day (1 per active board, 0 for inactive boards).
 *   4. 100% Duplicate Prevention:
 *      - Permanent static GUIDs: <guid isPermaLink="false">teepublic-prod-{design_id}</guid>
 *      - Global history tracking in data/pinned_history.json (persisted across git runs).
 *      - Once a product ID is pinned, it is NEVER emitted in any feed again.
 *
 * CLI Usage:
 *   node scripts/generate-rss.mjs --advance       (Daily cron: advances day & adds 6 new pins)
 *   node scripts/generate-rss.mjs --rebuild-only  (Build step: re-renders XML without advancing)
 *   node scripts/generate-rss.mjs --dry-run       (Simulate next rotation without writing files)
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
  'astronomy-shirts',          // 0
  'hobbies-shirts',            // 1
  'animals-shirts',            // 2
  'minimalist-engineer-shirts', // 3
  'minimalist-shirts',         // 4
  'math-shirts',               // 5
  'engineer-shirts',           // 6
  'everyday-shirts',           // 7
  'professions-shirts',        // 8
  'science-shirts',            // 9
  'social',                    // 10
];

const PINS_PER_DAY = 6; // Number of boards that receive 1 new pin per day

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

// ── Determine Active Boards for Today's Rotation ──────────────────────────────

const currentDay = history.dayCounter;
const startIndex = (currentDay * PINS_PER_DAY) % BOARD_SLUGS.length;

const activeBoardSlugs = [];
for (let i = 0; i < PINS_PER_DAY; i++) {
  const index = (startIndex + i) % BOARD_SLUGS.length;
  activeBoardSlugs.push(BOARD_SLUGS[index]);
}

const inactiveBoardSlugs = BOARD_SLUGS.filter(s => !activeBoardSlugs.includes(s));

console.log(`\n📅 Daily Pinterest RSS Engine — Day ${currentDay}`);
console.log(`🎯 Active Boards Today (6 new pins): ${activeBoardSlugs.map(s => `"${s}"`).join(', ')}`);
console.log(`⏸️  Inactive Boards Today (0 new pins): ${inactiveBoardSlugs.map(s => `"${s}"`).join(', ')}\n`);

// ── Initial Seeding Check (First Ever Run) ─────────────────────────────────────

const isFirstRun = history.totalPinned === 0 && Object.values(history.boardFeeds).every(arr => arr.length === 0);

if (isFirstRun && !IS_REBUILD_ONLY) {
  console.log('🌱 Initializing brand-new RSS feeds for all 11 boards (seeding 1 initial pin per board)...');
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
  // Advance daily rotation: Add exactly 1 new product to each of the 6 active boards
  console.log('⚡ Advancing daily rotation — selecting 1 fresh unpinned product for each active board:');

  activeBoardSlugs.forEach(slug => {
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

  // Increment day counter for the next run
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
    const isNewToday = activeBoardSlugs.includes(slug) ? '🟢 +1 new pin' : '⚪ 0 new pins';
    console.log(`   ✅ ${slug}.xml (${items.length} items in feed) [${isNewToday}]`);
  });

  console.log(`\n✨ Done! Total unique products recorded in history: ${history.totalPinned}\n`);
} else {
  console.log('\n🔍 DRY RUN: No files written.\n');
}
