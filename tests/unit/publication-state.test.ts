import { setPublicationPin, setPublicationVisibility } from '@/features/publications/server/state-commands';
import { Prisma } from '@prisma/client';
import { beforeEach, expect, it, vi } from 'vitest';
const db = vi.hoisted(() => ({ findMany: vi.fn(), count: vi.fn(), updateMany: vi.fn(), transaction: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/server/db/prisma', () => ({ prisma: { $transaction: db.transaction } }));
const admin = { id: 'admin', fullName: 'Admin', role: 'ADMIN' as const, status: 'ACTIVE' as const, mustChangePassword: false };
const id = 'cjr012345678901234567890';
beforeEach(() => {
  vi.clearAllMocks();
  db.findMany.mockResolvedValue([{ id, slug: 'publication' }]);
  db.count.mockResolvedValue(2);
  db.updateMany.mockResolvedValue({ count: 1 });
  db.transaction.mockImplementation(callback => callback({ showcaseItem: db }));
});
it('sets desired pin state inside one serializable transaction', async () => {
  expect(await setPublicationPin(admin, { itemId: id, enabled: true })).toMatchObject({ success: true, data: { isPinned: true } });
  expect(db.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
});
it.each([3, 4, 10])('returns typed replacement details at capacity %i without writing', async count => {
  db.count.mockResolvedValue(count);
  expect(await setPublicationPin(admin, { itemId: id, enabled: true })).toMatchObject({ success: false, code: 'CONFLICT', details: { requiresReplacement: true, requiredReplacements: count - 2 } });
  expect(db.updateMany).not.toHaveBeenCalled();
});
it('allows unpinning old over-capacity data without a capacity query', async () => {
  expect(await setPublicationPin(admin, { itemId: id, enabled: false })).toMatchObject({ success: true, data: { isPinned: false } });
  expect(db.count).not.toHaveBeenCalled();
});
it('rejects non-admin actors before database work', async () => {
  expect(await setPublicationPin({ ...admin, role: 'MEMBER' }, { itemId: id, enabled: true })).toMatchObject({ success: false, code: 'FORBIDDEN' });
  expect(db.transaction).not.toHaveBeenCalled();
});
it('rejects unpublished or missing targets without writing', async () => {
  db.findMany.mockResolvedValue([]);
  expect(await setPublicationPin(admin, { itemId: id, enabled: true })).toMatchObject({ success: false });
  expect(db.updateMany).not.toHaveBeenCalled();
});
it('classifies serialization conflicts separately from infrastructure errors', async () => {
  db.transaction.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('conflict', { code: 'P2034', clientVersion: '6' }));
  expect(await setPublicationPin(admin, { itemId: id, enabled: true })).toMatchObject({ code: 'CONFLICT' });
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  db.transaction.mockRejectedValueOnce(new Error('secret infrastructure message'));
  expect(await setPublicationPin(admin, { itemId: id, enabled: true })).toMatchObject({ code: 'INTERNAL' });
  expect(JSON.stringify(log.mock.calls)).not.toContain('secret');
  log.mockRestore();
});
it.each(['PUBLIC', 'PRIVATE'] as const)('sets %s repeatedly without flipping back', async visibility => {
  for (let run = 0; run < 2; run++) expect(await setPublicationVisibility(admin, { itemId: id, visibility })).toMatchObject({ success: true, data: { visibility } });
  expect(db.updateMany.mock.calls.every(([query]) => query.data.visibility === visibility)).toBe(true);
});
