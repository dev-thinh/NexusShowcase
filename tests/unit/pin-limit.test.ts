import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';
const mocks = vi.hoisted(() => ({ admin: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), update: vi.fn(), transaction: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/current-user', () => ({ getCurrentUser: mocks.admin }));
vi.mock('@/lib/prisma', () => ({ prisma: { showcaseItem: { findUnique: mocks.findUnique, update: mocks.update }, $transaction: mocks.transaction } }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
import { togglePinShowcaseItemAction, replacePinnedShowcaseItemAction } from '@/actions/showcase-actions';
const id = 'cjr012345678901234567890';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.admin.mockResolvedValue({ id: 'admin', role: 'ADMIN' });
  mocks.findUnique.mockResolvedValue({ id, status: 'PUBLISHED', isPinned: false, slug: 'robot' });
  mocks.count.mockResolvedValue(2);
  mocks.findMany.mockResolvedValue([{ id: 'cjr012345678901234567891', title: 'Bài đang ghim' }]);
  mocks.transaction.mockImplementation(async callback => callback({ showcaseItem: { count: mocks.count, update: mocks.update, findMany: mocks.findMany, findUnique: mocks.findUnique } }));
});
describe('three homepage pins', () => {
  it('allows the third pin with an atomic capacity check', async () => {
    expect(await togglePinShowcaseItemAction(id)).toMatchObject({ success: true, isPinned: true });
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
    expect(mocks.update).toHaveBeenCalledWith({ where: { id }, data: { isPinned: true, pinnedAt: expect.any(Date) } });
  });
  it.each([3, 4, 10])('rejects new pins when %i posts are already pinned without unpinning any post', async count => {
    mocks.count.mockResolvedValue(count);
    const result = await togglePinShowcaseItemAction(id);
    expect(result.success).toBe(false);
    expect(result.error).toContain('tối đa 3');
    expect(result.requiresReplacement).toBe(true);
    expect(result.pinnedItems).toEqual([{ id: 'cjr012345678901234567891', title: 'Bài đang ghim' }]);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('allows unpinning even when old data exceeds the limit', async () => {
    mocks.findUnique.mockResolvedValue({ id, status: 'PUBLISHED', isPinned: true });
    expect(await togglePinShowcaseItemAction(id)).toMatchObject({ success: true, isPinned: false });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledWith({ where: { id }, data: { isPinned: false, pinnedAt: null } });
  });
  it('returns a retry message if simultaneous pin requests conflict', async () => {
    mocks.transaction.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('conflict', { code: 'P2034', clientVersion: '6' }));
    expect(await togglePinShowcaseItemAction(id)).toMatchObject({ success: false, error: expect.stringContaining('thử lại') });
  });
  it('rejects non-admin requests before reading or changing pins', async () => {
    mocks.admin.mockResolvedValue(null);
    expect((await togglePinShowcaseItemAction(id)).success).toBe(false);
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

const replacedId = 'cjr012345678901234567891';
describe('explicit pin replacement', () => {
  beforeEach(() => {
    mocks.count.mockResolvedValue(3);
    mocks.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({ id: where.id, status: 'PUBLISHED', isPinned: where.id === replacedId, slug: where.id }));
  });
  it('replaces exactly the selected post in one serializable transaction', async () => {
    expect(await replacePinnedShowcaseItemAction(id, replacedId)).toMatchObject({ success: true, isPinned: true });
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
    expect(mocks.update.mock.calls).toEqual([
      [{ where: { id: replacedId }, data: { isPinned: false, pinnedAt: null } }],
      [{ where: { id }, data: { isPinned: true, pinnedAt: expect.any(Date) } }],
    ]);
  });
  it('rejects stale choices without changing either post', async () => {
    mocks.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({ id: where.id, status: 'PUBLISHED', isPinned: false }));
    expect(await replacePinnedShowcaseItemAction(id, replacedId)).toMatchObject({ success: false, error: expect.stringContaining('không còn được ghim') });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('rejects an unpublished incoming post', async () => {
    mocks.findUnique.mockResolvedValue({ id, status: 'DRAFT', isPinned: false });
    expect((await replacePinnedShowcaseItemAction(id, replacedId)).success).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('does not modify pins when incoming post was already pinned elsewhere', async () => {
    mocks.findUnique.mockResolvedValue({ id, status: 'PUBLISHED', isPinned: true });
    expect((await replacePinnedShowcaseItemAction(id, replacedId)).success).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('requires admin authorization', async () => {
    mocks.admin.mockResolvedValue(null);
    expect((await replacePinnedShowcaseItemAction(id, replacedId)).success).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it.each([[id, id], ['invalid', replacedId], [id, 'invalid']])('validates both selected IDs', async (incoming, outgoing) => {
    expect((await replacePinnedShowcaseItemAction(incoming, outgoing)).success).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('reports concurrent changes without replacing another post silently', async () => {
    mocks.transaction.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('conflict', { code: 'P2034', clientVersion: '6' }));
    expect(await replacePinnedShowcaseItemAction(id, replacedId)).toMatchObject({ success: false, error: expect.stringContaining('vừa thay đổi') });
  });
});
