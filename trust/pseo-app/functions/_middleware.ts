import legacyRedirectsData from '../data/legacyRedirects.json';

const legacyRedirects = legacyRedirectsData as Record<string, string>;

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

  // 2. Legacy /designs/<slug> redirect to canonical /design/<targetSlug>
  if (url.pathname.startsWith('/designs/')) {
    const rawSlug = url.pathname.replace('/designs/', '').replace(/\/+$/, '');
    if (rawSlug) {
      // Lookup in legacy redirects map, fallback to same slug under /design/
      const targetSlug = legacyRedirects[rawSlug] || rawSlug;
      const targetUrl = `https://blackpantherstore.co.za/design/${targetSlug}${url.search}`;
      return Response.redirect(targetUrl, 301);
    }
  }

  // 3. Pass through all standard static requests
  return context.next();
};
