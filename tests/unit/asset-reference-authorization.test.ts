import { beforeEach, expect, it, vi } from 'vitest';
import type { Actor } from '@/features/identity/model/session';
const mocks = vi.hoisted(() => ({ registry: vi.fn(), rows: vi.fn(), create: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/features/assets/server/registry', () => ({ findRegisteredAsset: mocks.registry }));
vi.mock('@/server/db/prisma', () => ({ prisma: { $queryRaw: mocks.rows, showcaseItem: { create: mocks.create }, homeMomentsGallery: { findMany: async () => [] }, user: { findFirst: async () => null } } }));
vi.mock('@/features/identity/server/actor', () => ({ getActor: async () => null }));
import { saveDraftCommand } from '@/features/submissions/server/draft-commands';
const actor: Actor = { id: 'author', fullName: 'Author', role: 'CORE_MEMBER', status: 'ACTIVE', mustChangePassword: false };
beforeEach(() => { vi.resetAllMocks(); mocks.registry.mockResolvedValue({ ownerId: 'victim', private: true }); mocks.rows.mockResolvedValue([]); mocks.create.mockResolvedValue({ id: 'new', slug: 'new', status: 'DRAFT', reviewVersion: 0 }); });
it.each(['thumbnail', 'resource', 'encoded-content'] as const)('blocks private asset laundering through %s before draft creation', async placement => {
  const url = placement === 'thumbnail' ? '/uploads/thumbnails/victim.png' : '/uploads/documents/victim.pdf';
  const draft = { title: 'Attempt', ...(placement === 'thumbnail' ? { thumbnailUrl: url } : placement === 'resource' ? { resources: [{ kind: 'DOCUMENT', label: 'File', url }] } : { content: url.replaceAll('/', '%252F') }) };
  expect(await saveDraftCommand(actor, { itemId: null, draft })).toMatchObject({ success: false, code: 'FORBIDDEN' });
  expect(mocks.create).not.toHaveBeenCalled();
});
it('allows the caller to reference an upload they own', async () => {
  mocks.registry.mockResolvedValue({ ownerId: actor.id, private: true });
  expect(await saveDraftCommand(actor, { itemId: null, draft: { title: 'Own', thumbnailUrl: '/uploads/thumbnails/own.png' } })).toMatchObject({ success: true });
});
it('allows existing public assets to be reused', async () => {
  mocks.rows.mockResolvedValue([{ creatorId: 'other', status: 'PUBLISHED', visibility: 'PUBLIC', live: ['/uploads/documents/public.pdf'], drafts: [] }]);
  expect(await saveDraftCommand(actor, { itemId: null, draft: { title: 'Public', content: '/uploads/documents/public.pdf' } })).toMatchObject({ success: true });
});
it('denies foreign historical references', async () => {
  mocks.rows.mockResolvedValue([{ creatorId: 'other', status: 'PUBLISHED', visibility: 'PUBLIC', live: [], drafts: ['/uploads/documents/history.pdf'] }]);
  expect(await saveDraftCommand(actor, { itemId: null, draft: { title: 'History', content: '/uploads/documents/history.pdf' } })).toMatchObject({ success: false, code: 'FORBIDDEN' });
});
it.each(['/uploads/thumbnails/../documents/victim.pdf', '/uploads/documents/%2e%2e/victim.pdf'])('rejects an ambiguous managed path: %s', async content => {
  expect(await saveDraftCommand(actor, { itemId: null, draft: { title: 'Ambiguous', content } })).toMatchObject({ success: false, code: 'FORBIDDEN' });
});
it('preserves external links with upload-like paths and ordinary bracketed prose', async () => {
  expect(await saveDraftCommand(actor, { itemId: null, draft: { title: 'Text', content: '[See https://example.test/uploads/documents/foreign.pdf for details]' } })).toMatchObject({ success: true });
});
