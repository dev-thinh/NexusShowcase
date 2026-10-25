import { beforeEach, expect, it, vi } from 'vitest';
import { prisma } from '../fixtures/database';
import type { Actor } from '@/features/identity/model/session';
const state = vi.hoisted(() => ({ actor: null as Actor | null }));
vi.mock('@/features/identity/server/actor', () => ({ getActor: async () => state.actor }));
import { saveDraftCommand } from '@/features/submissions/server/draft-commands';
import { getAssetAccess } from '@/features/assets/server/access';

let author: Actor;
let victim: Actor;
beforeEach(async () => {
  const create = async (name: string): Promise<Actor> => {
    const user = await prisma.user.create({ data: { email: `${name}-${crypto.randomUUID()}@test.invalid`, fullName: name, role: 'CORE_MEMBER', status: 'ACTIVE' } });
    return { ...user, status: 'ACTIVE' };
  };
  author = await create('author'); victim = await create('victim'); state.actor = author;
});

it.each(['thumbnail', 'resource', 'content', 'encoded-content', 'history'] as const)('denies a foreign private asset referenced through %s before it can grant access', async placement => {
  const url = `/uploads/${placement === 'thumbnail' ? 'thumbnails' : 'documents'}/${crypto.randomUUID()}.${placement === 'thumbnail' ? 'png' : 'pdf'}`;
  await prisma.asset.create({ data: { url, provider: 'local', ownerId: victim.id, private: true } });
  if (placement === 'history') await prisma.showcaseItem.create({ data: { title: 'Victim', summary: '', slug: crypto.randomUUID(), creatorId: victim.id, type: 'PROJECT', authorDraft: { content: url } } });
  const draft = { title: 'Attempt', ...(placement === 'thumbnail' ? { thumbnailUrl: url } : placement === 'resource' ? { resources: [{ kind: 'DOCUMENT', label: 'File', url }] } : { content: placement === 'encoded-content' ? url.replaceAll('/', '%252F') : url }) };
  expect((await getAssetAccess(url)).allowed).toBe(false);
  const result = await saveDraftCommand(author, { itemId: null, draft });
  expect(result).toMatchObject({ success: false, code: 'FORBIDDEN' });
  expect((await getAssetAccess(url)).allowed).toBe(false);
});

it('allows own uploads and public legacy assets to be reused', async () => {
  const own = `/uploads/documents/${crypto.randomUUID()}.pdf`;
  const legacy = `/uploads/thumbnails/${crypto.randomUUID()}.png`;
  await prisma.asset.create({ data: { url: own, provider: 'local', ownerId: author.id, private: true } });
  await prisma.showcaseItem.create({ data: { title: 'Public', summary: '', slug: crypto.randomUUID(), creatorId: victim.id, type: 'PROJECT', status: 'PUBLISHED', visibility: 'PUBLIC', thumbnailUrl: legacy } });
  expect(await saveDraftCommand(author, { itemId: null, draft: { title: 'Reuse', thumbnailUrl: legacy, resources: [{ kind: 'DOCUMENT', label: 'Own', url: own }] } })).toMatchObject({ success: true });
});

it('preserves existing authorized legacy draft media but rejects a newly inserted foreign path on update', async () => {
  const legacy = `/uploads/documents/${crypto.randomUUID()}.pdf`;
  const foreign = `/uploads/documents/${crypto.randomUUID()}.pdf`;
  await prisma.asset.create({ data: { url: foreign, provider: 'local', ownerId: victim.id, private: true } });
  const item = await prisma.showcaseItem.create({ data: { title: 'Legacy', summary: '', slug: crypto.randomUUID(), creatorId: author.id, type: 'PROJECT', content: legacy } });
  const saved = await saveDraftCommand(author, { itemId: item.id, expectedReviewVersion: item.reviewVersion, draft: { title: 'Edited', content: legacy } });
  expect(saved).toMatchObject({ success: true });
  if (!saved.success) throw new Error('Legacy save failed');
  expect(await saveDraftCommand(author, { itemId: item.id, expectedReviewVersion: saved.data.reviewVersion, draft: { title: 'Attempt', content: foreign } })).toMatchObject({ success: false, code: 'FORBIDDEN' });
  expect((await getAssetAccess(foreign)).allowed).toBe(false);
});
it('denies a registered foreign asset even if an attacker already placed it in their draft before the fix', async () => {
  const url = `/uploads/documents/${crypto.randomUUID()}.pdf`;
  await prisma.asset.create({ data: { url, provider: 'local', ownerId: victim.id, private: true } });
  await prisma.showcaseItem.create({ data: { title: 'Old attack', summary: '', slug: crypto.randomUUID(), creatorId: author.id, type: 'PROJECT', content: url, authorDraft: { content: url } } });
  expect((await getAssetAccess(url)).allowed).toBe(false);
});
