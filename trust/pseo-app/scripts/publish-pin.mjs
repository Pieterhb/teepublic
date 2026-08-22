/**
 * publish-pin.mjs (DEPRECATED)
 *
 * NOTE: The direct Pinterest API pinning route was retired in favor of the
 * 100% free Native RSS 6-Board Daily Rotation Engine (scripts/generate-rss.mjs).
 *
 * Reason: Pinterest Developer Sandbox approval was denied for direct API access.
 * The native RSS approach auto-publishes exactly 6 pins per day across 11 boards
 * with zero duplicates and requires no developer approval or paid subscriptions.
 *
 * See:
 *   - scripts/generate-rss.mjs
 *   - .github/workflows/pinterest-pins.yml
 *   - data/pinned_history.json
 */

console.log('ℹ️ Direct Pinterest API script is deprecated.');
console.log('   Pinterest pinning is now handled automatically by the daily RSS rotation engine:');
console.log('   Run: npm run rss');
