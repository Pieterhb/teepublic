import fs from 'fs';
import path from 'path';

// Load data
const productsPath = path.join(process.cwd(), 'data', 'products.json');
const categoriesPath = path.join(process.cwd(), 'data', 'categories.json');

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

// The Pinterest board names mapped to your slugs
const targetCategories = [
  'astronomy-shirts',
  'hobbies-shirts',
  'animals-shirts',
  'minimalist-engineer-shirts',
  'minimalist-shirts',
  'math-shirts',
  'engineer-shirts',
  'everyday-shirts',
  'professions-shirts', // Professional Shirts
  'science-shirts'
];

const RSS_DIR = path.join(process.cwd(), 'public', 'rss');
if (!fs.existsSync(RSS_DIR)) {
  fs.mkdirSync(RSS_DIR, { recursive: true });
}

const SITE_URL = 'https://blackpantherstore.co.za';

// 1. Calculate current Day of the Year (1 - 365)
const now = new Date();
const startOfYear = new Date(now.getFullYear(), 0, 0);
const diff = now - startOfYear;
const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
const todayDateStr = now.toISOString().split('T')[0]; // e.g. "2026-08-04"

function generateRssXml(title, description, feedUrl, items, categorySlug) {
  const rssItems = items.map(item => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${SITE_URL}/design/${item.slug}</link>
      <description><![CDATA[
        <img src="${item.image_url}" alt="${item.image_alt}" />
        <p>${item.description}</p>
      ]]></description>
      <pubDate>${item.date.toUTCString()}</pubDate>
      <!-- The GUID contains the specific date so Pinterest knows it's a unique daily pin -->
      <guid isPermaLink="false">${categorySlug}-${item.design_id}-${item.dateStr}</guid>
    </item>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${title}</title>
    <link>${SITE_URL}</link>
    <description>${description}</description>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
    ${rssItems}
  </channel>
</rss>`;
}

console.log('Generating RSS feeds for Pinterest (14 items per feed)...');
console.log(`Today is day ${dayOfYear} of the year.`);

// Helper to get up to 14 past days of items, with a specific hour offset
function getRecentItems(productsList, hourOffset = 0) {
  const recentItems = [];
  // We started pinning around day 216 (Aug 4). 
  // We use this to prevent looping/duplicates when boards run out of fresh pins.
  const LAUNCH_DAY_OF_YEAR = 216; 
  
  for (let i = 0; i < 14; i++) {
    const targetDayOfYear = dayOfYear - i;
    if (targetDayOfYear < 1) continue; // Skip days from previous year to avoid complexity
    
    const index = targetDayOfYear - LAUNCH_DAY_OF_YEAR;
    
    // Stop if we ran out of fresh pins or if the day is before launch
    if (index < 0 || index >= productsList.length) {
      continue;
    }
    
    // Set the specific hour for this category so pins are spaced out
    const targetDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    targetDate.setUTCHours(hourOffset, 0, 0, 0); // Sets time to e.g., 08:00:00 UTC
    
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    const product = productsList[index];
    recentItems.push({
      ...product,
      date: targetDate,
      dateStr: targetDateStr
    });
  }
  return recentItems;
}

// Generate category feeds
targetCategories.forEach((slug, index) => {
  const category = categories.find(c => c.slug === slug);
  if (!category) {
    console.warn(`Category not found: ${slug}`);
    return;
  }

  // Get all products for this category
  const categoryProducts = category.productIds
    .map(id => products.find(p => p.design_id == id))
    .filter(Boolean);

  // Spread out pins by assigning a different hour (0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20)
  const hourOffset = index * 2;
  const recentCategoryProducts = getRecentItems(categoryProducts, hourOffset);
  
  const xml = generateRssXml(
    `Black Panther Store - ${category.title}`,
    `Daily featured design for ${category.title}`,
    `${SITE_URL}/rss/${slug}.xml`,
    recentCategoryProducts,
    slug
  );

  fs.writeFileSync(path.join(RSS_DIR, `${slug}.xml`), xml);
  console.log(`✅ Created RSS feed for ${slug} (${recentCategoryProducts.length} items, scheduled ~${hourOffset}:00 UTC)`);
});

// Generate the "Social" feed (1 fully random item from across all designs based on day)
// Assign it to 22:00 UTC
const recentSocialProducts = getRecentItems(products, 22);
const socialXml = generateRssXml(
  'Black Panther Store - Social',
  'Daily featured design from all collections',
  `${SITE_URL}/rss/social.xml`,
  recentSocialProducts,
  'social'
);
fs.writeFileSync(path.join(RSS_DIR, `social.xml`), socialXml);
console.log(`✅ Created RSS feed for social (${recentSocialProducts.length} items, scheduled ~22:00 UTC)`);

console.log('Done!');
