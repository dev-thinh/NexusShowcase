import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { updateBulkPostsAction, searchBulkPostsAction } from '@/actions/bulk-post-actions';
const session = vi.hoisted(() => ({ role: 'ADMIN' as string | null }));
vi.mock('@/lib/current-user', () => ({ getCurrentUser: async (roles: string[]) => session.role && roles.includes(session.role) ? { id: 'admin', role: session.role } : null }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
let creatorId: string;
let previousPins: Array<{ id: string; pinnedAt: Date | null }> = [];
async function posts(count: number, pinned = false, status: 'PUBLISHED' | 'DRAFT' = 'PUBLISHED') {
  return Promise.all(Array.from({ length: count }, (_, index) => prisma.showcaseItem.create({ data: {
    title: `Bulk test ${index}`, slug: `bulk-${crypto.randomUUID()}`, summary: 'Kiểm thử cập nhật nhiều bài',
    type: 'PROJECT', status, creatorId, visibility: 'PRIVATE', isPinned: pinned, pinnedAt: pinned ? new Date() : null,
  } })));
}
beforeAll(async () => {
  creatorId = (await prisma.user.create({ data: { fullName: 'Bulk admin test', email: `bulk-${crypto.randomUUID()}@nexus.test`, role: 'ADMIN' } })).id;
  previousPins = await prisma.showcaseItem.findMany({ where: { isPinned: true }, select: { id: true, pinnedAt: true } });
  if (previousPins.length) await prisma.showcaseItem.updateMany({ where: { id: { in: previousPins.map(item => item.id) } }, data: { isPinned: false, pinnedAt: null } });
});
beforeEach(() => { session.role = 'ADMIN'; });
afterEach(async () => { if (creatorId) await prisma.showcaseItem.deleteMany({ where: { creatorId } }); });
afterAll(async () => {
  for (const item of previousPins) await prisma.showcaseItem.update({ where: { id: item.id }, data: { isPinned: true, pinnedAt: item.pinnedAt } });
  if (creatorId) await prisma.user.delete({ where: { id: creatorId } });
});

describe('bulk pin and visibility management', () => {
  it('pins multiple posts idempotently without changing their visibility', async () => {
    const items = await posts(2);
    const input = { itemIds: items.map(item => item.id), action: 'PIN' };
    expect(await updateBulkPostsAction(input)).toEqual({ success: true, count: 2 });
    expect(await updateBulkPostsAction(input)).toEqual({ success: true, count: 2 });
    const saved = await prisma.showcaseItem.findMany({ where: { creatorId } });
    expect(saved.every(item => item.isPinned && item.visibility === 'PRIVATE' && item.pinnedAt)).toBe(true);
  });
  it('changes visibility for more than three posts without changing their pin state', async () => {
    const items = await posts(5);
    expect(await updateBulkPostsAction({ itemIds: items.map(item => item.id), action: 'PUBLIC' })).toEqual({ success: true, count: 5 });
    expect(await prisma.showcaseItem.count({ where: { creatorId, visibility: 'PUBLIC', isPinned: false } })).toBe(5);
    expect((await updateBulkPostsAction({ itemIds: items.map(item => item.id), action: 'PRIVATE' })).success).toBe(true);
    expect(await prisma.showcaseItem.count({ where: { creatorId, visibility: 'PRIVATE' } })).toBe(5);
  });
  it('preserves visibility on capacity failure and replaces only explicitly chosen pins', async () => {
    const old = await posts(3, true); const items = await posts(2);
    const input = { itemIds: items.map(item => item.id), action: 'PIN' };
    const result = await updateBulkPostsAction(input);
    expect(result).toMatchObject({ success: false, requiredReplacements: 2 });
    expect(await prisma.showcaseItem.count({ where: { creatorId, isPinned: true } })).toBe(3);
    expect(await prisma.showcaseItem.count({ where: { id: { in: input.itemIds }, visibility: 'PRIVATE', isPinned: false } })).toBe(2);
    expect(await updateBulkPostsAction({ ...input, replaceItemIds: old.slice(0, 2).map(item => item.id) })).toEqual({ success: true, count: 2 });
    expect(await prisma.showcaseItem.count({ where: { creatorId, isPinned: true } })).toBe(3);
    expect((await prisma.showcaseItem.findUniqueOrThrow({ where: { id: old[2].id } })).isPinned).toBe(true);
    expect(await prisma.showcaseItem.count({ where: { id: { in: input.itemIds }, isPinned: true, visibility: 'PRIVATE' } })).toBe(2);
  });
  it('unpins a selected batch while preserving unrelated pins', async () => {
    const items = await posts(3, true);
    expect(await updateBulkPostsAction({ itemIds: items.slice(0, 2).map(item => item.id), action: 'UNPIN' })).toEqual({ success: true, count: 2 });
    expect(await prisma.showcaseItem.count({ where: { creatorId, isPinned: true } })).toBe(1);
    expect(await prisma.showcaseItem.count({ where: { creatorId, isPinned: false, pinnedAt: null } })).toBe(2);
  });
  it('rejects batches containing unpublished posts without updating any post', async () => {
    const [published] = await posts(1); const [draft] = await posts(1, false, 'DRAFT');
    expect((await updateBulkPostsAction({ itemIds: [published.id, draft.id], action: 'PUBLIC' })).success).toBe(false);
    expect(await prisma.showcaseItem.count({ where: { creatorId, visibility: 'PUBLIC' } })).toBe(0);
  });
  it('rejects non-admin reads and writes', async () => {
    const [item] = await posts(1); session.role = 'CORE_MEMBER';
    expect((await searchBulkPostsAction({ query: '', page: 1 })).success).toBe(false);
    expect((await updateBulkPostsAction({ itemIds: [item.id], action: 'PUBLIC' })).success).toBe(false);
    expect((await prisma.showcaseItem.findUniqueOrThrow({ where: { id: item.id } })).visibility).toBe('PRIVATE');
  });
  it('keeps the three-pin limit under simultaneous requests', async () => {
    await posts(2, true); const [first, second] = await posts(2);
    const results = await Promise.all([first, second].map(item => updateBulkPostsAction({ itemIds: [item.id], action: 'PIN' })));
    expect(results.filter(result => result.success)).toHaveLength(1);
    expect(await prisma.showcaseItem.count({ where: { creatorId, isPinned: true } })).toBe(3);
    expect(await prisma.showcaseItem.count({ where: { creatorId, visibility: 'PUBLIC' } })).toBe(0);
  });
  it('searches and paginates published posts without exposing drafts', async () => {
    const marker = `bulk-search-${crypto.randomUUID()}`;
    const items = await posts(12); const [draft] = await posts(1, false, 'DRAFT');
    await prisma.showcaseItem.updateMany({ where: { id: { in: [...items.map(item => item.id), draft.id] } }, data: { title: marker } });
    const first = await searchBulkPostsAction({ query: marker, page: 1 }); const second = await searchBulkPostsAction({ query: marker, page: 99 });
    expect(first).toMatchObject({ success: true, total: 12, totalPages: 2, page: 1 });
    expect(second).toMatchObject({ success: true, page: 2 });
    if (first.success && second.success) {
      expect(first.items).toHaveLength(10); expect(second.items).toHaveLength(2);
      expect(new Set([...first.items, ...second.items].map(item => item.id)).size).toBe(12);
      expect(first.items[0]).not.toHaveProperty('authorDraft');
    }
  });
});
