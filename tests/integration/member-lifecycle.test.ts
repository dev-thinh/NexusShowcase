import { beforeEach, expect, it } from 'vitest';
import { prisma } from '../fixtures/database';
import { searchLifecycleMembers } from '@/features/identity/server/bulk-member-queries';
import { manageMemberAccounts } from '@/features/identity/server/member-lifecycle';
import { decideSubmissionCommand } from '@/features/review/server/decision-command';
import { deletePublishedPost } from '@/features/publications/server/delete-command';
import type { Actor } from '@/features/identity/model/session';
let actor: Actor;
let sequence = 0;
beforeEach(async () => {
  const admin = await prisma.user.create({ data: { fullName: 'Admin', email: `lifecycle-admin-${sequence++}@test.invalid`, role: 'ADMIN', status: 'ACTIVE' } });
  actor = { ...admin, status: 'ACTIVE' };
});
const member = () => prisma.user.create({ data: { fullName: 'Nguyễn An', email: `member-${sequence++}@test.invalid`, role: 'MEMBER', status: 'ACTIVE' } });
it('disables a batch atomically and revokes sessions', async () => {
  const users = await Promise.all([member(), member()]);
  expect(await manageMemberAccounts(actor, { operation: 'DISABLE', members: users.map(user => ({ id: user.id, expectedVersion: user.sessionVersion })) })).toMatchObject({ success: true, data: { count: 2 } });
  const saved = await prisma.user.findMany({ where: { id: { in: users.map(user => user.id) } } });
  expect(saved.every(user => user.status === 'SUSPENDED' && user.deletedAt && user.sessionVersion === 2)).toBe(true);
});
it('rejects stale batches, self deletion and protected administrators without changing other accounts', async () => {
  const user = await member();
  const selection = { id: user.id, expectedVersion: user.sessionVersion };
  expect(await manageMemberAccounts(actor, { operation: 'DELETE', members: [selection, { id: actor.id, expectedVersion: 1 }] })).toMatchObject({ success: false, code: 'FORBIDDEN' });
  expect(await manageMemberAccounts(actor, { operation: 'DISABLE', members: [{ ...selection, expectedVersion: 99 }] })).toMatchObject({ success: false, code: 'CONFLICT' });
  expect(await prisma.user.findUnique({ where: { id: user.id } })).toMatchObject({ status: 'ACTIVE', sessionVersion: 1 });
});
it('permanently deletes accounts while preserving posts, external author names and review history', async () => {
  const user = await member();
  const snapshot = { title: 'Robot', contributors: [{ userId: user.id, role: 'FIRST_AUTHOR', displayName: user.fullName }] };
  const post = await prisma.showcaseItem.create({ data: { title: 'Robot', slug: `robot-${sequence++}`, summary: 'Research', creatorId: user.id, status: 'PUBLISHED', authorDraft: snapshot, contributors: { create: { userId: user.id, role: 'FIRST_AUTHOR' } }, revisions: { create: { revisionNumber: 1, submittedById: user.id, snapshot } }, editorialDraft: { create: { assignedEditorId: user.id, overrides: snapshot } }, auditEvents: { create: { actorId: user.id, action: 'CREATED' } }, reviewComments: { create: { authorId: user.id, resolvedById: user.id, fieldKey: 'title', body: 'Review', audience: 'AUTHOR', severity: 'SUGGESTION' } } } });
  expect(await manageMemberAccounts(actor, { operation: 'DELETE', members: [{ id: user.id, expectedVersion: 1 }] })).toMatchObject({ success: true });
  expect(await prisma.user.findUnique({ where: { id: user.id } })).toBeNull();
  const saved = await prisma.showcaseItem.findUniqueOrThrow({ where: { id: post.id }, include: { creator: true, contributors: true, revisions: true, editorialDraft: true, auditEvents: true, reviewComments: true } });
  expect(saved.status).toBe('PUBLISHED');
  expect(saved.creator.hiddenFromDirectory).toBe(true);
  expect(saved.creator.passwordHash).toBeNull();
  expect(saved.contributors[0]).toMatchObject({ userId: null, externalName: user.fullName, role: 'FIRST_AUTHOR' });
  for (const json of [saved.authorDraft, saved.revisions[0].snapshot, saved.editorialDraft?.overrides]) expect(json).toMatchObject({ contributors: [{ userId: null, externalName: user.fullName }] });
  expect(saved.editorialDraft?.assignedEditorId).toBeNull();
  expect(saved.reviewComments[0].resolvedById).toBeNull();
  expect(saved.auditEvents).toHaveLength(1);
});
it('rechecks administrator authority inside destructive commands', async () => {
  const user = await member();
  await prisma.user.update({ where: { id: actor.id }, data: { role: 'MEMBER' } });
  expect(await manageMemberAccounts(actor, { operation: 'DELETE', members: [{ id: user.id, expectedVersion: 1 }] })).toMatchObject({ success: false, code: 'FORBIDDEN' });
  expect(await deletePublishedPost(actor, { itemId: user.id, expectedVersion: 0 })).toMatchObject({ success: false, code: 'FORBIDDEN' });
});
it('lets an admin delete a published post and its dependent history only at the observed version', async () => {
  const post = await prisma.showcaseItem.create({ data: { title: 'Delete me', slug: `delete-${sequence++}`, summary: 'Test', creatorId: actor.id, status: 'PUBLISHED', auditEvents: { create: { actorId: actor.id, action: 'CREATED' } } } });
  expect(await deletePublishedPost(actor, { itemId: post.id, expectedVersion: 99 })).toMatchObject({ success: false, code: 'CONFLICT' });
  expect(await prisma.showcaseItem.count({ where: { id: post.id } })).toBe(1);
  expect(await deletePublishedPost(actor, { itemId: post.id, expectedVersion: post.reviewVersion })).toMatchObject({ success: true });
  expect(await prisma.showcaseItem.count({ where: { id: post.id } })).toBe(0);
  expect(await prisma.auditEvent.count({ where: { itemId: post.id } })).toBe(0);
});

it('preserves legacy editorial corrections when the deleted creator has a version-zero submission', async () => {
  const user = await member();
  const category = await prisma.category.create({ data: { name: 'Legacy lifecycle', slug: 'robotics-iot' } });
  const snapshot = { title: 'Original title', summary: 'Original summary', content: '', type: 'PROJECT', categoryId: category.id, publishedYear: 2026, suggestedField: '', customProjectType: '', contributors: [{ userId: user.id, role: 'CONTRIBUTOR', displayOrder: 0 }], resources: [], tags: [] };
  const post = await prisma.showcaseItem.create({ data: { creatorId: user.id, categoryId: category.id, title: 'Live title', summary: '', slug: `legacy-lifecycle-post-${sequence++}`, status: 'PENDING_REVIEW', reviewVersion: 0, authorDraft: snapshot, revisions: { create: { revisionNumber: 1, submittedById: user.id, snapshot } }, editorialDraft: { create: { overrides: { title: 'Corrected editorial title', summary: 'Corrected editorial summary' } } } } });
  expect(await manageMemberAccounts(actor, { operation: 'DELETE', members: [{ id: user.id, expectedVersion: 1 }] })).toMatchObject({ success: true });
  const updated = await prisma.showcaseItem.findUniqueOrThrow({ where: { id: post.id } });
  expect(updated.reviewVersion).toBe(0);
  const published = await decideSubmissionCommand(actor, { itemId: post.id, reviewVersion: updated.reviewVersion, action: 'PUBLISH', visibility: 'PUBLIC' });
  expect(published, JSON.stringify(published)).toMatchObject({ success: true });
  expect(await prisma.showcaseItem.findUniqueOrThrow({ where: { id: post.id } })).toMatchObject({ title: 'Corrected editorial title', summary: 'Corrected editorial summary' });
  expect(await prisma.itemContributor.findFirst({ where: { itemId: post.id } })).toMatchObject({ userId: null, externalName: user.fullName });
});

it('searches the correct accounts for disable and delete, excluding administrators and hidden accounts', async () => {
  const active = await member();
  const disabled = await member();
  const hidden = await member();
  const name = `Lifecycle search ${sequence++}`;
  await prisma.user.updateMany({ where: { id: { in: [active.id, disabled.id, hidden.id, actor.id] } }, data: { fullName: name } });
  await prisma.user.update({ where: { id: disabled.id }, data: { status: 'SUSPENDED', deletedAt: new Date() } });
  await prisma.user.update({ where: { id: hidden.id }, data: { hiddenFromDirectory: true } });
  const forDisable = await searchLifecycleMembers(actor.id, { operation: 'DISABLE', query: name, page: 1 });
  const forDelete = await searchLifecycleMembers(actor.id, { operation: 'DELETE', query: name, page: 1 });
  expect(forDisable.items.map(user => user.id)).toEqual([active.id]);
  expect(forDelete.items.map(user => user.id).sort()).toEqual([active.id, disabled.id].sort());
});
