import { beforeEach, expect, it, vi } from 'vitest';
import { deleteShowcaseDraftAction } from '@/features/submissions/server/actions';

const mocks = vi.hoisted(() => ({ actor: vi.fn(), deleteMany: vi.fn(), invalidate: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/features/identity/server/actor', () => ({ getActor: mocks.actor }));
vi.mock('@/server/db/prisma', () => ({ prisma: { showcaseItem: { deleteMany: mocks.deleteMany } } }));
vi.mock('@/features/publications/server/invalidation', () => ({ invalidatePublicationChange: mocks.invalidate }));
const itemId = 'cjr012345678901234567890';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.actor.mockResolvedValue({ id: 'owner', role: 'CORE_MEMBER' });
  mocks.deleteMany.mockResolvedValue({ count: 1 });
});

it('deletes only the owned draft at the observed version and refreshes management lists', async () => {
  expect(await deleteShowcaseDraftAction(itemId, 2)).toMatchObject({ success: true });
  expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { id: itemId, creatorId: 'owner', status: 'DRAFT', reviewVersion: 2 } });
  expect(mocks.invalidate).toHaveBeenCalledOnce();
});

it('rejects missing permission before accessing the database', async () => {
  mocks.actor.mockResolvedValue(null);
  expect(await deleteShowcaseDraftAction(itemId, 0)).toMatchObject({ success: false, code: 'UNAUTHORIZED' });
  expect(mocks.deleteMany).not.toHaveBeenCalled();
});

it.each([['invalid', 0], [itemId, -1], [itemId, 1.5], [itemId, NaN]])('rejects invalid input %s / %s', async (id, version) => {
  expect(await deleteShowcaseDraftAction(id, version)).toMatchObject({ success: false, code: 'VALIDATION' });
  expect(mocks.deleteMany).not.toHaveBeenCalled();
});

it('rejects another owner, a changed state or stale version without invalidation', async () => {
  mocks.deleteMany.mockResolvedValue({ count: 0 });
  expect(await deleteShowcaseDraftAction(itemId, 0)).toMatchObject({ success: false, code: 'CONFLICT' });
  expect(mocks.invalidate).not.toHaveBeenCalled();
});
