import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const INTERNAL_LINKS_FILE = path.join(DATA_DIR, 'internalLinks.json');

const MIN_PRODUCTS_PER_PAGE = 5;

// Helpers to format slug and title
function sluggify(text: string) {
  if (!text) return '';
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function titleCase(text: string) {
  if (!text) return '';
  return text
    .trim()
    .split(/\s+/)
    .map(word => {
      if (word.includes('-')) {
        return word.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join('-');
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function main() {
  console.log('Starting Taxonomy & Linking Generation...');

  if (!fs.existsSync(PRODUCTS_FILE)) {
    console.error('products.json not found! Run process-csv.ts first.');
    process.exit(1);
  }

  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
  
  // 1. Build Category Pages
  const categoryMap = new Map<string, { title: string, slug: string, products: any[] }>();

  function addProductToCategory(product: any, rawTitle: string, suffix: string = 'Shirts') {
    if (!rawTitle || rawTitle.trim() === '' || rawTitle.toLowerCase() === 'nan') return;
    const formattedRaw = titleCase(rawTitle);
    const title = suffix ? `${formattedRaw} ${suffix}`.trim() : formattedRaw;
    const slug = sluggify(title);
    if (!categoryMap.has(slug)) {
      categoryMap.set(slug, { title, slug, products: [] });
    }
    categoryMap.get(slug)!.products.push(product);
  }

  // Iterate and build groups
  products.forEach((p: any) => {
    // Basic groupings
    addProductToCategory(p, p.niche);
    addProductToCategory(p, p.secondary_niche);
    addProductToCategory(p, p.recipient, 'Gifts');
    addProductToCategory(p, p.occasion);
    addProductToCategory(p, p.theme);
    addProductToCategory(p, p.style);
    
    // Combinations (e.g. Funny + Electrician)
    if (p.style && p.niche && p.style.toLowerCase() !== 'nan' && p.niche.toLowerCase() !== 'nan') {
      addProductToCategory(p, `${p.style} ${p.niche}`);
    }
    if (p.niche && p.recipient && p.niche.toLowerCase() !== 'nan' && p.recipient.toLowerCase() !== 'nan') {
      addProductToCategory(p, `${p.niche} Gifts for ${p.recipient}`, '');
    }
    
    // By primary keyword
    addProductToCategory(p, p.primary_keyword, '');
  });

  // Filter categories by minimum products
  const validCategories = Array.from(categoryMap.values()).filter(c => c.products.length >= MIN_PRODUCTS_PER_PAGE);
  console.log(`Generated ${validCategories.length} valid category pages (min ${MIN_PRODUCTS_PER_PAGE} products).`);

  // Strip full product object from category to just save IDs to reduce file size
  const categoriesToSave = validCategories.map(c => ({
    title: c.title,
    slug: c.slug,
    productIds: c.products.map(p => p.design_id)
  }));
  
  fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categoriesToSave, null, 2));

  // 2. Build Internal Linking Graph
  console.log('Calculating related products (Scoring)...');
  const internalLinks = {
    productToProducts: {} as Record<string, string[]>,
    productToCategories: {} as Record<string, string[]>,
    categoryToCategories: {} as Record<string, string[]>
  };

  // Score related products for each product
  // To avoid O(N^2) fully, we can limit the comparison to products in the same niche or theme
  const nicheMap = new Map<string, any[]>();
  products.forEach((p: any) => {
    const niche = p.niche || 'General';
    if (!nicheMap.has(niche)) nicheMap.set(niche, []);
    nicheMap.get(niche)!.push(p);
  });

  products.forEach((p: any) => {
    const pNiche = p.niche || 'General';
    const pool = nicheMap.get(pNiche) || [];
    
    // Calculate score
    const scored = pool.map(other => {
      let score = 0;
      if (p.design_id === other.design_id) return { id: other.design_id, score: -1 };
      
      if (p.secondary_niche === other.secondary_niche) score += 2;
      if (p.theme === other.theme) score += 2;
      if (p.style === other.style) score += 1;
      if (p.recipient === other.recipient) score += 1;
      
      return { id: other.design_id, score };
    }).filter(x => x.score > -1)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8); // top 8 related products
      
    internalLinks.productToProducts[p.design_id] = scored.map(s => s.id);
    
    // Product to Categories (find up to 5 categories this product belongs to)
    const belongsTo = validCategories.filter(c => c.products.some(cp => cp.design_id === p.design_id));
    internalLinks.productToCategories[p.design_id] = belongsTo.slice(0, 5).map(c => c.slug);
  });

  // Category to Category links (share the most products)
  console.log('Calculating related categories...');
  validCategories.forEach(c => {
    const related = validCategories.map(other => {
      if (c.slug === other.slug) return { slug: other.slug, score: -1 };
      const sharedCount = c.products.filter(p => other.products.some(op => op.design_id === p.design_id)).length;
      return { slug: other.slug, score: sharedCount };
    }).filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // top 10 related categories
      
    internalLinks.categoryToCategories[c.slug] = related.map(r => r.slug);
  });

  fs.writeFileSync(INTERNAL_LINKS_FILE, JSON.stringify(internalLinks, null, 2));
  console.log('Taxonomy & Internal Linking Generation Complete!');
}

main();
