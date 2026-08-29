/**
 * check-status.mjs
 * Comprehensive diagnostic check for Pinterest 11-Board RSS Feeds.
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const historyPath = path.join(DATA_DIR, 'pinned_history.json');
const SITE_URL = 'https://blackpantherstore.co.za';

console.log('================================================================================');
console.log('               PINTEREST 11-BOARD RSS ENGINE DIAGNOSTIC REPORT                  ');
console.log('================================================================================\n');

if (!fs.existsSync(historyPath)) {
  console.error('❌ pinned_history.json not found!');
  process.exit(1);
}

const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));

console.log(`📊 Total Unique Pins Tracked  : ${history.totalPinned || (history.pinnedIds ? history.pinnedIds.length : 0)}`);
console.log(`📅 Current Day Counter        : Day ${history.dayCounter || 0}`);
console.log(`🕒 Last Advanced Date         : ${history.lastAdvanceDate || 'N/A'}`);
console.log(`⏰ Last Updated Timestamp     : ${history.lastUpdated || 'N/A'}\n`);

const boards = Object.keys(history.boardFeeds || {});
console.log('┌─────┬─────────────────────────────┬───────────┬───────────────────────────────────────────┐');
console.log('│ #   │ Board Slug                  │ Items/Buf │ Latest Pin Title (Top of Feed)            │');
console.log('├─────┼─────────────────────────────┼───────────┼───────────────────────────────────────────┤');

boards.forEach((slug, idx) => {
  const items = history.boardFeeds[slug] || [];
  const latest = items[0] || {};
  const num = String(idx + 1).padEnd(3);
  const boardCol = slug.padEnd(27);
  const countCol = String(items.length).padEnd(9);
  const titleCol = (latest.title || 'None').slice(0, 41).padEnd(41);
  console.log(`│ ${num} │ ${boardCol} │ ${countCol} │ ${titleCol} │`);
});
console.log('└─────┴─────────────────────────────┴───────────┴───────────────────────────────────────────┘\n');

console.log('🌐 Performing Live HTTP Verification against blackpantherstore.co.za...\n');

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Pinterest/0.2' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, length: data.length, contentType: res.headers['content-type'] });
      });
    }).on('error', (err) => {
      resolve({ status: 'ERR', error: err.message });
    });
  });
}

async function verifyAll() {
  for (const slug of boards) {
    const feedUrl = `${SITE_URL}/rss/${slug}.xml`;
    const res = await checkUrl(feedUrl);
    const statusIcon = res.status === 200 ? '✅' : '❌';
    console.log(`  ${statusIcon} [${res.status}] ${feedUrl} (${res.length || 0} bytes)`);
  }
  console.log('\n================================================================================');
  console.log('✨ Diagnostic check complete.');
  console.log('================================================================================\n');
}

verifyAll();
