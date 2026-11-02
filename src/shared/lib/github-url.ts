export function isGithubUrl(value: string) {
  try { const url = new URL(value); return url.protocol === 'https:' && url.hostname.toLowerCase() === 'github.com' && !url.username && !url.password && !url.port && url.pathname.split('/').filter(Boolean).length >= 2; } catch { return false; }
}
