/**
 * publish-pin.mjs
 *
 * Standalone Pinterest pin publisher.
 * Runs via GitHub Actions on a schedule (every 2 hours, UTC 00:00-20:00).
 * Posts directly to the Pinterest API — no Make.com or external webhook needed.
 *
 * Required environment variables:
 *   PINTEREST_ACCESS_TOKEN  — Your Pinterest OAuth2 access token
 *   PINTEREST_BOARD_IDS     — JSON object mapping board slugs to Pinterest board IDs
 *                             e.g. '{"astronomy-shirts":"123456789","hobbies-shirts":"987654321",...}'
 *
 * Optional environment variables:
 *   DRY_RUN=true            — Print what would be pinned without actually posting
 *   FORCE_HOUR=N            — Override the current UTC hour for testing (0-22)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Configuration ──────────────────────────────────────────────────────────────

const SITE_URL = 'https://blackpantherstore.co.za';
const LAUNCH_DATE = new Date('2026-08-04T00:00:00Z'); // Day 0 of pinning

/**
 * Schedule: 11 boards, one pin per board per day.
 * Each board is pinned at a specific UTC hour (every 2 hrs, starting midnight).
 * After UTC 20:00 there is a 4-hour gap until the next day's cycle begins at UTC 00:00.
 */
const BOARD_SCHEDULE = [
  { hour: 0,  slug: 'astronomy-shirts' },
  { hour: 2,  slug: 'hobbies-shirts' },
  { hour: 4,  slug: 'animals-shirts' },
  { hour: 6,  slug: 'minimalist-engineer-shirts' },
  { hour: 8,  slug: 'minimalist-shirts' },
  { hour: 10, slug: 'math-shirts' },
  { hour: 12, slug: 'engineer-shirts' },
  { hour: 14, slug: 'everyday-shirts' },
  { hour: 16, slug: 'professions-shirts' },
  { hour: 18, slug: 'science-shirts' },
  { hour: 20, slug: 'social' },
];

const PINTEREST_API_BASE = 'https://api.pinterest.com/v5';

// ── Environment ────────────────────────────────────────────────────────────────

const ACCESS_TOKEN = process.env.PINTEREST_ACCESS_TOKEN;
const BOARD_IDS_JSON = process.env.PINTEREST_BOARD_IDS;
const DRY_RUN = process.env.DRY_RUN === 'true';
const FORCE_HOUR = process.env.FORCE_HOUR !== undefined ? parseInt(process.env.FORCE_HOUR, 10) : null;

if (!ACCESS_TOKEN) {
  console.error('❌ PINTEREST_ACCESS_TOKEN environment variable is not set.');
  console.error('   Get your token from: https://developers.pinterest.com/docs/getting-started/authentication/');
  process.exit(1);
}

if (!BOARD_IDS_JSON) {
  console.error('❌ PINTEREST_BOARD_IDS environment variable is not set.');
  console.error('   Set it to a JSON object mapping board slugs to Pinterest board IDs.');
  console.error('   Example: \'{"astronomy-shirts":"123456789","hobbies-shirts":"987654321"}\'');
  process.exit(1);
}

let BOARD_IDS;
try {
  BOARD_IDS = JSON.parse(BOARD_IDS_JSON);
} catch (e) {
  console.error('❌ PINTEREST_BOARD_IDS is not valid JSON:', e.message);
  process.exit(1);
}

// ── Data Loading ───────────────────────────────────────────────────────────────

const productsPath = path.join(__dirname, '..', 'data', 'products.json');
const categoriesPath = path.join(__dirname, '..', 'data', 'categories.json');

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

// ── Determine which board to pin to ───────────────────────────────────────────

const now = new Date();
const currentHour = FORCE_HOUR !== null ? FORCE_HOUR : now.getUTCHours();

// Find the matching schedule entry for this hour
const scheduleEntry = BOARD_SCHEDULE.find(entry => entry.hour === currentHour);

if (!scheduleEntry) {
  console.log(`ℹ️  No pin scheduled for UTC hour ${currentHour}. Exiting cleanly.`);
  console.log(`   Pinning hours are: ${BOARD_SCHEDULE.map(e => e.hour).join(', ')}`);
  process.exit(0);
}

const targetSlug = scheduleEntry.slug;
console.log(`🎯 Targeting board: ${targetSlug} (UTC hour ${currentHour})`);

// ── Calculate which product to pin (day-based index) ──────────────────────────

const msPerDay = 1000 * 60 * 60 * 24;
// Use noon UTC for stable day calculation (avoids DST edge cases)
const noonToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0));
const dayIndex = Math.floor((noonToday - LAUNCH_DATE) / msPerDay);

if (dayIndex < 0) {
  console.log(`⏳ Too early to pin. Launch date is ${LAUNCH_DATE.toISOString().split('T')[0]}, today is ${now.toISOString().split('T')[0]}`);
  process.exit(0);
}

console.log(`📅 Day index since launch: ${dayIndex}`);

// ── Find the product to pin ────────────────────────────────────────────────────

let productToPin = null;
let boardName = '';

if (targetSlug === 'social') {
  // For the social board: cycle through all products
  const index = dayIndex % products.length;
  productToPin = products[index];
  boardName = 'social';
  console.log(`📌 Social board: product index ${index} of ${products.length}`);
} else {
  const category = categories.find(c => c.slug === targetSlug);
  if (!category) {
    console.error(`❌ Category not found: ${targetSlug}. Check your BOARD_SCHEDULE slugs match categories.json.`);
    process.exit(1);
  }
  boardName = targetSlug;

  const categoryProducts = category.productIds
    .map(id => products.find(p => String(p.design_id) === String(id)))
    .filter(Boolean);

  if (categoryProducts.length === 0) {
    console.error(`❌ No products found for category: ${targetSlug}`);
    process.exit(1);
  }

  // Cycle through products for this category using modulo (never runs out)
  const index = dayIndex % categoryProducts.length;
  productToPin = categoryProducts[index];
  console.log(`📌 Category "${category.title}": product index ${index} of ${categoryProducts.length}`);
}

if (!productToPin) {
  console.error('❌ Failed to resolve product to pin.');
  process.exit(1);
}

// ── Resolve the Pinterest Board ID ────────────────────────────────────────────

const boardId = BOARD_IDS[boardName];
if (!boardId) {
  console.error(`❌ No Pinterest board ID found for slug: "${boardName}"`);
  console.error('   Available board IDs:', JSON.stringify(Object.keys(BOARD_IDS)));
  console.error('   Add it to PINTEREST_BOARD_IDS in your GitHub Actions secrets.');
  process.exit(1);
}

// ── Build the pin payload ──────────────────────────────────────────────────────

const pinPayload = {
  board_id: boardId,
  title: productToPin.seo_title || productToPin.title,
  description: productToPin.meta_description || productToPin.description,
  link: `${SITE_URL}/design/${productToPin.slug}`,
  media_source: {
    source_type: 'image_url',
    url: productToPin.image_url,
  },
  // alt_text for accessibility
  alt_text: productToPin.image_alt || productToPin.title,
};

console.log('\n📋 Pin details:');
console.log('   Title   :', pinPayload.title);
console.log('   Board ID:', boardId);
console.log('   Link    :', pinPayload.link);
console.log('   Image   :', pinPayload.media_source.url);

// ── Dry run mode ──────────────────────────────────────────────────────────────

if (DRY_RUN) {
  console.log('\n🔍 DRY RUN MODE — Pin NOT sent. Set DRY_RUN=false or unset it to post for real.');
  console.log('   Full payload:', JSON.stringify(pinPayload, null, 2));
  process.exit(0);
}

// ── Post to Pinterest API ─────────────────────────────────────────────────────

console.log('\n🚀 Posting pin to Pinterest...');

const response = await fetch(`${PINTEREST_API_BASE}/pins`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(pinPayload),
});

const responseText = await response.text();

if (response.ok) {
  let result;
  try { result = JSON.parse(responseText); } catch { result = responseText; }
  console.log(`\n✅ Pin published successfully!`);
  console.log('   Pin ID:', result?.id || '(unknown)');
  console.log('   Board :', boardName);
  console.log('   Day   :', dayIndex);
} else {
  console.error(`\n❌ Pinterest API returned status ${response.status}`);
  console.error('   Response:', responseText);

  // Provide helpful error guidance
  if (response.status === 401) {
    console.error('\n💡 Status 401 = Invalid or expired access token.');
    console.error('   Generate a new token at: https://developers.pinterest.com/tools/access-token/');
    console.error('   Then update the PINTEREST_ACCESS_TOKEN secret in GitHub Actions.');
  } else if (response.status === 403) {
    console.error('\n💡 Status 403 = Insufficient permissions.');
    console.error('   Make sure your Pinterest app has "pins:write" and "boards:read" scopes.');
  } else if (response.status === 422) {
    console.error('\n💡 Status 422 = Invalid pin data (e.g. bad board_id or image URL).');
    console.error('   Check that your board IDs are correct and the image URL is publicly accessible.');
  }

  process.exit(1);
}
