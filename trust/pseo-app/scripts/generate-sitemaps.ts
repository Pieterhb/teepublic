import fs from 'fs';
import path from 'path';

const DOMAIN = 'https://blackpantherstore.co.za';
const PUBLIC_DIR = path.join(__dirname, '../public');
const DATA_DIR = path.join(__dirname, '../data');

function generateSitemapItem(url: string, lastmod: string, changefreq: string = 'weekly', priority: string = '0.7') {
  return `  <url>\n    <loc>${url}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function main() {
  console.log('Generating Sitemaps...');

  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  const products = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'products.json'), 'utf-8'));
  const categories = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'categories.json'), 'utf-8'));
  const today = new Date().toISOString().split('T')[0];

  // 1. Generate Static Pages Sitemap
  const staticPages = [
    { url: `${DOMAIN}`, changefreq: 'daily', priority: '1.0' },
    { url: `${DOMAIN}/designs`, changefreq: 'daily', priority: '0.9' },
    { url: `${DOMAIN}/categories`, changefreq: 'weekly', priority: '0.9' },
    { url: `${DOMAIN}/privacy-policy`, changefreq: 'monthly', priority: '0.3' },
  ];

  let pagesXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  staticPages.forEach((p) => {
    pagesXml += `  <url>\n    <loc>${p.url}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>\n`;
  });
  pagesXml += `</urlset>`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-pages.xml'), pagesXml);

  // 2. Generate Categories Sitemap
  let catXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  categories.forEach((c: any) => {
    catXml += generateSitemapItem(`${DOMAIN}/${c.slug}`, today, 'weekly', '0.8') + '\n';
  });
  catXml += `</urlset>`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-categories.xml'), catXml);
  
  // 3. Generate Products Sitemaps (Split every 2000 to keep them small)
  const productSitemaps = [];
  const chunkSize = 2000;
  for (let i = 0; i < products.length; i += chunkSize) {
    const chunk = products.slice(i, i + chunkSize);
    let pXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    chunk.forEach((p: any) => {
      pXml += generateSitemapItem(`${DOMAIN}/design/${p.slug}`, today, 'weekly', '0.7') + '\n';
    });
    pXml += `</urlset>`;
    const name = `sitemap-products-${Math.floor(i / chunkSize) + 1}.xml`;
    fs.writeFileSync(path.join(PUBLIC_DIR, name), pXml);
    productSitemaps.push(name);
  }

  // 4. Generate Sitemap Index
  let indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  const allSitemaps = ['sitemap-pages.xml', 'sitemap-categories.xml', ...productSitemaps];
  allSitemaps.forEach(sm => {
    indexXml += `  <sitemap>\n    <loc>${DOMAIN}/${sm}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;
  });
  
  indexXml += `</sitemapindex>`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), indexXml);

  console.log(`Generated Sitemap Index with ${allSitemaps.length} sitemaps.`);
}

main();
