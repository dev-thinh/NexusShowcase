import { saveShowcaseDraftAction } from '@/features/submissions/server/actions';
import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/features/identity/server/actor', () => ({ getActor: async () => ({ id: 'author', role: 'CORE_MEMBER', status: 'ACTIVE' }) }));
const database = vi.hoisted(() => ({ create: vi.fn(), transaction: vi.fn() }));
vi.mock('@/server/db/prisma', () => ({ prisma: { showcaseItem: { create: database.create }, $transaction: database.transaction } }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

it.each([null, 1, { content: {} }])('rejects malformed draft before normalization: %j', async draft => {
  await expect(saveShowcaseDraftAction({ itemId: null, draft } as never)).resolves.toMatchObject({ success: false, code: 'VALIDATION' });
  expect(database.create).not.toHaveBeenCalled();
  expect(database.transaction).not.toHaveBeenCalled();
});
it('requires the version observed by an existing editor', async () => {
  expect(await saveShowcaseDraftAction({ itemId: 'cjr012345678901234567890', draft: { title: 'Title' } } as never)).toMatchObject({ success: false, code: 'VALIDATION' });
});
