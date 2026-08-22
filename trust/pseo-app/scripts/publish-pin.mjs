/**
 * publish-pin.mjs
 *
 * Standalone Pinterest automated pin publisher.
 * Runs via GitHub Actions 10 times daily (spaced every 2 hours: UTC 04:00 to 22:00).
 * Posts directly to the Pinterest API v5 — 100% free, no external automation tools.
 *
 * Environment variables:
 *   PINTEREST_ACCESS_TOKEN  - Pinterest OAuth 2.0 Access Token
 *   PINTEREST_BOARD_IDS     - JSON mapping of board slugs/names to Pinterest board IDs
 *                             e.g. '{"astronomy-shirts":"1094937796846013010",...}'
 *   DRY_RUN                 - If 'true', logs pin details without posting to API
 *   FORCE_BOARD             - Optional slug to override target board (e.g. 'astronomy-shirts')
 *   FORCE_HOUR              - Optional UTC hour (0-23) to test specific schedule slot
 *
 * Duplicate prevention:
 *   Tracks every pinned design in data/pinned_history.json.
 *   Each run picks the next unpinned product for the target board.
 *   Commits updated history back to the GitHub repository automatically.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Configuration ─────────────────────────────────────────────────────────────

const SITE_URL = 'https://blackpantherstore.co.za';
const PINTEREST_API_BASE = 'https://api.pinterest.com/v5';

/**
 * 10-slot daily posting schedule (UTC hours: 04, 06, 08, 10, 12, 14, 16, 18, 20, 22)
 * Maps each time slot to one of our 10 product categories.
 */
const BOARD_SCHEDULE = [
  { hour: 4,  slug: 'astronomy-shirts',          title: 'Astronomy Shirts' },
  { hour: 6,  slug: 'hobbies-shirts',            title: 'Hobbies Shirts' },
  { hour: 8,  slug: 'animals-shirts',            title: 'Animals Shirts' },
  { hour: 10, slug: 'minimalist-engineer-shirts', title: 'Minimalist Engineer Shirts' },
  { hour: 12, slug: 'minimalist-shirts',         title: 'Minimalist Shirts' },
  { hour: 14, slug: 'math-shirts',               title: 'Math Shirts' },
  { hour: 16, slug: 'engineer-shirts',           title: 'Engineer Shirts' },
  { hour: 18, slug: 'everyday-shirts',           title: 'Everyday Shirts' },
  { hour: 20, slug: 'professions-shirts',        title: 'Professions Shirts' },
  { hour: 22, slug: 'science-shirts',            title: 'Science Shirts' },
];

// ── Environment & Inputs ──────────────────────────────────────────────────────

const ACCESS_TOKEN = process.env.PINTEREST_ACCESS_TOKEN?.trim();
const BOARD_IDS_JSON = process.env.PINTEREST_BOARD_IDS?.trim();
const DRY_RUN = process.env.DRY_RUN === 'true';
const FORCE_BOARD = process.env.FORCE_BOARD?.trim() || null;
const rawForceHour = process.env.FORCE_HOUR?.trim() || '';
const parsedForceHour = rawForceHour !== '' ? parseInt(rawForceHour, 10) : null;
const FORCE_HOUR = (parsedForceHour !== null && !isNaN(parsedForceHour)) ? parsedForceHour : null;

if (!ACCESS_TOKEN && !DRY_RUN) {
  console.error('❌ PINTEREST_ACCESS_TOKEN secret is not set.');
  console.error('   Please add PINTEREST_ACCESS_TOKEN to GitHub repository secrets.');
  process.exit(1);
}

let BOARD_IDS = {};
if (BOARD_IDS_JSON) {
  try {
    BOARD_IDS = JSON.parse(BOARD_IDS_JSON);
  } catch (e) {
    console.warn(`⚠️ PINTEREST_BOARD_IDS is not valid JSON (${e.message}).`);
    // Attempt relaxed parsing if simple key=val or unquoted format
    try {
      const fixed = BOARD_IDS_JSON.replace(/'/g, '"');
      BOARD_IDS = JSON.parse(fixed);
    } catch {
      console.warn('   Could not auto-fix BOARD_IDS JSON format.');
    }
  }
} else if (!DRY_RUN) {
  console.error('❌ PINTEREST_BOARD_IDS secret is not set.');
  console.error('   Add PINTEREST_BOARD_IDS JSON mapping to GitHub repository secrets.');
  process.exit(1);
}

// ── Load Data Files ───────────────────────────────────────────────────────────

const productsPath = path.join(__dirname, '..', 'data', 'products.json');
const categoriesPath = path.join(__dirname, '..', 'data', 'categories.json');
const pinnedHistoryPath = path.join(__dirname, '..', 'data', 'pinned_history.json');

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

// ── Load Pinned History ───────────────────────────────────────────────────────

let historyFile = {
  lastUpdated: new Date().toISOString(),
  totalPinned: 0,
  pinnedIds: [],
  history: []
};

if (fs.existsSync(pinnedHistoryPath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(pinnedHistoryPath, 'utf8'));
    if (Array.isArray(raw)) {
      historyFile.pinnedIds = raw.map(String);
      historyFile.totalPinned = raw.length;
    } else {
      historyFile.pinnedIds = Array.isArray(raw.pinnedIds) ? raw.pinnedIds.map(String) : [];
      historyFile.totalPinned = historyFile.pinnedIds.length;
      historyFile.history = Array.isArray(raw.history) ? raw.history : [];
      historyFile.lastUpdated = raw.lastUpdated || historyFile.lastUpdated;
    }
    console.log(`📚 Loaded pinned history: ${historyFile.pinnedIds.length} design(s) already recorded.`);
  } catch (e) {
    console.warn(`⚠️ Could not parse pinned_history.json (${e.message}). Starting fresh.`);
  }
} else {
  console.log('📚 No pinned_history.json found — starting new history tracking.');
}

const pinnedSet = new Set(historyFile.pinnedIds);

// ── Determine Target Board ────────────────────────────────────────────────────

const now = new Date();
const currentUtcHour = now.getUTCHours();

let targetSlug = null;
let targetTitle = '';

if (FORCE_BOARD) {
  targetSlug = FORCE_BOARD;
  const match = BOARD_SCHEDULE.find(b => b.slug === targetSlug) || categories.find(c => c.slug === targetSlug);
  targetTitle = match?.title || targetSlug;
  console.log(`🎯 Target board forced via input: "${targetSlug}" (${targetTitle})`);
} else if (FORCE_HOUR !== null) {
  const match = BOARD_SCHEDULE.find(b => b.hour === FORCE_HOUR) || BOARD_SCHEDULE[FORCE_HOUR % BOARD_SCHEDULE.length];
  targetSlug = match.slug;
  targetTitle = match.title;
  console.log(`🎯 Target board from forced hour ${FORCE_HOUR} UTC: "${targetSlug}" (${targetTitle})`);
} else {
  // Find matching scheduled hour or closest slot
  const exactMatch = BOARD_SCHEDULE.find(b => b.hour === currentUtcHour);
  if (exactMatch) {
    targetSlug = exactMatch.slug;
    targetTitle = exactMatch.title;
    console.log(`🎯 Target board for ${currentUtcHour}:00 UTC slot: "${targetSlug}" (${targetTitle})`);
  } else {
    // Pick closest slot in schedule so manual / delayed runs always post
    let closest = BOARD_SCHEDULE[0];
    let minDiff = 24;
    for (const item of BOARD_SCHEDULE) {
      const diff = Math.abs(item.hour - currentUtcHour);
      if (diff < minDiff) {
        minDiff = diff;
        closest = item;
      }
    }
    targetSlug = closest.slug;
    targetTitle = closest.title;
    console.log(`🎯 Current hour is ${currentUtcHour}:00 UTC. Closest scheduled slot: "${targetSlug}" (${targetTitle})`);
  }
}

// ── Resolve Board ID ──────────────────────────────────────────────────────────

function resolveBoardId(boardIds, slug, title) {
  if (!boardIds || typeof boardIds !== 'object') return null;

  // 1. Direct slug match
  if (boardIds[slug]) return String(boardIds[slug]);

  // 2. Case-insensitive slug match
  const lowerSlug = slug.toLowerCase();
  for (const [k, v] of Object.entries(boardIds)) {
    if (k.toLowerCase() === lowerSlug) return String(v);
  }

  // 3. Category title match
  if (title) {
    const lowerTitle = title.toLowerCase();
    for (const [k, v] of Object.entries(boardIds)) {
      if (k.toLowerCase() === lowerTitle) return String(v);
      const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanT = lowerTitle.replace(/[^a-z0-9]/g, '');
      if (cleanK && cleanK === cleanT) return String(v);
    }
  }

  // 4. Default / Fallback keys
  if (boardIds['default']) return String(boardIds['default']);
  if (boardIds['all']) return String(boardIds['all']);
  if (boardIds['social']) return String(boardIds['social']);

  // 5. If only 1 key exists in the mapping, use that board ID
  const values = Object.values(boardIds);
  if (values.length === 1) return String(values[0]);

  return null;
}

const boardId = resolveBoardId(BOARD_IDS, targetSlug, targetTitle);

if (!boardId && !DRY_RUN) {
  console.error(`❌ Could not find Pinterest Board ID for "${targetSlug}" (${targetTitle}).`);
  console.error(`   Available keys in PINTEREST_BOARD_IDS: ${JSON.stringify(Object.keys(BOARD_IDS))}`);
  console.error(`   Please ensure PINTEREST_BOARD_IDS contains "${targetSlug}" or a "default" board ID.`);
  process.exit(1);
}

// ── Select Next Product to Pin (Duplicate Prevention + Rotation) ──────────────

let candidates = [];

if (targetSlug === 'social') {
  candidates = [...products];
} else {
  const category = categories.find(c => c.slug === targetSlug);
  if (category && Array.isArray(category.productIds)) {
    candidates = category.productIds
      .map(id => products.find(p => String(p.design_id) === String(id)))
      .filter(Boolean);
  }
  if (candidates.length === 0) {
    console.warn(`⚠️ No specific products found for category slug "${targetSlug}". Using all products.`);
    candidates = [...products];
  }
}

// Sort candidates newest scrape first
candidates.sort((a, b) => {
  const da = a.scrape_timestamp ? new Date(a.scrape_timestamp) : new Date(0);
  const db = b.scrape_timestamp ? new Date(b.scrape_timestamp) : new Date(0);
  return db - da;
});

// Filter for unpinned products
const unpinnedCandidates = candidates.filter(p => !pinnedSet.has(String(p.design_id)));

let selectedProduct = null;
let isRecycled = false;

if (unpinnedCandidates.length > 0) {
  selectedProduct = unpinnedCandidates[0];
  console.log(`✨ Found ${unpinnedCandidates.length} unpinned product(s) for "${targetSlug}". Selected: ${selectedProduct.title} (ID: ${selectedProduct.design_id})`);
} else {
  // All products for this board have been pinned once!
  // Cycle back to the least recently pinned product so the automation never halts.
  console.log(`🔄 All ${candidates.length} products for "${targetSlug}" have been pinned. Rotating to least-recently pinned item.`);
  isRecycled = true;

  // Find the candidate whose design_id was pinned longest ago in history
  let oldestPinnedIndex = -1;
  let oldestPinnedProduct = candidates[0];

  for (const candidate of candidates) {
    const histIndex = historyFile.history.findIndex(h => String(h.design_id) === String(candidate.design_id));
    if (histIndex === -1) {
      oldestPinnedProduct = candidate;
      break;
    }
    if (oldestPinnedIndex === -1 || histIndex < oldestPinnedIndex) {
      oldestPinnedIndex = histIndex;
      oldestPinnedProduct = candidate;
    }
  }

  selectedProduct = oldestPinnedProduct;
}

if (!selectedProduct) {
  console.error('❌ Could not find any product to pin.');
  process.exit(1);
}

// ── Build Pin Payload ─────────────────────────────────────────────────────────

function buildHashtags(product) {
  const tagPool = new Set(['teepublic', 'apparel', 'merch']);
  if (product.niche) tagPool.add(product.niche.replace(/[^a-zA-Z0-9]/g, '').toLowerCase());
  if (product.secondary_niche) tagPool.add(product.secondary_niche.replace(/[^a-zA-Z0-9]/g, '').toLowerCase());
  if (product.primary_keyword) {
    const clean = product.primary_keyword.replace(/[^a-zA-Z0-9]/g, '');
    if (clean) tagPool.add(clean);
  }
  if (product.tags) {
    product.tags.split(',').slice(0, 2).forEach(t => {
      const clean = t.trim().replace(/[^a-zA-Z0-9]/g, '');
      if (clean && clean.length > 2 && clean.length < 20) tagPool.add(clean);
    });
  }
  return [...tagPool].slice(0, 4).map(t => `#${t}`).join(' ');
}

// Clean and truncate title (Pinterest max: 100 chars)
let pinTitle = (selectedProduct.seo_title || selectedProduct.title || 'Graphic T-Shirt').trim();
if (pinTitle.length > 100) {
  pinTitle = pinTitle.slice(0, 97) + '...';
}

// Clean and format description (Pinterest max: 800 chars, ideal: ~300)
const hashtags = buildHashtags(selectedProduct);
let rawDesc = (selectedProduct.meta_description || selectedProduct.description || pinTitle).trim();
let pinDescription = `${rawDesc} ${hashtags}`.trim();
if (pinDescription.length > 500) {
  pinDescription = pinDescription.slice(0, 497 - hashtags.length) + '... ' + hashtags;
}

const pinLink = `${SITE_URL}/design/${selectedProduct.slug}`;
const imageUrl = selectedProduct.image_url.startsWith('http://')
  ? selectedProduct.image_url.replace('http://', 'https://')
  : selectedProduct.image_url;

const pinPayload = {
  board_id: boardId || '1094937796846013010',
  title: pinTitle,
  description: pinDescription,
  link: pinLink,
  media_source: {
    source_type: 'image_url',
    url: imageUrl,
  },
  alt_text: (selectedProduct.image_alt || pinTitle).slice(0, 500),
};

console.log('\n📌 Pin Payload to Post:');
console.log(`   Board ID   : ${pinPayload.board_id} ("${targetTitle}")`);
console.log(`   Title      : ${pinPayload.title}`);
console.log(`   Link       : ${pinPayload.link}`);
console.log(`   Image URL  : ${pinPayload.media_source.url}`);
console.log(`   Description: ${pinPayload.description}`);
console.log(`   Design ID  : ${selectedProduct.design_id} (Recycled: ${isRecycled})\n`);

// ── Dry Run Mode ──────────────────────────────────────────────────────────────

if (DRY_RUN) {
  console.log('🔍 DRY RUN ENABLED — Pin was NOT sent to Pinterest API.');
  console.log('   Payload verified successfully.');
  process.exit(0);
}

// ── Post to Pinterest API v5 ──────────────────────────────────────────────────

console.log('🚀 Sending POST request to https://api.pinterest.com/v5/pins ...');

async function publishPin() {
  try {
    const res = await fetch(`${PINTEREST_API_BASE}/pins`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pinPayload),
    });

    const responseText = await res.text();
    let responseData = {};
    try { responseData = JSON.parse(responseText); } catch { responseData = { text: responseText }; }

    if (!res.ok) {
      console.error(`\n❌ Pinterest API returned HTTP ${res.status}:`);
      console.error(JSON.stringify(responseData, null, 2));

      if (res.status === 401) {
        console.error('\n💡 HTTP 401: Invalid or expired PINTEREST_ACCESS_TOKEN.');
        console.error('   Please generate a fresh token at https://developers.pinterest.com/tools/access-token/');
      } else if (res.status === 403) {
        console.error('\n💡 HTTP 403: Permission denied. Ensure your token has "pins:write" and "boards:read/write" scopes.');
      } else if (res.status === 422) {
        console.error('\n💡 HTTP 422: Invalid pin data. Check board ID and image URL accessibility.');
      }
      process.exit(1);
    }

    const createdPinId = responseData.id || 'N/A';
    console.log(`\n🎉 Pin published successfully to Pinterest!`);
    console.log(`   Pin ID : ${createdPinId}`);
    console.log(`   Board  : ${targetTitle} (${pinPayload.board_id})`);
    console.log(`   Product: ${selectedProduct.title}`);

    // ── Update History ────────────────────────────────────────────────────────

    pinnedSet.add(String(selectedProduct.design_id));
    historyFile.lastUpdated = new Date().toISOString();
    historyFile.totalPinned = pinnedSet.size;
    historyFile.pinnedIds = Array.from(pinnedSet);

    if (!Array.isArray(historyFile.history)) historyFile.history = [];
    historyFile.history.push({
      design_id: String(selectedProduct.design_id),
      pin_id: createdPinId,
      board_slug: targetSlug,
      board_id: pinPayload.board_id,
      title: selectedProduct.title,
      pinned_at: new Date().toISOString(),
    });

    // Keep history list bounded to last 1000 pins
    if (historyFile.history.length > 1000) {
      historyFile.history = historyFile.history.slice(-1000);
    }

    fs.writeFileSync(pinnedHistoryPath, JSON.stringify(historyFile, null, 2), 'utf8');
    console.log(`💾 Saved updated history to data/pinned_history.json (${historyFile.totalPinned} total recorded pins).`);

    // ── Write GitHub Actions Step Summary ─────────────────────────────────────

    if (process.env.GITHUB_STEP_SUMMARY) {
      const summaryMarkdown = `
### 📌 Pinterest Pin Published Successfully!

- **Product:** [${selectedProduct.title}](${pinLink})
- **Board:** ${targetTitle} (\`${pinPayload.board_id}\`)
- **Pin ID:** \`${createdPinId}\`
- **Time (UTC):** ${new Date().toUTCString()}
- **Total Unique Products Pinned:** ${historyFile.totalPinned}
`;
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryMarkdown, 'utf8');
    }

    // ── Commit & Push History in CI ───────────────────────────────────────────

    if (process.env.GITHUB_ACTIONS === 'true') {
      try {
        console.log('📤 Committing updated pinned_history.json back to repository...');
        execSync('git config user.name "github-actions[bot]"', { stdio: 'inherit' });
        execSync('git config user.email "github-actions[bot]@users.noreply.github.com"', { stdio: 'inherit' });
        execSync(`git add "${pinnedHistoryPath}"`, { stdio: 'inherit' });
        execSync(`git commit -m "chore(pins): record pin ${createdPinId} for design ${selectedProduct.design_id} [skip ci]"`, { stdio: 'inherit' });
        execSync('git pull --rebase origin HEAD', { stdio: 'inherit' });
        execSync('git push origin HEAD', { stdio: 'inherit' });
        console.log('✅ History committed and pushed to git.');
      } catch (gitErr) {
        console.warn(`⚠️ Could not auto-commit history to git (${gitErr.message}). Pin was still posted successfully.`);
      }
    }

  } catch (err) {
    console.error('❌ Failed to publish pin due to network/runtime error:', err);
    process.exit(1);
  }
}

publishPin();
