import { beforeAll, expect, it, vi } from 'vitest';
import { prisma } from '../fixtures/database';
import type { Actor } from '@/features/identity/model/session';
import { saveDraftCommand, submitDraftCommand } from '@/features/submissions/server/draft-commands';
import { decideSubmissionCommand } from '@/features/review/server/decision-command';
import { listAuthorItems } from '@/features/submissions/server/queries';
import { listMemberPublications, listPublications } from '@/features/publications/server/queries';

vi.mock('@/features/identity/server/session', () => ({ getSession: async () => null }));

let author: Actor, reviewer: Actor, contributorId: string, categoryId: string, projectCategoryId: string;
const conference = { name: 'Hội nghị Robotics 2027', status: 'ACCEPTED', eventDate: '2027-03-08', acceptedDate: '2026-12-20', rankings: [{ system: 'Hệ thống A', rank: 'Hạng 1' }, { system: 'Hệ thống B', rank: 'Hạng 2' }] };
beforeAll(async () => {
  for (const role of ['CORE_MEMBER', 'ADMIN'] as const) {
    const user = await prisma.user.create({ data: { email: `${role}@conference.test`, fullName: role, role, status: 'ACTIVE' } });
    const actor: Actor = { id: user.id, fullName: user.fullName, role, status: 'ACTIVE', mustChangePassword: false };
    if (role === 'ADMIN') reviewer = actor; else author = actor;
  }
  contributorId = (await prisma.user.create({ data: { email: 'contributor@conference.test', fullName: 'Actual author', status: 'ACTIVE', role: 'MEMBER' } })).id;
  categoryId = (await prisma.category.create({ data: { name: 'Nghiên cứu khoa học', slug: 'bai-bao-khoa-hoc' } })).id;
  projectCategoryId = (await prisma.category.create({ data: { name: 'Dự án', slug: 'robotics-iot' } })).id;
});

it.each(['RESEARCH_PAPER', 'PROJECT'] as const)('preserves conference information through review for %s and isolates published edits', async type => {
  const draft = { title: `Conference workflow ${type}`, type, categoryId: type === 'RESEARCH_PAPER' ? categoryId : projectCategoryId, summary: 'A research summary', conference,
    contributors: [{ userId: contributorId, role: 'FIRST_AUTHOR', displayOrder: 0 }],
    resources: [{ kind: 'LINK', label: 'Full paper', linkType: 'PAPER_URL', url: 'https://example.org/paper' }],
  };
  const saved = await saveDraftCommand(author, { itemId: null, draft });
  expect(saved.success).toBe(true);
  if (!saved.success) throw Error(saved.error);
  const id = saved.data.id;
  const submitted = await submitDraftCommand(author, { itemId: id, expectedReviewVersion: saved.data.reviewVersion });
  expect(submitted.success).toBe(true);
  if (!submitted.success) throw Error(submitted.error);
  expect((await prisma.submissionRevision.findFirstOrThrow({ where: { itemId: id } })).snapshot).toMatchObject({ conference });
  expect(await decideSubmissionCommand(reviewer, { itemId: id, reviewVersion: submitted.data.reviewVersion, action: 'PUBLISH', visibility: 'PUBLIC' })).toMatchObject({ success: true });
  const published = await prisma.showcaseItem.findUniqueOrThrow({ where: { id } });
  expect(published.conference).toEqual(conference);
  const publicItems = await listPublications({ authenticated: false, sort: 'newest', page: 1, pageSize: 10 });
  expect(publicItems.items.find(item => item.id === id)?.conference).toEqual(conference);
  // The uploader can manage the post without being credited as a contributor.
  expect((await listAuthorItems({ actor: author, filter: 'ALL', q: '', page: 1 })).items.find(item => item.id === id)?.canManage).toBe(true);
  expect((await listMemberPublications({ memberId: author.id, authenticated: false, page: 1 })).total).toBe(0);
  expect((await listMemberPublications({ memberId: contributorId, authenticated: false, page: 1 })).items.map(item => item.id)).toContain(id);

  const changedConference = { ...conference, status: 'PUBLISHED', publicationDate: '2027-03-01', paperUrl: 'https://doi.org/10.1234/paper' };
  const changed = await saveDraftCommand(author, { itemId: id, expectedReviewVersion: published.reviewVersion, draft: { ...draft, conference: changedConference } });
  if (!changed.success) throw Error(changed.error);
  expect((await prisma.showcaseItem.findUniqueOrThrow({ where: { id } })).conference).toEqual(conference);
  const changedSubmission = await submitDraftCommand(author, { itemId: id, expectedReviewVersion: changed.data.reviewVersion });
  if (!changedSubmission.success) throw Error(changedSubmission.error);
  expect(await decideSubmissionCommand(reviewer, { itemId: id, reviewVersion: changedSubmission.data.reviewVersion, action: 'PUBLISH', visibility: 'PUBLIC' })).toMatchObject({ success: true });
  const updatedPublication = await prisma.showcaseItem.findUniqueOrThrow({ where: { id } });
  expect(updatedPublication.conference).toEqual(changedConference);
  expect(updatedPublication.citationEnabled).toBe(true);

  const updated = await saveDraftCommand(author, { itemId: id, expectedReviewVersion: updatedPublication.reviewVersion, draft: { ...draft, conference: null } });
  expect(updated.success).toBe(true);
  if (!updated.success) throw Error(updated.error);
  expect((await prisma.showcaseItem.findUniqueOrThrow({ where: { id } })).conference).toEqual(changedConference);
  const resubmitted = await submitDraftCommand(author, { itemId: id, expectedReviewVersion: updated.data.reviewVersion });
  expect(resubmitted.success).toBe(true);
  if (!resubmitted.success) throw Error(resubmitted.error);
  expect(await decideSubmissionCommand(reviewer, { itemId: id, reviewVersion: resubmitted.data.reviewVersion, action: 'PUBLISH', visibility: 'PUBLIC' })).toMatchObject({ success: true });
  expect((await prisma.showcaseItem.findUniqueOrThrow({ where: { id } })).conference).toBeNull();
});

it('rejects a hidden admin supplied directly as a contributor when saving', async () => {
  const hidden = await prisma.user.create({ data: { email: 'hidden@conference.test', fullName: 'Hidden admin', role: 'ADMIN', status: 'ACTIVE', hiddenFromDirectory: true } });
  const result = await saveDraftCommand(author, { itemId: null, draft: { title: 'Hidden contributor', contributors: [{ userId: hidden.id, role: 'CONTRIBUTOR', displayOrder: 0 }] } });
  expect(result).toMatchObject({ success: false, code: 'VALIDATION', fieldErrors: { contributors: [expect.any(String)] } });
});
