import { beforeAll, expect, it, vi } from 'vitest';
import { deleteShowcaseDraftAction } from '@/features/submissions/server/actions';
import { prisma } from '../fixtures/database';

const session = vi.hoisted(() => ({ id: '' }));
vi.mock('@/features/identity/server/actor', () => ({ getActor: async () => ({ id: session.id, role: 'CORE_MEMBER', status: 'ACTIVE' }) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
beforeAll(async () => {
  session.id = (await prisma.user.create({ data: { email: 'delete-draft@nexus.test', fullName: 'Author', status: 'ACTIVE', role: 'CORE_MEMBER' } })).id;
});

it('deletes an owned draft with dependent contributors', async () => {
  const item = await prisma.showcaseItem.create({ data: { creatorId: session.id, slug: 'delete-owned', title: 'Draft', summary: '', contributors: { create: { userId: session.id, role: 'CONTRIBUTOR' } } } });
  expect(await deleteShowcaseDraftAction(item.id, 0)).toMatchObject({ success: true });
  expect(await prisma.showcaseItem.findUnique({ where: { id: item.id } })).toBeNull();
  expect(await prisma.itemContributor.count({ where: { itemId: item.id } })).toBe(0);
});

it.each(['PENDING_REVIEW', 'READY_FOR_APPROVAL', 'REVISION_REQUESTED', 'REJECTED', 'PUBLISHED'] as const)('preserves %s posts, including published posts with draft updates', async status => {
  const item = await prisma.showcaseItem.create({ data: { creatorId: session.id, slug: `delete-protected-${status}`, title: 'Protected', summary: '', status, ...(status === 'PUBLISHED' ? { reviewStatus: 'DRAFT' as const } : {}) } });
  expect(await deleteShowcaseDraftAction(item.id, 0)).toMatchObject({ success: false });
  expect(await prisma.showcaseItem.findUnique({ where: { id: item.id } })).not.toBeNull();
});

it('preserves drafts belonging to someone else and drafts with newer saves', async () => {
  const other = await prisma.user.create({ data: { email: 'other-delete@nexus.test', fullName: 'Other' } });
  for (const [creatorId, reviewVersion] of [[other.id, 0], [session.id, 1]] as const) {
    const item = await prisma.showcaseItem.create({ data: { creatorId, reviewVersion, slug: `delete-denied-${creatorId}`, title: 'Keep', summary: '' } });
    expect(await deleteShowcaseDraftAction(item.id, 0)).toMatchObject({ success: false });
    expect(await prisma.showcaseItem.findUnique({ where: { id: item.id } })).not.toBeNull();
  }
});
