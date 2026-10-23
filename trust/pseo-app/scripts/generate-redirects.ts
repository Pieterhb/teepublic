import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const DATA_DIR = path.join(__dirname, '../data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const CSV_FILE = path.join(__dirname, '../../Master Database.csv');
const NORM_CSV_FILE = path.join(__dirname, '../../Normalized Master Database.csv');
const OUT_FILE = path.join(DATA_DIR, 'legacyRedirects.json');
const VALID_SLUGS_FILE = path.join(DATA_DIR, 'validProductSlugs.json');

function main() {
  console.log('Generating legacy redirects mapping...');
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
  const validProductSlugs = new Set<string>(products.map((p: any) => p.slug));
  const mapping: Record<string, string> = {};

  const register = (source: string, target: string) => {
    if (!source || !target) return;
    const s = source.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
    const t = target.trim().replace(/^\/+|\/+$/g, '');
    if (!s || !t || s === t) return;
    // CRITICAL SEO FIX: If source slug is already an active, valid product, NEVER redirect it!
    if (validProductSlugs.has(s)) return;
    if (validProductSlugs.has(t)) {
      if (!mapping[s]) {
        mapping[s] = t;
      }
    }
  };

  const processCanonical = (canonicalUrl: string, targetSlug: string) => {
    if (!canonicalUrl) return;
    const clean = canonicalUrl.replace('/designs/', '').replace(/^\/+|\/+$/g, '');
    if (!clean) return;

    register(clean, targetSlug);

    if (clean.endsWith('-t-shirt')) {
      const base = clean.slice(0, -8);
      register(base + '-tshirt', targetSlug);
      register(base, targetSlug);
    } else if (clean.endsWith('-tshirt')) {
      const base = clean.slice(0, -7);
      register(base + '-t-shirt', targetSlug);
      register(base, targetSlug);
    } else {
      register(clean + '-tshirt', targetSlug);
      register(clean + '-t-shirt', targetSlug);
    }
  };

  const processTargetSlug = (targetSlug: string) => {
    if (!targetSlug) return;
    if (targetSlug.endsWith('-t-shirt')) {
      const base = targetSlug.slice(0, -8);
      register(base + '-tshirt', targetSlug);
      register(base, targetSlug);
    } else if (targetSlug.endsWith('-tshirt')) {
      const base = targetSlug.slice(0, -7);
      register(base + '-t-shirt', targetSlug);
      register(base, targetSlug);
    } else {
      register(targetSlug + '-tshirt', targetSlug);
      register(targetSlug + '-t-shirt', targetSlug);
    }
  };

  // 1. Process Master Database CSV files
  [CSV_FILE, NORM_CSV_FILE].forEach((csvPath) => {
    if (fs.existsSync(csvPath)) {
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const records = parse(csvContent, { columns: true, skip_empty_lines: true });
      records.forEach((r: any) => {
        const targetSlug = (r.slug || '').trim();
        if (!validProductSlugs.has(targetSlug)) return;
        const cUrl = (r.canonical_url || '').trim();
        processCanonical(cUrl, targetSlug);
        processTargetSlug(targetSlug);
      });
    }
  });

  // 2. Process products.json
  products.forEach((p: any) => {
    const targetSlug = (p.slug || '').trim();
    if (!validProductSlugs.has(targetSlug)) return;
    const cUrl = (p.canonical_url || '').trim();
    processCanonical(cUrl, targetSlug);
    processTargetSlug(targetSlug);
  });

  fs.writeFileSync(OUT_FILE, JSON.stringify(mapping, null, 2), 'utf-8');
  fs.writeFileSync(VALID_SLUGS_FILE, JSON.stringify(Array.from(validProductSlugs), null, 2), 'utf-8');
  console.log(`Generated ${Object.keys(mapping).length} legacy redirects to ${OUT_FILE}`);
  console.log(`Saved ${validProductSlugs.size} valid product slugs to ${VALID_SLUGS_FILE}`);
}

main();
