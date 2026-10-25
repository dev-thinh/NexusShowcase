import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ actor: vi.fn(), registry: vi.fn(), rows: vi.fn(), galleries: vi.fn(), avatar: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/features/identity/server/actor', () => ({ getActor: mocks.actor }));
vi.mock('@/features/assets/server/registry', () => ({ findRegisteredAsset: mocks.registry }));
vi.mock('@/server/db/prisma', () => ({ prisma: { $queryRaw: mocks.rows, homeMomentsGallery: { findMany: mocks.galleries }, user: { findFirst: mocks.avatar } } }));
import { getAssetAccess } from '@/features/assets/server/access';
const url = '/uploads/resources/file.zip';
beforeEach(() => { vi.clearAllMocks(); mocks.actor.mockResolvedValue(null); mocks.registry.mockResolvedValue(null); mocks.rows.mockResolvedValue([]); mocks.galleries.mockResolvedValue([]); mocks.avatar.mockResolvedValue(null); });

it('denies anonymous access to a file referenced only by a private publication', async () => {
  mocks.rows.mockResolvedValue([{ creatorId: 'author', status: 'PUBLISHED', visibility: 'PRIVATE', live: [url], drafts: [] }]);
  expect(await getAssetAccess(url)).toEqual({ allowed: false, public: false });
});
it('allows authenticated readers of private publications without public caching', async () => {
  mocks.actor.mockResolvedValue({ id: 'reader', role: 'MEMBER' });
  mocks.rows.mockResolvedValue([{ creatorId: 'author', status: 'PUBLISHED', visibility: 'PRIVATE', live: [url], drafts: [] }]);
  expect(await getAssetAccess(url)).toEqual({ allowed: true, public: false });
});
it('does not expose historical or draft assets through a public publication', async () => {
  mocks.rows.mockResolvedValue([{ creatorId: 'author', status: 'PUBLISHED', visibility: 'PUBLIC', live: [], drafts: [url] }]);
  expect((await getAssetAccess(url)).allowed).toBe(false);
  mocks.actor.mockResolvedValue({ id: 'author', role: 'CORE_MEMBER' });
  expect((await getAssetAccess(url)).allowed).toBe(true);
});
it('allows a public live reference even when the same asset is also private elsewhere', async () => {
  mocks.rows.mockResolvedValue([{ creatorId: 'author', status: 'PUBLISHED', visibility: 'PUBLIC', live: [url, 'https://foreign.test/uploads/documents/unrelated.pdf'], drafts: [] }]);
  expect(await getAssetAccess(url)).toEqual({ allowed: true, public: true });
});
it('allows the uploader to preview an unreferenced asset and rejects quarantined assets', async () => {
  mocks.registry.mockResolvedValue({ ownerId: 'author' });
  mocks.actor.mockResolvedValue({ id: 'author', role: 'CORE_MEMBER' });
  expect((await getAssetAccess(url)).allowed).toBe(true);
  mocks.registry.mockResolvedValue({ ownerId: 'author', deletionToken: 'quarantine' });
  expect((await getAssetAccess(url)).allowed).toBe(false);
});
it('allows gallery photos only when publicly placed', async () => {
  const photo = '/uploads/thumbnails/photo.jpg';
  mocks.galleries.mockResolvedValue([{ photos: [{ src: photo, visible: true, slot: 0 }] }]);
  expect(await getAssetAccess(photo)).toEqual({ allowed: true, public: true });
});
it.each(['victim', null])('denies preexisting self-granting draft references to a registered asset owned by %s', async ownerId => {
  mocks.registry.mockResolvedValue({ ownerId, private: true });
  mocks.actor.mockResolvedValue({ id: 'attacker', role: 'CORE_MEMBER' });
  mocks.rows.mockResolvedValue([{ creatorId: 'attacker', status: 'DRAFT', visibility: 'PRIVATE', live: [url], drafts: [url] }]);
  expect((await getAssetAccess(url)).allowed).toBe(false);
});
it('preserves the explicit editor privilege to review registered draft media', async () => {
  mocks.registry.mockResolvedValue({ ownerId: 'author', private: true });
  mocks.actor.mockResolvedValue({ id: 'reviewer', role: 'EDITOR' });
  mocks.rows.mockResolvedValue([{ creatorId: 'author', status: 'PENDING_REVIEW', visibility: 'PRIVATE', live: [url], drafts: [] }]);
  expect(await getAssetAccess(url)).toEqual({ allowed: true, public: false });
});
