import legacyRedirectsData from '../data/legacyRedirects.json';
import categoriesData from '../data/categories.json';

const legacyRedirects = legacyRedirectsData as Record<string, string>;
const categories = categoriesData as Array<{ slug: string }>;
const validCategorySlugs = new Set<string>(categories.map((c) => c.slug));

export const onRequest = async (context: any) => {
  const url = new URL(context.request.url);

  // 1. Host & Protocol Canonicalization: force apex domain and HTTPS
  const isWww = url.hostname.startsWith('www.');
  const isHttp = url.protocol === 'http:';

  if (isWww || isHttp) {
    const targetHost = url.hostname.replace(/^www\./, '');
    const redirectUrl = `https://${targetHost}${url.pathname}${url.search}`;
    return Response.redirect(redirectUrl, 301);
  }

  // Helper to resolve a product slug (exact match, dictionary lookup, or fuzzy variant)
  const resolveProductSlug = (slug: string): string | null => {
    const clean = slug.toLowerCase().trim().replace(/^\/+|\/+$/g, '');
    if (!clean) return null;

    // Direct lookup in legacy redirects map
    if (legacyRedirects[clean]) {
      return legacyRedirects[clean];
    }

    // Try hyphen / no-hyphen variants
    if (clean.endsWith('-t-shirt')) {
      const variant = clean.slice(0, -8) + '-tshirt';
      if (legacyRedirects[variant]) return legacyRedirects[variant];
      const base = clean.slice(0, -8);
      if (legacyRedirects[base]) return legacyRedirects[base];
    } else if (clean.endsWith('-tshirt')) {
      const variant = clean.slice(0, -7) + '-t-shirt';
      if (legacyRedirects[variant]) return legacyRedirects[variant];
      const base = clean.slice(0, -7);
      if (legacyRedirects[base]) return legacyRedirects[base];
    } else {
      const withDash = clean + '-t-shirt';
      if (legacyRedirects[withDash]) return legacyRedirects[withDash];
      const noDash = clean + '-tshirt';
      if (legacyRedirects[noDash]) return legacyRedirects[noDash];
    }

    return null;
  };

  // 2. Plural /designs/<slug> redirect to canonical /design/<targetSlug>
  if (url.pathname.startsWith('/designs/')) {
    const rawSlug = url.pathname.replace('/designs/', '').replace(/\/+$/, '');
    if (rawSlug) {
      const resolved = resolveProductSlug(rawSlug);
      if (resolved) {
        const targetUrl = `https://blackpantherstore.co.za/design/${resolved}${url.search}`;
        return Response.redirect(targetUrl, 301);
      }
      // If product has no equivalent, safely redirect to All Designs catalog so no traffic is lost
      return Response.redirect(`https://blackpantherstore.co.za/designs${url.search}`, 301);
    }
  }

  // 3. Singular /design/<slug> redirect if it's an alias/legacy slug
  if (url.pathname.startsWith('/design/')) {
    const rawSlug = url.pathname.replace('/design/', '').replace(/\/+$/, '');
    if (rawSlug) {
      const resolved = resolveProductSlug(rawSlug);
      // Only redirect if resolved target is different from requested slug (prevents loops)
      if (resolved && resolved !== rawSlug) {
        const targetUrl = `https://blackpantherstore.co.za/design/${resolved}${url.search}`;
        return Response.redirect(targetUrl, 301);
      }
    }
  }

  // 4. Bare /design -> /designs catalog
  if (url.pathname === '/design' || url.pathname === '/design/') {
    return Response.redirect('https://blackpantherstore.co.za/designs', 301);
  }

  // 5. Legacy collections / category URL patterns
  const collectionMatch = url.pathname.match(/^\/(?:collections|collection|category|categories)\/([^\/]+)\/?$/);
  if (collectionMatch) {
    const catSlug = collectionMatch[1].toLowerCase().trim();
    if (validCategorySlugs.has(catSlug)) {
      return Response.redirect(`https://blackpantherstore.co.za/${catSlug}${url.search}`, 301);
    }
    return Response.redirect(`https://blackpantherstore.co.za/categories${url.search}`, 301);
  }

  // 6. Pass through all standard static requests
  return context.next();
};
