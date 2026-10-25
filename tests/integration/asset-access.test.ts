import { beforeEach, expect, it, vi } from 'vitest';
import { prisma } from '../fixtures/database';
const state = vi.hoisted(() => ({ actor: null as null | { id: string; role: string } }));
vi.mock('@/features/identity/server/actor', () => ({ getActor: async () => state.actor }));
vi.mock('@/features/assets/server/delivery', () => ({ readStoredAsset: async () => new Uint8Array([1, 2, 3]) }));
import { getAssetAccess } from '@/features/assets/server/access';
import { GET } from '@/app/uploads/documents/[filename]/route';
beforeEach(() => { state.actor = null; });

it('enforces private/public reads against actual live and historical database references', async () => {
  const author = await prisma.user.create({ data: { email: 'asset-author@test.invalid', fullName: 'Author', role: 'CORE_MEMBER', status: 'ACTIVE' } });
  const url = '/uploads/documents/access-live.pdf';
  const history = '/uploads/documents/access-history.pdf';
  const item = await prisma.showcaseItem.create({ data: { title: 'Access', slug: 'asset-access', summary: 'Access test', type: 'PROJECT', status: 'PUBLISHED', visibility: 'PRIVATE', creatorId: author.id, authorDraft: { resource: history }, attachments: { create: { fileUrl: url, fileName: 'document.pdf', mimeType: 'application/pdf', fileSize: 3 } } } });
  expect((await getAssetAccess(url)).allowed).toBe(false);
  state.actor = { id: 'reader', role: 'MEMBER' };
  expect(await getAssetAccess(url)).toEqual({ allowed: true, public: false });
  expect((await getAssetAccess(history)).allowed).toBe(false);
  const response = await GET(new Request(`http://localhost${url}`), { params: Promise.resolve({ filename: 'access-live.pdf' }) });
  expect(response.status).toBe(200);
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  await prisma.showcaseItem.update({ where: { id: item.id }, data: { visibility: 'PUBLIC' } });
  state.actor = null;
  expect(await getAssetAccess(url)).toEqual({ allowed: true, public: true });
  expect((await getAssetAccess(history)).allowed).toBe(false);
  const encoded = '/uploads/documents/encoded-access.pdf';
  await prisma.showcaseItem.update({ where: { id: item.id }, data: { content: 'nexus-sections:v1\n' + JSON.stringify({ resource: encoded.replaceAll('/', String.raw`\u002f`), external: 'https://foreign.test/uploads/other.pdf' }) } });
  expect(await getAssetAccess(encoded)).toEqual({ allowed: true, public: true });
  state.actor = { id: author.id, role: 'CORE_MEMBER' };
  expect((await getAssetAccess(history)).allowed).toBe(true);
});

it('keeps unplaced assets private to their owner and denies quarantined files', async () => {
  const url = '/uploads/thumbnails/access-owner.png';
  const asset = await prisma.asset.create({ data: { url, provider: 'local', ownerId: 'uploader', private: true } });
  expect((await getAssetAccess(url)).allowed).toBe(false);
  state.actor = { id: 'uploader', role: 'CORE_MEMBER' };
  expect((await getAssetAccess(url)).allowed).toBe(true);
  await prisma.asset.update({ where: { id: asset.id }, data: { deletionToken: 'claim', deletionStartedAt: new Date() } });
  expect((await getAssetAccess(url)).allowed).toBe(false);
});
