import productsData from '../../data/products.json';
import categoriesData from '../../data/categories.json';
import internalLinksData from '../../data/internalLinks.json';

// Types
export interface Product {
  design_id: number | string;
  title: string;
  slug: string;
  teepublic_url: string;
  image_url: string;
  description: string;
  tags: string;
  artist: string;
  seo_title: string;
  meta_description: string;
  image_alt: string;
  primary_keyword: string;
}

export interface Category {
  title: string;
  slug: string;
  productIds: (number | string)[];
}

export const products = productsData as Product[];
export const categories = categoriesData as Category[];
export const internalLinks = internalLinksData;

export function getProductBySlug(slug: string): Product | undefined {
  return products.find(p => p.slug === slug);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find(c => c.slug === slug);
}

export function getRelatedProducts(productId: number | string): Product[] {
  const ids = (internalLinks.productToProducts as any)[productId] || [];
  return ids.map((id: number) => products.find(p => p.design_id == id)).filter(Boolean) as Product[];
}

export function getRelatedCategoriesForProduct(productId: number | string): Category[] {
  const slugs = (internalLinks.productToCategories as any)[productId] || [];
  return slugs.map((slug: string) => categories.find(c => c.slug === slug)).filter(Boolean) as Category[];
}

export function getRelatedCategoriesForCategory(slug: string): Category[] {
  const slugs = (internalLinks.categoryToCategories as any)[slug] || [];
  return slugs.map((s: string) => categories.find(c => c.slug === s)).filter(Boolean) as Category[];
}

export function getProductsForCategory(slug: string): Product[] {
  const category = getCategoryBySlug(slug);
  if (!category) return [];
  return category.productIds.map(id => products.find(p => p.design_id == id)).filter(Boolean) as Product[];
}
