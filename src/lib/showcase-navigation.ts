export function showcaseHref(slug: string, returnTo?: string) {
  const path = `/showcase/${slug}`;
  return returnTo ? `${path}?returnTo=${encodeURIComponent(returnTo)}` : path;
}

export function showcaseReturnTarget(raw: string | undefined, fallback: string) {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return fallback;
  try {
    const url = new URL(raw, 'https://nexus.local');
    if (url.origin !== 'https://nexus.local') return fallback;
    if (url.pathname === '/') return url.pathname + url.search;
    if (['/category/bai-bao-khoa-hoc', '/category/robotics-iot'].includes(url.pathname)) return url.pathname + url.search;
  } catch { /* Fall back to the item's category for an invalid source. */ }
  return fallback;
}
