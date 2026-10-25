import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { auditAssetReferences } from '../../scripts/audit-asset-references';
import { auditUnused } from '../../scripts/audit-unused.mjs';
const roots: string[] = [];
function fixture(files: Record<string, string>) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-unused-')); roots.push(root);
  for (const [file, content] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), content); }
  return root;
}
afterEach(() => {
  for (const root of roots.splice(0)) {
    if (path.dirname(root) !== path.resolve(os.tmpdir()) || !path.basename(root).startsWith('nexus-unused-')) throw Error('Invalid cleanup target');
    fs.rmSync(root, { recursive: true, force: true });
  }
});
it('retains npm/config/literal dynamic imports and warns on computed imports', () => {
  const root = fixture({ 'package.json': JSON.stringify({ scripts: { tool: 'tsx scripts/tool.ts' } }), 'scripts/tool.ts': "import '../src/tool';", 'next.config.ts': "import './src/config-only';", 'src/tool.ts': 'export const used = true;', 'src/config-only.ts': 'export default {};', 'src/app/page.tsx': "import('../lazy'); import(variable); export default function Page() {}", 'src/lazy.ts': 'export default true;', 'src/orphan.ts': 'export const orphan = true;' });
  const audit = auditUnused(root);
  expect(audit.unreachableFiles).toEqual(['src/orphan.ts']);
  expect(audit.dynamicReferenceWarnings).toContain('src/app/page.tsx');
});
it('recognizes named exports consumed by deferred module imports', () => {
  const root = fixture({
    'src/app/page.tsx': "export default async function Page() { const { Gallery } = await import('../gallery'); return Gallery(); }",
    'src/gallery.ts': 'export function Gallery() { return null; }',
  });
  expect(auditUnused(root).unusedExports).toEqual([]);
});
it('retains files referenced only by revision history, drafts, overrides, avatars or galleries', async () => {
  const root = fixture(Object.fromEntries(['history.png', 'draft.png', 'editor.png', 'avatar.png', 'home.png', 'research.png', 'orphan.png'].map(name => [`public/uploads/thumbnails/${name}`, 'asset'])));
  const db = {
    user: { findMany: async () => [{ avatarUrl: '/uploads/thumbnails/avatar.png?v=1' }] },
    showcaseItem: { findMany: async () => [{ authorDraft: { content: 'nexus-sections:v1\n' + JSON.stringify({ url: '/uploads/thumbnails/draft.png#figure' }) } }] },
    itemLink: { findMany: async () => [] }, itemAttachment: { findMany: async () => [] },
    submissionRevision: { findMany: async () => [{ snapshot: { url: '/uploads/thumbnails/history.png' } }] },
    editorialDraft: { findMany: async () => [{ overrides: { thumbnailUrl: '/uploads/thumbnails/editor.png' } }] },
    homeMomentsGallery: { findMany: async () => [
      { photos: [{ src: '/uploads/thumbnails/home.png' }] },
      { photos: [{ src: '/uploads/thumbnails/research.png' }] },
    ] },
  };
  const audit = await auditAssetReferences({ prisma: db as never, root });
  expect(audit.incompleteSources).toEqual([]);
  for (const name of ['history', 'draft', 'editor', 'avatar', 'home', 'research']) expect(audit.referenced).toContain(`/uploads/thumbnails/${name}.png`);
  expect(audit.unreferenced).toEqual(['/uploads/thumbnails/orphan.png']);
});
it('marks the asset inventory incomplete when galleries cannot be read', async () => {
  const root = fixture({ 'public/uploads/thumbnails/gallery.png': 'asset' });
  const empty = { findMany: async () => [] };
  const db = {
    user: empty, showcaseItem: empty, itemLink: empty, itemAttachment: empty,
    submissionRevision: empty, editorialDraft: empty,
    homeMomentsGallery: { findMany: async () => { throw new Error('Gallery unavailable'); } },
  };
  const audit = await auditAssetReferences({ prisma: db as never, root });
  expect(audit.incompleteSources).toEqual(['gallery.photos']);
  expect(audit.unreferenced).toEqual(['/uploads/thumbnails/gallery.png']);
  expect(fs.readFileSync(path.join(root, 'public/uploads/thumbnails/gallery.png'), 'utf8')).toBe('asset');
});
