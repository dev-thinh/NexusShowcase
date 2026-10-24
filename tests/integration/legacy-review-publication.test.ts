import { decideSubmissionCommand } from '@/features/review/server/decision-command';
import { beforeAll, expect, it } from 'vitest';
import { prisma } from '../fixtures/database';
let actor: { id: string; fullName: string; role: 'ADMIN'; status: 'ACTIVE'; mustChangePassword: false };
let categoryId: string;
beforeAll(async () => {
  const admin = await prisma.user.create({ data: { email: 'legacy-review@nexus.test', fullName: 'Admin', role: 'ADMIN', status: 'ACTIVE' } });
  actor = { id: admin.id, fullName: admin.fullName, role: 'ADMIN', status: 'ACTIVE', mustChangePassword: false };
  categoryId = (await prisma.category.create({ data: { name: 'Legacy robotics', slug: 'robotics-iot' } })).id;
});
it.each([false, true])('publishes immutable tagged history with legacy issuer override=%s', async editorial => {
  const snapshot = { title: 'Legacy title', summary: 'Legacy summary', content: '', type: 'PROJECT', categoryId, publishedYear: 2026, suggestedField: '', customProjectType: '', contributors: [{ userId: actor.id, role: 'CONTRIBUTOR', displayOrder: 0 }], resources: [], tags: ['immutable-history'] };
  const item = await prisma.showcaseItem.create({ data: { creatorId: actor.id, categoryId, title: 'Old live title', summary: '', slug: `legacy-tagged-${editorial}`, status: 'PENDING_REVIEW', reviewVersion: 0, revisions: { create: { revisionNumber: 1, submittedById: actor.id, snapshot } }, ...(editorial ? { editorialDraft: { create: { overrides: { title: 'Editorial title', issuer: 'Legacy conference' } } } } : {}) } });
  expect(await decideSubmissionCommand(actor, { itemId: item.id, reviewVersion: 0, action: 'PUBLISH', visibility: 'PUBLIC' })).toMatchObject({ success: true });
  expect(await prisma.showcaseItem.findUniqueOrThrow({ where: { id: item.id } })).toMatchObject({ status: 'PUBLISHED', title: editorial ? 'Editorial title' : 'Legacy title', ...(editorial ? { issuer: 'Legacy conference' } : {}) });
  const history = await prisma.submissionRevision.findFirstOrThrow({ where: { itemId: item.id } });
  expect(history.snapshot).toEqual(snapshot);
});
