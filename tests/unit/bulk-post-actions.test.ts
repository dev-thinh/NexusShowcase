import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ admin: vi.fn(), findMany: vi.fn(), count: vi.fn(), updateMany: vi.fn(), transaction: vi.fn() }));
vi.mock('@/lib/current-user', () => ({ getCurrentUser: mocks.admin }));
vi.mock('@/lib/prisma', () => ({ prisma: { $transaction: mocks.transaction, showcaseItem: { count: mocks.count, findMany: mocks.findMany } } }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
import { updateBulkPostsAction, searchBulkPostsAction, saveBulkPostStatesAction } from '@/actions/bulk-post-actions';

const itemId = 'cjr012345678901234567890';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.admin.mockResolvedValue({ id: 'admin', role: 'ADMIN' });
  mocks.findMany.mockResolvedValue([{ id: itemId, slug: 'robot' }]);
  mocks.count.mockResolvedValue(0);
  mocks.updateMany.mockResolvedValue({ count: 1 });
  mocks.transaction.mockImplementation(async callback => callback({ showcaseItem: mocks }));
});

describe('independent bulk pin and visibility changes', () => {
  it.each([
    ['PIN', { isPinned: true, pinnedAt: expect.any(Date) }],
    ['UNPIN', { isPinned: false, pinnedAt: null }],
    ['PUBLIC', { visibility: 'PUBLIC' }],
    ['PRIVATE', { visibility: 'PRIVATE' }],
  ])('%s only updates the requested setting', async (action, data) => {
    expect(await updateBulkPostsAction({ itemIds: [itemId], action })).toEqual({ success: true, count: 1 });
    expect(mocks.updateMany).toHaveBeenCalledOnce();
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [itemId] }, status: 'PUBLISHED' }, data,
    });
  });

  it('rejects the former combined operation before accessing the database', async () => {
    expect(await updateBulkPostsAction({ itemIds: [itemId], action: 'PIN_PUBLIC' })).toMatchObject({ success: false });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

describe('bulk post status filters', () => {
  it.each([
    ['PINNED', { isPinned: true }, 3, 0, 1],
    ['UNPINNED', { isPinned: false }, 20, 10, 2],
    ['PUBLIC', { visibility: 'PUBLIC' }, 15, 10, 2],
    ['PRIVATE', { visibility: 'PRIVATE' }, 8, 0, 1],
    ['ALL', {}, 23, 20, 3],
  ] as const)('filters %s before pagination and reports status totals', async (filter, status, total, skip, page) => {
    mocks.count.mockImplementation(async ({ where }) => where.isPinned === true ? 3 : where.visibility === 'PUBLIC' ? 15 : 23);
    const result = await searchBulkPostsAction({ query: ' robot ', page: 99, filter });
    expect(result).toMatchObject({ success: true, total, page, counts: { ALL: 23, PINNED: 3, UNPINNED: 20, PUBLIC: 15, PRIVATE: 8 } });
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'PUBLISHED', title: { contains: 'robot', mode: 'insensitive' }, ...status },
      skip, take: 10,
    }));
  });

  it('defaults older search calls to all published posts', async () => {
    expect(await searchBulkPostsAction({ query: '', page: 1 })).toMatchObject({ success: true });
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: 'PUBLISHED' } }));
  });

  it('rejects unrecognized filters', async () => {
    expect(await searchBulkPostsAction({ query: '', page: 1, filter: 'DRAFT' as never })).toMatchObject({ success: false });
    expect(mocks.count).not.toHaveBeenCalled();
  });

  it('does not expose counts or posts to non-admin users', async () => {
    mocks.admin.mockResolvedValue(null);
    expect(await searchBulkPostsAction({ query: '', page: 1, filter: 'PUBLIC' })).toMatchObject({ success: false });
    expect(mocks.count).not.toHaveBeenCalled();
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});

describe('saving checkbox states', () => {
  const secondId = 'cjr012345678901234567891';

  it.each(['pin', 'visibility'] as const)('saves checked and unchecked %s states together', async mode => {
    mocks.findMany.mockResolvedValue([{ id: itemId, slug: 'old' }, { id: secondId, slug: 'new' }]);
    mocks.count.mockResolvedValue(2);
    const result = await saveBulkPostStatesAction({ mode, changes: [
      { itemId, enabled: false }, { itemId: secondId, enabled: true },
    ] });
    expect(result).toEqual({ success: true, count: 2 });
    expect(mocks.updateMany).toHaveBeenCalledTimes(2);
    expect(mocks.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: { in: [itemId] }, status: 'PUBLISHED' },
      data: mode === 'pin' ? { isPinned: false, pinnedAt: null } : { visibility: 'PRIVATE' },
    });
    expect(mocks.updateMany).toHaveBeenNthCalledWith(2, {
      where: { id: { in: [secondId] }, status: 'PUBLISHED' },
      data: mode === 'pin' ? { isPinned: true, pinnedAt: expect.any(Date) } : { visibility: 'PUBLIC' },
    });
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
    if (mode === 'pin') expect(mocks.count).toHaveBeenCalledWith({ where: { isPinned: true, status: 'PUBLISHED', id: { notIn: [itemId, secondId] } } });
    else expect(mocks.count).not.toHaveBeenCalled();
  });

  it('does not save any checkbox changes if the final pin count exceeds three', async () => {
    mocks.findMany.mockResolvedValue([{ id: itemId, slug: 'old' }, { id: secondId, slug: 'new' }]);
    mocks.count.mockResolvedValue(3);
    expect(await saveBulkPostStatesAction({ mode: 'pin', changes: [
      { itemId, enabled: false }, { itemId: secondId, enabled: true },
    ] })).toMatchObject({ success: false, requiredReplacements: 1 });
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it.each([
    { changes: [] },
    { changes: [{ itemId, enabled: true }, { itemId, enabled: false }] },
    { changes: [{ itemId, enabled: 'false' }] },
  ])('rejects empty, conflicting or nonboolean changes: %j', async ({ changes }) => {
    expect(await saveBulkPostStatesAction({ mode: 'pin', changes })).toMatchObject({ success: false });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('requires admin permission to save checkbox states', async () => {
    mocks.admin.mockResolvedValue(null);
    expect(await saveBulkPostStatesAction({ mode: 'pin', changes: [{ itemId, enabled: true }] })).toMatchObject({ success: false });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
