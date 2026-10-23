import legacyRedirectsData from '../data/legacyRedirects.json';
import categoriesData from '../data/categories.json';
import validProductSlugsData from '../data/validProductSlugs.json';

const legacyRedirects = legacyRedirectsData as Record<string, string>;
const categories = categoriesData as Array<{ slug: string }>;
const validCategorySlugs = new Set<string>(categories.map((c) => c.slug));
const validProductSlugs = new Set<string>(validProductSlugsData as string[]);

export const onRequest = async (context: any) => {
  const url = new URL(context.request.url);

  // Helper to resolve a product slug (exact match, dictionary lookup, or fuzzy variant)
  const resolveProductSlug = (slug: string): string | null => {
    const clean = slug.toLowerCase().trim().replace(/^\/+|\/+$/g, '');
    if (!clean) return null;

    // If it's already an active, valid product slug, return it directly
    if (validProductSlugs.has(clean)) {
      return clean;
    }

    // Direct lookup in legacy redirects map
    if (legacyRedirects[clean]) {
      return legacyRedirects[clean];
    }

    // Try hyphen / no-hyphen variants
    if (clean.endsWith('-t-shirt')) {
      const variant = clean.slice(0, -8) + '-tshirt';
      if (validProductSlugs.has(variant)) return variant;
      if (legacyRedirects[variant]) return legacyRedirects[variant];
      const base = clean.slice(0, -8);
      if (validProductSlugs.has(base)) return base;
      if (legacyRedirects[base]) return legacyRedirects[base];
    } else if (clean.endsWith('-tshirt')) {
      const variant = clean.slice(0, -7) + '-t-shirt';
      if (validProductSlugs.has(variant)) return variant;
      if (legacyRedirects[variant]) return legacyRedirects[variant];
      const base = clean.slice(0, -7);
      if (validProductSlugs.has(base)) return base;
      if (legacyRedirects[base]) return legacyRedirects[base];
    } else {
      const withDash = clean + '-t-shirt';
      if (validProductSlugs.has(withDash)) return withDash;
      if (legacyRedirects[withDash]) return legacyRedirects[withDash];
      const noDash = clean + '-tshirt';
      if (validProductSlugs.has(noDash)) return noDash;
      if (legacyRedirects[noDash]) return legacyRedirects[noDash];
    }

    return null;
  };

  // Determine if a canonical path rewrite is needed
  let targetPath: string | null = null;

  // 1. Plural /designs/<slug> redirect to canonical /design/<targetSlug>
  if (url.pathname.startsWith('/designs/')) {
    const rawSlug = url.pathname.replace('/designs/', '').replace(/\/+$/, '');
    if (rawSlug) {
      const resolved = resolveProductSlug(rawSlug);
      if (resolved) {
        targetPath = `/design/${resolved}`;
      } else {
        // If product has no equivalent, safely redirect to All Designs catalog so no traffic is lost
        targetPath = '/designs';
      }
    }
  }

  // 2. Singular /design/<slug> redirect if it's an alias/legacy slug
  else if (url.pathname.startsWith('/design/')) {
    const rawSlug = url.pathname.replace('/design/', '').replace(/\/+$/, '');
    if (rawSlug) {
      // If rawSlug is already an active valid product, NEVER redirect it!
      if (!validProductSlugs.has(rawSlug)) {
        const resolved = resolveProductSlug(rawSlug);
        // Only redirect if resolved target is different from requested slug (prevents loops)
        if (resolved && resolved !== rawSlug) {
          targetPath = `/design/${resolved}`;
        }
      }
    }
  }

  // 3. Bare /design -> /designs catalog
  else if (url.pathname === '/design' || url.pathname === '/design/') {
    targetPath = '/designs';
  }

  // 4. Legacy collections / category URL patterns
  else {
    const collectionMatch = url.pathname.match(/^\/(?:collections|collection|category|categories)\/([^\/]+)\/?$/);
    if (collectionMatch) {
      const catSlug = collectionMatch[1].toLowerCase().trim();
      if (validCategorySlugs.has(catSlug)) {
        targetPath = `/${catSlug}`;
      } else {
        targetPath = '/categories';
      }
    }
  }

  // 5. Consolidated Canonicalization (Apex Domain + HTTPS + Path) in a SINGLE 301 HOP
  // Eliminates 2-hop redirect chains (e.g., http://www -> https -> path redirect)
  const isWww = url.hostname.startsWith('www.');
  const isHttp = url.protocol === 'http:';
  const hasPathChange = targetPath !== null && targetPath !== url.pathname;

  if (isWww || isHttp || hasPathChange) {
    const finalPath = targetPath ?? url.pathname;
    const redirectUrl = `https://blackpantherstore.co.za${finalPath}${url.search}`;
    return Response.redirect(redirectUrl, 301);
  }

  // 6. Pass through all standard static requests
  return context.next();
};
