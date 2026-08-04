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

function generateRssXml(title, description, feedUrl, items) {
  const rssItems = items.map(product => `
    <item>
      <title><![CDATA[${product.title}]]></title>
      <link>${SITE_URL}/design/${product.slug}</link>
      <description><![CDATA[
        <img src="${product.image_url}" alt="${product.image_alt}" />
        <p>${product.description}</p>
      ]]></description>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <guid isPermaLink="false">${product.design_id}-${new Date().getTime()}</guid>
    </item>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${title}</title>
    <link>${SITE_URL}</link>
    <description>${description}</description>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${rssItems}
  </channel>
</rss>`;
}

function getRandomItems(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

console.log('Generating RSS feeds for Pinterest...');

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

  // Pick 10 random products
  const randomProducts = getRandomItems(categoryProducts, 10);
  
  const xml = generateRssXml(
    `Black Panther Store - ${category.title}`,
    `Top 10 daily random designs for ${category.title}`,
    `${SITE_URL}/rss/${slug}.xml`,
    randomProducts
  );

  fs.writeFileSync(path.join(RSS_DIR, `${slug}.xml`), xml);
  console.log(`✅ Created RSS feed for ${slug}`);
}

// Generate the "Social" feed (10 fully random items across all designs)
const socialProducts = getRandomItems(products, 10);
const socialXml = generateRssXml(
  'Black Panther Store - Social',
  'Top 10 daily random designs from all collections',
  `${SITE_URL}/rss/social.xml`,
  socialProducts
);
fs.writeFileSync(path.join(RSS_DIR, `social.xml`), socialXml);
console.log(`✅ Created RSS feed for social`);

console.log('Done!');
