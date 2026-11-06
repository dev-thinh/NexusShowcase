import { beforeEach, expect, it, vi } from 'vitest';
import { selectedContributors } from '@/features/identity/server/selected-contributors';

const mocks = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/server/db/prisma', () => ({ prisma: { user: { findMany: mocks.findMany } } }));
beforeEach(() => { vi.clearAllMocks(); mocks.findMany.mockResolvedValue([]); });

it('does not access the database for an empty contributor selection', async () => {
  expect(await selectedContributors([])).toEqual([]);
  expect(mocks.findMany).not.toHaveBeenCalled();
});

it('deduplicates and bounds hydration while selecting only public name options', async () => {
  const ids = Array.from({ length: 25 }, (_, i) => `member-${i}`);
  await selectedContributors([ids[0], ...ids]);
  expect(mocks.findMany).toHaveBeenCalledWith({ where: { hiddenFromDirectory: false, id: { in: ids.slice(0, 20) } }, select: { id: true, fullName: true } });
});
