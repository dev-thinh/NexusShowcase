import { afterEach, expect, it, vi } from 'vitest';
import { extractDoi, normalizePaperUrl } from '@/features/publications/model/doi';
import { compactBibtex } from '@/features/publications/model/compact-bibtex';
import { conferenceSchema } from '@/features/publications/model/conference';
import { showcaseDraftInputSchema } from '@/features/submissions/model/input';
import { GET } from '@/app/api/citation/route';

afterEach(() => vi.unstubAllGlobals());
it.each(['10.1234/paper.567', 'doi:10.1234/paper.567', 'https://doi.org/10.1234/paper.567', 'http://dx.doi.org/10.1234/paper.567'])('normalizes a complete DOI from %s', value => {
  expect(extractDoi(value)).toBe('10.1234/paper.567');
  expect(normalizePaperUrl(value)).toBe('https://doi.org/10.1234/paper.567');
});
it('encodes legacy DOI punctuation safely without losing the identifier', () => {
  const value = '10.1002/(SICI)1097-4571(199810)49:13<1234::AID>3.0.CO;2-X';
  expect(extractDoi(normalizePaperUrl(value))).toBe(value);
});
it('accepts DOI identifiers in publication and draft schemas without changing ordinary URLs', () => {
  expect(conferenceSchema.parse({ name: 'Journal', paperUrl: '10.1234/paper' }).paperUrl).toBe('https://doi.org/10.1234/paper');
  for (const paperUrl of ['10.1234/paper', 'doi:10.1234/paper', 'https://doi.org/10.1234/paper']) {
    expect(showcaseDraftInputSchema.parse({ title: 'Draft', conference: { name: 'Journal', status: 'PUBLISHED', paperUrl } })).toMatchObject({ citationEnabled: true, conference: { paperUrl: 'https://doi.org/10.1234/paper' } });
  }
  expect(normalizePaperUrl('https://publisher.example/paper')).toBe('https://publisher.example/paper');
  expect(extractDoi('paper.567')).toBeNull();
});
it('retains meaningful nested BibTeX fields and removes duplicate URL and unrelated metadata', () => {
  const output = compactBibtex('@article{key, title={A {Nested, title}}, author={Smith, John}, DOI={10.1234/paper}, journal={Journal}, pages={11–12}, url={http://dx.doi.org/10.1234/paper}, language={en}, publisher={Publisher}, organization={Club}}');
  expect(output).toContain('title = {A {Nested, title}}');
  expect(output).toContain('doi = {10.1234/paper}');
  expect(output).toContain('pages = {11--12}');
  for (const field of ['url =', 'language =', 'publisher =', 'organization =']) expect(output).not.toContain(field);
});
it('rejects malformed DOI and unsupported formats before fetching any external URL', async () => {
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
  for (const query of ['doi=12345&style=apa', 'doi=10.1234/paper&style=arbitrary', 'doi=https://attacker.example/10.1234/paper&style=apa']) expect((await GET(new Request(`http://localhost/api/citation?${query}`))).status).toBe(400);
  expect(fetcher).not.toHaveBeenCalled();
});
it('uses the fixed DOI Foundation service and caches successful formatted citations', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response('Author. (2025). Paper. https://doi.org/10.1234/paper'));
  vi.stubGlobal('fetch', fetcher);
  const response = await GET(new Request('http://localhost/api/citation?doi=10.1234/paper&style=apa'));
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toContain('max-age=86400');
  const [url, options] = fetcher.mock.calls[0];
  expect(new URL(String(url)).origin).toBe('https://citation.doi.org');
  expect(options.redirect).toBe('error');
  expect((await response.json()).citation).toContain('Author. (2025).');
});
it('reports provider failures without leaking response content', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('private service diagnostic', { status: 500 })));
  const response = await GET(new Request('http://localhost/api/citation?doi=10.1234/paper&style=apa'));
  expect(response.status).toBe(502);
  expect(await response.text()).not.toContain('private service diagnostic');
});
