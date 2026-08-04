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

function generateRssXml(title, description, feedUrl, item, categorySlug) {
  const rssItem = `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${SITE_URL}/design/${item.slug}</link>
      <description><![CDATA[
        <img src="${item.image_url}" alt="${item.image_alt}" />
        <p>${item.description}</p>
      ]]></description>
      <pubDate>${now.toUTCString()}</pubDate>
      <!-- The GUID contains today's date so Pinterest knows it's a new daily pin -->
      <guid isPermaLink="false">${categorySlug}-${item.design_id}-${todayDateStr}</guid>
    </item>
  `;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${title}</title>
    <link>${SITE_URL}</link>
    <description>${description}</description>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
    ${rssItem}
  </channel>
</rss>`;
}

console.log('Generating RSS feeds for Pinterest (1 item per day)...');
console.log(`Today is day ${dayOfYear} of the year.`);

// Generate category feeds
for (const slug of targetCategories) {
  const category = categories.find(c => c.slug === slug);
  if (!category) {
    console.warn(`Category not found: ${slug}`);
    continue;
  }

  // Get all products for this category
  const categoryProducts = category.productIds
    .map(id => products.find(p => p.design_id == id))
    .filter(Boolean);

  // 2. Pick exactly 1 product based on the day of the year
  const todayProduct = categoryProducts[dayOfYear % categoryProducts.length];
  
  const xml = generateRssXml(
    `Black Panther Store - ${category.title}`,
    `Daily featured design for ${category.title}`,
    `${SITE_URL}/rss/${slug}.xml`,
    todayProduct,
    slug
  );

  fs.writeFileSync(path.join(RSS_DIR, `${slug}.xml`), xml);
  console.log(`✅ Created RSS feed for ${slug} (1 item)`);
}

// Generate the "Social" feed (1 fully random item from across all designs based on day)
const socialProduct = products[dayOfYear % products.length];
const socialXml = generateRssXml(
  'Black Panther Store - Social',
  'Daily featured design from all collections',
  `${SITE_URL}/rss/social.xml`,
  socialProduct,
  'social'
);
fs.writeFileSync(path.join(RSS_DIR, `social.xml`), socialXml);
console.log(`✅ Created RSS feed for social (1 item)`);

console.log('Done!');
