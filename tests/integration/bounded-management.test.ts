import { listAdminMembers } from '@/features/identity/server/member-queries';
import { selectedContributors } from '@/features/identity/server/selected-contributors';
import { listReviewQueue } from '@/features/review/server/queries';
import { authorItemStats, listAuthorItems } from '@/features/submissions/server/queries';
import { beforeAll, expect, it } from 'vitest';
import { prisma } from '../fixtures/database';
let authorId: string;
beforeAll(async () => {
  const author = await prisma.user.create({ data: { email: 'bounded-author@nexus.test', fullName: 'Nguyễn Văn An', role: 'CORE_MEMBER' } });
  authorId = author.id;
  for (let index = 0; index < 43; index++) {
    const item = await prisma.showcaseItem.create({ data: { creatorId: authorId, slug: `bounded-${index}`, title: `Robot tự hành ${index}`, summary: 'Nghiên cứu điều hướng', content: 'PRIVATE LARGE CONTENT', status: 'PENDING_REVIEW', reviewVersion: 1 } });
    await prisma.submissionRevision.create({ data: { itemId: item.id, revisionNumber: 1, submittedById: authorId, snapshot: { title: `Submitted ${index}`, summary: 'Review summary', content: 'SECRET SNAPSHOT CONTENT', publishedYear: 2026 } } });
  }
  await prisma.user.create({ data: { email: 'other-bounded@nexus.test', fullName: 'Other author', role: 'CORE_MEMBER', createdItems: { create: { title: 'Robot tự hành outsider', summary: '', slug: 'outsider', status: 'DRAFT' } } } });
});
it('paginates accent-insensitive author search without leaking another author or content', async () => {
  const actor = { id: authorId, fullName: 'Author', role: 'CORE_MEMBER' as const, status: 'ACTIVE' as const, mustChangePassword: false };
  const result = await listAuthorItems({ actor, q: 'TU HANH', filter: 'PENDING_REVIEW', page: 2 });
  expect(result.total).toBe(43);
  expect(result.items).toHaveLength(10);
  expect(result.page).toBe(2);
  expect(result).toMatchObject({ pageSize: 10, totalPages: 5 });
  const unfiltered = await listAuthorItems({ actor, q: '', filter: 'ALL', page: 2 });
  expect(unfiltered.items).toHaveLength(10);
  expect(unfiltered).toMatchObject({ page: 2, pageSize: 10, totalPages: 5 });
  expect(JSON.stringify(result)).not.toContain('PRIVATE LARGE CONTENT');
  expect(await authorItemStats(actor)).toMatchObject({ ALL: 43, PENDING_REVIEW: 43, DRAFT: 0 });
});
it('projects the latest submitted list title without sending snapshot content', async () => {
  const result = await listReviewQueue('999');
  expect(result).toMatchObject({ total: 43, page: 3, totalPages: 3 });
  expect(result.items).toHaveLength(3);
  expect(result.items.every(item => item.title.startsWith('Submitted'))).toBe(true);
  expect(JSON.stringify(result)).not.toContain('CONTENT');
});
it('keeps selected contributor names available independently of a search page', async () => {
  expect(await selectedContributors([authorId])).toEqual([{ id: authorId, fullName: 'Nguyễn Văn An' }]);
  const result = await listAdminMembers({ q: 'nguyen van', role: 'CORE_MEMBER', page: '2oops' });
  expect(result).toMatchObject({ total: 1, page: 1 });
  expect(Object.keys(result.items[0]).sort()).toEqual(['createdAt', 'fullName', 'id', 'publicSlug', 'role']);
});

it('tracks contributions from draft without granting management rights or exposing private feedback', async () => {
  const participant = await prisma.user.create({ data: { email: 'participant@nexus.test', fullName: 'Participant', role: 'GUEST' } });
  const actor = { id: participant.id, fullName: participant.fullName, role: 'GUEST' as const, status: 'ACTIVE' as const, mustChangePassword: false };
  const own = await prisma.showcaseItem.create({ data: { creatorId: participant.id, slug: 'participant-own', title: 'Shared scope own', summary: '', status: 'PUBLISHED', contributors: { create: { userId: participant.id, role: 'CONTRIBUTOR' } } } });
  const shared = await prisma.showcaseItem.create({ data: { creatorId: authorId, slug: 'participant-shared', title: 'Shared scope contribution', summary: '', status: 'PUBLISHED', reviewStatus: 'PENDING_REVIEW', reviewVersion: 5, rejectionReason: 'SECRET REVIEW', contributors: { create: { userId: participant.id, role: 'ADVISOR' } } } });
  const draft = await prisma.showcaseItem.create({ data: { creatorId: authorId, slug: 'participant-hidden-draft', title: 'Shared scope secret draft', summary: '', status: 'DRAFT', contributors: { create: { userId: participant.id, role: 'CONTRIBUTOR' } } } });
  for (const q of ['', 'shared scope']) {
    const result = await listAuthorItems({ actor, q, filter: 'ALL', page: 1 });
    expect(result.total).toBe(3);
    expect(new Set(result.items.map(item => item.id))).toEqual(new Set([own.id, shared.id, draft.id]));
    expect(result.items.find(item => item.id === own.id)?.canManage).toBe(true);
    expect(result.items.find(item => item.id === shared.id)).toMatchObject({ canManage: false, reviewStatus: 'PENDING_REVIEW', reviewVersion: 0, rejectionReason: null });
    expect(JSON.stringify(result)).not.toContain('SECRET REVIEW');
  }
  expect((await listAuthorItems({ actor, q: '', filter: 'PENDING_REVIEW', page: 1 })).total).toBe(1);
  expect((await listAuthorItems({ actor, q: 'shared scope', filter: 'DRAFT', page: 1 })).items.map(item => item.id)).toEqual([draft.id]);
  expect(await authorItemStats(actor)).toMatchObject({ ALL: 3, PUBLISHED: 2, PENDING_REVIEW: 1, DRAFT: 1 });
});
