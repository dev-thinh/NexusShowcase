/** DOI identifiers retain their complete 10.<registrant>/<suffix> form. */
export function extractDoi(value: string): string | null {
  let identifier = value.trim().replace(/^doi:\s*/i, '');
  if (/^(?:https?:\/\/)?(?:dx\.|www\.)?doi\.org\//i.test(identifier)) {
    try {
      const url = new URL(/^https?:/i.test(identifier) ? identifier : `https://${identifier}`);
      if (url.username || url.password || url.port) return null;
      identifier = decodeURIComponent(url.pathname.slice(1));
    } catch { return null; }
  }
  return identifier.length <= 2048 && /^10\.\d{4,9}\/[^\s\u0000-\u001f\u007f]+$/i.test(identifier) ? identifier : null;
}

export function normalizePaperUrl(value: string): string {
  const doi = extractDoi(value);
  return doi ? `https://doi.org/${doi.split('/').map(encodeURIComponent).join('/')}` : value.trim();
}
