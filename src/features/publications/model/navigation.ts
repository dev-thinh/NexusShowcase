import { legacyPageRedirects } from '@/shared/lib/page-urls';

export function showcaseHref(slug: string, returnTo?: string) {
  const path = `/works/${slug}`;
  return returnTo ? `${path}?returnTo=${encodeURIComponent(returnTo)}` : path;
}

export function showcaseReturnTarget(raw: string | undefined, fallback: string) {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return fallback;
  try {
    const url = new URL(raw, 'https://nexus.local');
    if (url.origin !== 'https://nexus.local') return fallback;
    const alias = legacyPageRedirects.find(route => route.source === url.pathname);
    if (alias) url.pathname = alias.destination;
    if (url.pathname === '/') return url.pathname + url.search;
    if (['/research', '/projects'].includes(url.pathname)) return url.pathname + url.search;
  } catch { /* Fall back to the item's category for an invalid source. */ }
  return fallback;
}
