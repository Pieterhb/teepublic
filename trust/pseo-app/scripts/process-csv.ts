import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Paths
const CSV_PATH = path.join(__dirname, '../../Normalized Master Database.csv');
const OUT_DIR = path.join(__dirname, '../data');
const OUT_FILE = path.join(OUT_DIR, 'products.json');

function main() {
  console.log('Starting CSV Import & Validation...');

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`Error: CSV file not found at ${CSV_PATH}`);
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
  
  // Parse CSV
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`Parsed ${records.length} total rows from CSV.`);

  const validProducts = [];
  const slugs = new Set();
  const ids = new Set();

  let warnings = 0;

  for (let i = 0; i < records.length; i++) {
    const row = records[i] as any;
    
    // Basic structural validation
    if (!row.design_id) {
      console.warn(`[Row ${i+2}] Warning: Missing design_id. Skipping.`);
      warnings++;
      continue;
    }
    
    if (ids.has(row.design_id)) {
      console.warn(`[Row ${i+2}] Warning: Duplicate design_id (${row.design_id}). Skipping.`);
      warnings++;
      continue;
    }

    if (!row.slug) {
      console.warn(`[Row ${i+2}] Warning: Missing slug for design_id ${row.design_id}. Skipping.`);
      warnings++;
      continue;
    }

    if (slugs.has(row.slug)) {
      console.warn(`[Row ${i+2}] Warning: Duplicate slug (${row.slug}). Skipping.`);
      warnings++;
      continue;
    }

    if (!row.title) {
      console.warn(`[Row ${i+2}] Warning: Missing title for ${row.slug}.`);
      warnings++;
    }
    
    if (!row.image_url) {
      console.warn(`[Row ${i+2}] Warning: Missing image_url for ${row.slug}.`);
      warnings++;
    }

    if (!row.teepublic_url) {
      console.warn(`[Row ${i+2}] Warning: Missing teepublic_url for ${row.slug}.`);
      warnings++;
    }

    ids.add(row.design_id);
    slugs.add(row.slug);
    validProducts.push(row);
  }

  console.log(`Validation complete. ${warnings} warnings generated.`);
  console.log(`Saving ${validProducts.length} valid products to ${OUT_FILE}`);

  fs.writeFileSync(OUT_FILE, JSON.stringify(validProducts, null, 2));
  console.log('Done!');
}

main();
