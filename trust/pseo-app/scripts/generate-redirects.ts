import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const DATA_DIR = path.join(__dirname, '../data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const CSV_FILE = path.join(__dirname, '../../Master Database.csv');
const OUT_FILE = path.join(DATA_DIR, 'legacyRedirects.json');

function main() {
  console.log('Generating legacy redirects mapping...');
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
  const mapping: Record<string, string> = {};

  if (fs.existsSync(CSV_FILE)) {
    const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
    const records = parse(csvContent, { columns: true, skip_empty_lines: true });
    records.forEach((r: any) => {
      const targetSlug = (r.slug || '').trim();
      if (!targetSlug) return;
      const cUrl = (r.canonical_url || '').trim();
      if (cUrl) {
        const cleanC = cUrl.replace('/designs/', '').replace(/^\/+|\/+$/g, '');
        if (cleanC) {
          mapping[cleanC] = targetSlug;
        }
      }
    });
  }

  // Ensure all current product slugs are also mapped
  products.forEach((p: any) => {
    const slug = (p.slug || '').trim();
    if (slug && !mapping[slug]) {
      mapping[slug] = slug;
    }
  });

  fs.writeFileSync(OUT_FILE, JSON.stringify(mapping, null, 2), 'utf-8');
  console.log(`Generated ${Object.keys(mapping).length} legacy redirects to ${OUT_FILE}`);
}

main();
