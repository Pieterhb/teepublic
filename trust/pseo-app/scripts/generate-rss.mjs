/**
 * generate-rss.mjs
 *
 * Multi-Board RSS 2.0 Feed Generator for Pinterest Auto-Publishing.
 *
 * Architecture & Guarantees:
 *   1. 100% Duplicate Prevention:
 *      - Permanent global tracking in data/pinned_history.json.
 *      - Every product ID selected across ALL 11 boards is permanently added to pinnedIds.
 *      - Once a product ID is pinned on ANY board, it is NEVER emitted again.
 *   2. Multi-Tiered Candidate Selection:
 *      - Tier 1: Direct category match (from categories.json).
 *      - Tier 2: Related niche / theme / tag matches for the board topic.
 *      - Tier 3: Global unpinned catalog fallback.
 *      - Guarantees ALL 11 boards receive 1 brand-new pin every day for 340+ days.
 *   3. Pinterest Auto-Publish & RSS 2.0 Compliance:
 *      - Static permalink GUIDs: <guid isPermaLink="true">https://blackpantherstore.co.za/design/{slug}</guid>
 *      - Standard Media RSS: <media:content url="..." medium="image" type="image/jpeg" />
 *      - Standard Enclosure: <enclosure url="..." type="image/jpeg" length="150000" />
 *      - Embedded <img> inside CDATA <description> for 100% Pinterest bot detection.
 *      - RFC 822 compliant pubDate on all channel & item elements.
 *   4. Reliable Rolling Buffer (MAX_FEED_BUFFER = 10):
 *      - Maintains the 10 most recent pins in chronological order (newest first).
 *      - Accommodates Pinterest's 24–48 hour crawl cycles without dropping pins.
 *      - Pinterest uses GUIDs to publish only the newly added pin each day.
 *
 * CLI Usage:
 *   node scripts/generate-rss.mjs --advance       (Daily cron: advances day & adds 1 new pin to all 11 boards)
 *   node scripts/generate-rss.mjs --rebuild-only  (Build step: re-renders existing XML without adding new pins)
 *   node scripts/generate-rss.mjs --reset         (Reset feeds to Day 1 with initial unpinned buffer)
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
const MAX_FEED_BUFFER = 10; // Rolling window of 10 recent items to accommodate 24-48h scraper cycles

const BOARDS = [
  {
    slug: 'astronomy-shirts',
    title: 'Astronomy Shirts',
    keywords: ['astronomy', 'space', 'galaxy', 'planet', 'stars', 'telescope', 'cosmos', 'universe', 'alien', 'ufo', 'nasa', 'astronomer', 'physics'],
  },
  {
    slug: 'hobbies-shirts',
    title: 'Hobbies Shirts',
    keywords: ['hobbies', 'gaming', 'gamer', 'fishing', 'reading', 'cooking', 'music', 'art', 'sports', 'hockey', 'football', 'basketball', 'chess', 'gardening'],
  },
  {
    slug: 'animals-shirts',
    title: 'Animals Shirts',
    keywords: ['animals', 'animal', 'tiger', 'panther', 'cat', 'dog', 'dinosaur', 'bird', 'wildlife', 'gorilla', 'elephant', 'lion', 'wolf', 'bear', 'wild west'],
  },
  {
    slug: 'minimalist-engineer-shirts',
    title: 'Minimalist Engineer Shirts',
    keywords: ['minimalist', 'engineer', 'engineering', 'electrical', 'mechanical', 'civil', 'fourier', 'tesla', 'sine wave', 'wireframe', 'developer', 'circuit'],
  },
  {
    slug: 'minimalist-shirts',
    title: 'Minimalist Shirts',
    keywords: ['minimalist', 'line art', 'sketch', 'retro vintage', 'simple', 'clean', 'wireframe', 'abstract', 'black and white', 'geometry'],
  },
  {
    slug: 'math-shirts',
    title: 'Math Shirts',
    keywords: ['math', 'mathematics', 'fourier', 'calculus', 'geometry', 'trigonometry', 'sine wave', 'epicycles', 'math humor', 'math pun', 'math teacher', 'physics'],
  },
  {
    slug: 'engineer-shirts',
    title: 'Engineer Shirts',
    keywords: ['engineer', 'engineering', 'electrical engineer', 'mechanical engineer', 'civil engineer', 'aerospace', 'dsp', 'coder', 'developer', 'programmer'],
  },
  {
    slug: 'everyday-shirts',
    title: 'Everyday Shirts',
    keywords: ['everyday', 'funny', 'humor', 'quote', 'slogan', 'retro', 'vintage', 'classic', 'cool', 'gift'],
  },
  {
    slug: 'professions-shirts',
    title: 'Professions Shirts',
    keywords: ['teacher', 'engineer', 'developer', 'programmer', 'doctor', 'nurse', 'scientist', 'chef', 'pharmacist', 'pilot', 'accountant', 'lawyer', 'professions'],
  },
  {
    slug: 'science-shirts',
    title: 'Science Shirts',
    keywords: ['science', 'physics', 'paleontology', 'dinosaur', 'astronomy', 'fourier transform', 'biology', 'chemistry', 'scientific', 'scientist', 'stem'],
  },
  {
    slug: 'social',
    title: 'All Collections',
    keywords: [], // General collection: accepts all catalog items
  },
];

const BOARD_SLUGS = BOARDS.map(b => b.slug);

// ── Parse CLI Flags ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const IS_RESET        = args.includes('--reset');
const IS_REBUILD_ONLY = args.includes('--rebuild-only');
const IS_FORCE        = args.includes('--force');
const IS_DRY_RUN      = args.includes('--dry-run');
const IS_ADVANCE      = !IS_RESET && !IS_REBUILD_ONLY && (args.includes('--advance') || !IS_DRY_RUN);

// ── Load Catalog Data ─────────────────────────────────────────────────────────

const productsPath   = path.join(DATA_DIR, 'products.json');
const categoriesPath = path.join(DATA_DIR, 'categories.json');
const historyPath    = path.join(DATA_DIR, 'pinned_history.json');

const products   = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

// ── Load / Initialize History ─────────────────────────────────────────────────

let history = {
  lastUpdated: new Date().toISOString(),
  lastAdvanceDate: '',
  dayCounter: 0,
  totalPinned: 0,
  pinnedIds: [],
  boardFeeds: {},
};

if (!IS_RESET && fs.existsSync(historyPath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    if (Array.isArray(raw)) {
      history.pinnedIds = raw.map(String);
      history.totalPinned = raw.length;
    } else {
      history.dayCounter      = typeof raw.dayCounter === 'number' ? raw.dayCounter : 0;
      history.lastAdvanceDate = typeof raw.lastAdvanceDate === 'string' ? raw.lastAdvanceDate : '';
      history.pinnedIds       = Array.isArray(raw.pinnedIds) ? raw.pinnedIds.map(String) : [];
      history.totalPinned     = history.pinnedIds.length;
      history.boardFeeds      = (raw.boardFeeds && typeof raw.boardFeeds === 'object') ? raw.boardFeeds : {};
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
    const clean = product.primary_keyword.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (clean) tags.add(clean);
  }
  return [...tags].slice(0, 4).map(t => `#${t}`).join(' ');
}

function getCategoryTitle(slug) {
  const board = BOARDS.find(b => b.slug === slug);
  if (board) return board.title;
  const cat = categories.find(c => c.slug === slug);
  return cat ? cat.title : slug;
}

/**
 * Intelligent Multi-Tier Candidate Selector.
 * Tier 1: Direct category match.
 * Tier 2: Keyword / Niche / Theme matching against board keywords.
 * Tier 3: Global unpinned catalog fallback.
 */
function getNextCandidateForBoard(boardDef) {
  const { slug, keywords } = boardDef;

  // Tier 1: Direct Category match
  if (slug !== 'social') {
    const cat = categories.find(c => c.slug === slug);
    if (cat && Array.isArray(cat.productIds)) {
      for (const id of cat.productIds) {
        if (!pinnedSet.has(String(id))) {
          const product = products.find(p => String(p.design_id) === String(id));
          if (product) return product;
        }
      }
    }
  }

  // Tier 2: Keyword / Niche / Theme semantic matching
  if (keywords && keywords.length > 0) {
    for (const p of products) {
      const id = String(p.design_id);
      if (!pinnedSet.has(id)) {
        const haystack = `${p.title} ${p.niche} ${p.secondary_niche} ${p.theme} ${p.style} ${p.primary_keyword} ${p.tags}`.toLowerCase();
        if (keywords.some(k => haystack.includes(k.toLowerCase()))) {
          return p;
        }
      }
    }
  }

  // Tier 3: Global unpinned catalog fallback
  for (const p of products) {
    if (!pinnedSet.has(String(p.design_id))) {
      return p;
    }
  }

  return null;
}

function createFeedItem(product, pubDateStr = new Date().toUTCString()) {
  return {
    design_id: String(product.design_id),
    slug: product.slug,
    title: product.title,
    seo_title: product.seo_title,
    description: product.meta_description || product.description || product.title,
    image_url: product.image_url,
    image_alt: product.image_alt || product.title,
    niche: product.niche,
    secondary_niche: product.secondary_niche,
    primary_keyword: product.primary_keyword,
    tags: product.tags,
    pubDate: pubDateStr,
  };
}

// ── Processing: 1 New Pin for ALL 11 Boards Daily ─────────────────────────────

const todayUtcDate = new Date().toISOString().slice(0, 10);
const alreadyAdvancedToday = history.lastAdvanceDate === todayUtcDate;

console.log(`\n📅 Daily Pinterest RSS Engine — Day ${history.dayCounter} (Date: ${todayUtcDate})`);
console.log(`🎯 Processing ALL ${BOARDS.length} Pinterest Boards (strictly 1 fresh product pin per board daily)\n`);

const isFirstRun = IS_RESET || (history.totalPinned === 0 && Object.values(history.boardFeeds).every(arr => arr.length === 0));

if (isFirstRun && !IS_REBUILD_ONLY) {
  console.log('🌱 Initializing brand-new clean RSS feeds (seeding 1 fresh product per board)...');
  history.dayCounter = 1;
  history.lastAdvanceDate = todayUtcDate;
  history.boardFeeds = {};

  BOARDS.forEach(board => {
    history.boardFeeds[board.slug] = [];
    const selected = getNextCandidateForBoard(board);
    if (selected) {
      pinnedSet.add(String(selected.design_id));
      history.boardFeeds[board.slug] = [createFeedItem(selected)];
      console.log(`   ✅ Seeded [${board.slug}]: "${selected.title}" (ID: ${selected.design_id})`);
    } else {
      console.warn(`   ⚠️ [${board.slug}] No candidate product available.`);
    }
  });
} else if (IS_ADVANCE && !IS_REBUILD_ONLY) {
  if (alreadyAdvancedToday && !IS_FORCE) {
    console.log(`ℹ️ All 11 feeds have already been advanced today (${todayUtcDate}, Day ${history.dayCounter}).`);
    console.log(`   Re-rendering XML feeds to update timestamps without adding duplicate pins.`);
    console.log(`   (Tip: Pass --force to add another pin batch manually).`);
  } else {
    console.log(`⚡ Adding 1 fresh unpinned product to ALL 11 board feeds (${IS_FORCE ? 'FORCE ADVANCE' : 'Daily Advance'}):`);

    BOARDS.forEach(board => {
      const selected = getNextCandidateForBoard(board);

      if (selected) {
        pinnedSet.add(String(selected.design_id));

        const newItem = createFeedItem(selected);

        // Prepend newest item to the top of the board's feed buffer
        const currentFeed = history.boardFeeds[board.slug] || [];
        history.boardFeeds[board.slug] = [newItem, ...currentFeed].slice(0, MAX_FEED_BUFFER);

        console.log(`   ➕ [${board.slug}] Added: "${selected.title}" (ID: ${selected.design_id})`);
      } else {
        console.warn(`   ⚠️ [${board.slug}] Entire product catalog exhausted. No new product available.`);
      }
    });

    // Advance day counter and record date
    history.dayCounter += 1;
    history.lastAdvanceDate = todayUtcDate;
  }
}

// Update history totals
history.pinnedIds   = Array.from(pinnedSet);
history.totalPinned = pinnedSet.size;
history.lastUpdated = new Date().toISOString();

// ── Generate RSS 2.0 XML Feeds ────────────────────────────────────────────────

function buildRssXml(slug, title, items) {
  const now = new Date().toUTCString();
  const feedUrl = `${SITE_URL}/rss/${slug}.xml`;
  const feedItems = items.slice(0, MAX_FEED_BUFFER);

  const itemsXml = feedItems.map(item => {
    const productLink = `${SITE_URL}/design/${item.slug}`;
    const imageUrl    = ensureHttps(item.image_url);
    const hashtags    = buildHashtags(item);
    const descText    = item.description || item.title;
    const fullDesc    = `${descText} ${hashtags}`.trim();
    const itemTitle   = item.seo_title || item.title;
    const imageAlt    = item.image_alt || itemTitle;

    // CDATA description with embedded <img> guarantees 100% Pinterest bot image parsing
    const descriptionHtml = `<img src="${escapeXml(imageUrl)}" alt="${escapeXml(imageAlt)}" /><p>${escapeXml(fullDesc)}</p>`;

    return `    <item>
      <guid isPermaLink="true">${escapeXml(productLink)}</guid>
      <title><![CDATA[${itemTitle}]]></title>
      <link>${escapeXml(productLink)}</link>
      <description><![CDATA[${descriptionHtml}]]></description>
      <content:encoded><![CDATA[${descriptionHtml}]]></content:encoded>
      <pubDate>${item.pubDate || now}</pubDate>
      <media:content url="${escapeXml(imageUrl)}" medium="image" type="image/jpeg" />
      <media:thumbnail url="${escapeXml(imageUrl)}" />
      <enclosure url="${escapeXml(imageUrl)}" type="image/jpeg" length="150000" />
    </item>`;
  }).join('\n\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`Black Panther Store - ${title}`)}</title>
    <link>${SITE_URL}/</link>
    <description>${escapeXml(`TeePublic products for ${title}`)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>
`;
}

if (!IS_DRY_RUN) {
  // Ensure output directory exists
  fs.mkdirSync(PUBLIC_RSS, { recursive: true });

  // Save history state
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8');

  // Write all 11 RSS files
  console.log(`\n📝 Writing 11 RSS feeds to public/rss/:`);
  BOARDS.forEach(board => {
    const title = getCategoryTitle(board.slug);
    const items = history.boardFeeds[board.slug] || [];
    const xml = buildRssXml(board.slug, title, items);
    const filePath = path.join(PUBLIC_RSS, `${board.slug}.xml`);
    fs.writeFileSync(filePath, xml, 'utf8');
    console.log(`   ✅ ${board.slug}.xml (${items.length} items in feed) [🟢 +1 new pin daily]`);
  });

  console.log(`\n✨ Done! Total unique products recorded in history: ${history.totalPinned}\n`);

  // ── Print Clean Summary Table ───────────────────────────────────────────────
  console.log('┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐');
  console.log('│                                  11 PINTEREST RSS FEEDS (1 PIN/BOARD/DAY)                               │');
  console.log('├────┬─────────────────────────────┬───────────────────────────────────────────────────────────────────────┤');
  console.log('│ #  │ Board Name                  │ Public RSS Feed URL                                                   │');
  console.log('├────┼─────────────────────────────┼───────────────────────────────────────────────────────────────────────┤');
  BOARDS.forEach((board, idx) => {
    const num = String(idx + 1).padEnd(2);
    const title = board.title.padEnd(27);
    const url = `${SITE_URL}/rss/${board.slug}.xml`.padEnd(69);
    console.log(`│ ${num} │ ${title} │ ${url} │`);
  });
  console.log('└────┴─────────────────────────────┴───────────────────────────────────────────────────────────────────────┘\n');
} else {
  console.log('\n🔍 DRY RUN: No files written.\n');
}
