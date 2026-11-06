import { extractDoi } from '@/features/publications/model/doi';
import { compactBibtex } from '@/features/publications/model/compact-bibtex';

const styles = new Set(['apa', 'ieee', 'bibtex']);
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const doi = extractDoi(params.get('doi') ?? '');
  const style = params.get('style') ?? '';
  if (!doi || !styles.has(style)) return Response.json({ error: 'DOI hoặc định dạng trích dẫn không hợp lệ.' }, { status: 400 });
  try {
    const url = new URL('https://citation.doi.org/format');
    url.search = new URLSearchParams({ doi, style, lang: 'en-US' }).toString();
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(12_000), next: { revalidate: 86_400 }, headers: { Accept: 'text/plain' } });
    if (!response.ok) throw new Error('Citation unavailable');
    const text = (await response.text()).trim();
    if (!text || text.length > 100_000 || /^\s*</.test(text)) throw new Error('Invalid citation response');
    return Response.json({ citation: style === 'bibtex' ? compactBibtex(text) : text }, { headers: { 'Cache-Control': 'public, max-age=86400' } });
  } catch {
    return Response.json({ error: 'Chưa tải được trích dẫn DOI.' }, { status: 502 });
  }
}
