export function parseVideoEmbedUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (['youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'youtu.be'].includes(host)) {
      const id = host === 'youtu.be' ? url.pathname.slice(1).split('/')[0] : url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/]+)/)?.[1];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === 'loom.com') {
      const id = url.pathname.match(/^\/(?:share|embed)\/([a-zA-Z0-9]+)\/?$/)?.[1];
      return id ? `https://www.loom.com/embed/${id}` : null;
    }
    if (host === 'drive.google.com') {
      const id = url.pathname.match(/^\/file\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/)?.[1];
      return id ? `https://drive.google.com/file/d/${id}/preview` : null;
    }
    return null;
  } catch { return null; }
}
