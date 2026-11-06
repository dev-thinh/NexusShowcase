import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const checkerUrl = pathToFileURL(path.resolve('scripts/check-i18n.mjs')).href;
const { auditI18n } = await import(checkerUrl);
const roots: string[] = [];
function fixture(dictionary: Record<string, string>, source: string) {
  const root = mkdtempSync(path.join(tmpdir(), 'nexus-i18n-'));
  roots.push(root);
  const messages = path.join(root, 'src/shared/i18n/messages');
  mkdirSync(messages, { recursive: true });
  writeFileSync(path.join(messages, 'fixture.en.json'), JSON.stringify(dictionary));
  writeFileSync(path.join(root, 'src/page.tsx'), source);
  return root;
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

describe('i18n coverage audit', () => {
  it('reports literal missing keys with file context while preserving dynamic values', () => {
    const root = fixture({ 'Xin chào': 'Hello' }, 't("Xin chào"); tr("Thiếu"); tr(article.title);');
    expect(auditI18n(root).missingKeys).toEqual([{ file: path.join('src', 'page.tsx'), line: 1, key: 'Thiếu' }]);
  });
  it('normalizes whitespace for both dictionary keys and source literals', () => {
    const root = fixture({ ' Xin   chào ': 'Hello' }, 'tr("  Xin \\n chào  ");');
    expect(auditI18n(root).missingKeys).toEqual([]);
  });
  it('requires identical placeholder numbers and occurrence counts, allowing reordering', () => {
    const root = fixture({ 'Ảnh {0} {1}': 'Photo {1} {0}', 'Bài {0} {0}': 'Post {0}', 'Năm {0}': 'Year {1}' }, '');
    expect(auditI18n(root).placeholderMismatches.map((item: { key: string }) => item.key)).toEqual(['Bài {0} {0}', 'Năm {0}']);
  });
  it('excludes test fixtures and does not treat ordinary string literals as translation calls', () => {
    const root = fixture({}, 'const title = "Untranslated user title";');
    mkdirSync(path.join(root, 'src/__fixtures__'));
    writeFileSync(path.join(root, 'src/__fixtures__/sample.ts'), 'tr("Fixture only");');
    writeFileSync(path.join(root, 'src/page.test.ts'), 't("Test only");');
    expect(auditI18n(root).missingKeys).toEqual([]);
  });
});
