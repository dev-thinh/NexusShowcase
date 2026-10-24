import { saveShowcaseDraftAction, submitShowcaseForReviewAction } from '@/features/submissions/server/actions';
import { beforeAll, expect, it, vi } from 'vitest';
import { prisma } from '../fixtures/database';
const session = vi.hoisted(() => ({ id: '' }));
vi.mock('@/features/identity/server/actor', () => ({ getActor: async () => ({ id: session.id, role: 'CORE_MEMBER', status: 'ACTIVE' }) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
beforeAll(async () => {
  const user = await prisma.user.create({ data: { email: 'versioned@nexus.test', fullName: 'Author', status: 'ACTIVE', role: 'CORE_MEMBER' } });
  session.id = user.id;
});

it('rejects stale saves and submissions and preserves the winning draft', async () => {
  const item = await prisma.showcaseItem.create({ data: { title: 'Original', slug: 'versioned', summary: '', creatorId: session.id } });
  const result = await saveShowcaseDraftAction({ itemId: item.id, expectedReviewVersion: item.reviewVersion, draft: { title: 'First editor' } });
  expect(result).toMatchObject({ success: true, data: { reviewVersion: item.reviewVersion + 1 } });
  expect(await saveShowcaseDraftAction({ itemId: item.id, expectedReviewVersion: item.reviewVersion, draft: { title: 'Stale editor' } })).toMatchObject({ success: false, code: 'CONFLICT' });
  expect(await submitShowcaseForReviewAction({ itemId: item.id, expectedReviewVersion: item.reviewVersion })).toMatchObject({ success: false, code: 'CONFLICT' });
  expect(await prisma.showcaseItem.findUniqueOrThrow({ where: { id: item.id } })).toMatchObject({ title: 'First editor', reviewVersion: item.reviewVersion + 1 });
});
it('allows only one concurrent save for the same observed version', async () => {
  const item = await prisma.showcaseItem.create({ data: { title: 'Original', slug: 'concurrent-versioned', summary: '', creatorId: session.id } });
  const results = await Promise.all(['A', 'B'].map(title => saveShowcaseDraftAction({ itemId: item.id, expectedReviewVersion: item.reviewVersion, draft: { title } })));
  expect(results.filter(result => result.success)).toHaveLength(1);
  expect(results.find(result => !result.success)).toMatchObject({ code: 'CONFLICT' });
});
