/**
 * check-status.mjs
 *
 * FULL Pinterest 11-Board RSS Diagnostic.
 *
 * What it checks:
 *   1. Local pinned_history.json state (day counter, totals, per-board buffer)
 *   2. Live RSS feeds fetched from blackpantherstore.co.za (what Pinterest ACTUALLY sees)
 *   3. Side-by-side diff: local buffer vs live feed content
 *   4. Pin freshness report: how old each item is, so you can spot stale/missing pins
 *   5. HTTP health: status code, Content-Type, response time per feed
 *
 * Usage:
 *   node scripts/check-status.mjs
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR   = path.join(__dirname, '..', 'data');
const historyPath = path.join(DATA_DIR, 'pinned_history.json');
const SITE_URL   = 'https://blackpantherstore.co.za';

const NOW = new Date();

// ── Helpers ───────────────────────────────────────────────────────────────────

function ageStr(dateStr) {
  if (!dateStr) return 'unknown';
  const d = new Date(dateStr);
  if (isNaN(d)) return 'invalid date';
  const diffMs = NOW - d;
  const diffH  = diffMs / 3_600_000;
  if (diffH < 1)  return `${Math.round(diffMs / 60000)}m ago`;
  if (diffH < 48) return `${diffH.toFixed(1)}h ago`;
  const diffD = diffH / 24;
  return `${diffD.toFixed(1)}d ago`;
}

function fetchText(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = https.get(url, { headers: { 'User-Agent': 'Pinterest/0.2 (+https://www.pinterest.com/)' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({
        status: res.statusCode,
        contentType: res.headers['content-type'] || '',
        body: data,
        ms: Date.now() - start,
        bytes: Buffer.byteLength(data),
      }));
    });
    req.on('error', (err) => resolve({ status: 'ERR', error: err.message, ms: Date.now() - start }));
    req.setTimeout(12000, () => { req.destroy(); resolve({ status: 'TIMEOUT', ms: 12000 }); });
  });
}

function parseRssItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const get = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\/${tag}>|<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i'));
      return m ? (m[1] || m[2] || '').trim() : '';
    };
    const getAttr = (tag, attr) => {
      const m = block.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i'));
      return m ? m[1].trim() : '';
    };
    items.push({
      guid:    get('guid'),
      title:   get('title'),
      pubDate: get('pubDate'),
      imageUrl: getAttr('media:content', 'url') || getAttr('enclosure', 'url'),
      link:    get('link'),
    });
  }
  return items;
}

// ── Load Local History ────────────────────────────────────────────────────────

console.log('\n================================================================================');
console.log('         PINTEREST 11-BOARD RSS DIAGNOSTIC REPORT — ' + NOW.toUTCString());
console.log('================================================================================\n');

if (!fs.existsSync(historyPath)) {
  console.error('❌ pinned_history.json not found! Run: node scripts/generate-rss.mjs --advance');
  process.exit(1);
}

const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
const totalPinned = history.totalPinned || (history.pinnedIds || []).length;

console.log('📊 LOCAL STATE (pinned_history.json)');
console.log('─────────────────────────────────────────────────────────────────────────────');
console.log(`   Total unique IDs pinned : ${totalPinned}`);
console.log(`   Day counter             : Day ${history.dayCounter || 0}`);
console.log(`   Last advance date       : ${history.lastAdvanceDate || 'N/A'}`);
console.log(`   Last updated            : ${history.lastUpdated || 'N/A'} (${ageStr(history.lastUpdated)})`);
console.log('');

const boards = Object.keys(history.boardFeeds || {});

// ── Live RSS Feed Verification ────────────────────────────────────────────────

console.log('🌐 LIVE RSS FEEDS (what Pinterest actually crawls at blackpantherstore.co.za)');
console.log('─────────────────────────────────────────────────────────────────────────────\n');

async function auditAll() {
  let totalOk = 0;
  let totalWarn = 0;
  let totalFail = 0;

  for (const slug of boards) {
    const localItems = history.boardFeeds[slug] || [];
    const feedUrl = `${SITE_URL}/rss/${slug}.xml`;

    process.stdout.write(`  🔍 [${slug}] fetching...`);
    const res = await fetchText(feedUrl);

    if (res.status !== 200) {
      console.log(`\r  ❌ [${slug}] HTTP ${res.status} ${res.error || ''} (${res.ms}ms)`);
      totalFail++;
      continue;
    }

    const liveItems = parseRssItems(res.body);
    const ctOk = res.contentType.includes('xml') || res.contentType.includes('rss');
    const statusLine = `HTTP ${res.status} | ${res.bytes} bytes | ${res.ms}ms | Content-Type: ${res.contentType}`;
    const ctWarn = ctOk ? '' : ' ⚠️  Content-Type should be application/rss+xml';

    console.log(`\r  ✅ [${slug}]`);
    console.log(`       ${statusLine}${ctWarn}`);
    console.log(`       Live feed items : ${liveItems.length}  |  Local buffer : ${localItems.length}`);

    // Per-item freshness table
    if (liveItems.length === 0) {
      console.log('       ⚠️  No <item> elements found in live feed!');
      totalWarn++;
    } else {
      const header = '       # │ pubDate                       │ Age        │ Title';
      console.log(header);
      liveItems.forEach((item, i) => {
        const age = ageStr(item.pubDate);
        const title = (item.title || '(no title)').slice(0, 40);
        const pubDate = (item.pubDate || 'no date').padEnd(29);
        const agePad  = age.padEnd(10);
        console.log(`       ${i + 1} │ ${pubDate} │ ${agePad} │ ${title}`);
      });

      // Check if newest item in live feed matches local buffer
      const liveTop  = liveItems[0]?.guid || '';
      const localTop = localItems[0]
        ? `${SITE_URL}/design/${localItems[0].slug}#pin-${slug}-${localItems[0].design_id}`
        : '';
      if (liveTop && localTop && liveTop !== localTop) {
        console.log(`       ⚠️  STALE: Live feed top item differs from local buffer top!`);
        console.log(`          Live   GUID: ${liveTop}`);
        console.log(`          Local  GUID: ${localTop}`);
        totalWarn++;
      } else {
        totalOk++;
      }
    }
    console.log('');
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('================================================================================');
  console.log('SUMMARY');
  console.log('─────────────────────────────────────────────────────────────────────────────');
  console.log(`  ✅ OK       : ${totalOk}/${boards.length} boards`);
  if (totalWarn > 0)  console.log(`  ⚠️  Warnings : ${totalWarn} board(s) have stale or mismatched feeds`);
  if (totalFail > 0)  console.log(`  ❌ Failures : ${totalFail} board(s) returned HTTP errors`);
  console.log('');
  console.log('📌 PINTEREST SCRAPER NOTES:');
  console.log('   • Pinterest crawls RSS feeds every 24–72h (not real-time).');
  console.log('   • Each new item in the feed may take up to 3 days to appear in Pinterest.');
  console.log('   • If an item is pinned by Pinterest, it will NOT appear in your board count');
  console.log('     until Pinterest finishes processing (can lag 1-2 extra days).');
  console.log('   • Buffer size is now 7 items/board, giving Pinterest a 7-day window.');
  console.log('   • Run this script daily to track live feed health.');
  console.log('================================================================================\n');
}

auditAll();
