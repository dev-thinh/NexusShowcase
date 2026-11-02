import bcrypt from 'bcryptjs';
import { expect, it } from 'vitest';
import { prisma } from '../fixtures/database';
import { seedFullDemo } from '../../prisma/demo-dataset';
import { showcaseSubmissionInputSchema } from '@/features/submissions/model/input';

const assets = {
  thumbnails: Array.from({ length: 12 }, (_, index) => ({ url: `/uploads/thumbnails/demo-full-image-${index}.png`, byteSize: 1024 })),
  avatars: [{ url: '/uploads/thumbnails/demo-full-avatar.png', byteSize: 512 }],
  document: { url: '/uploads/documents/demo-full-paper.pdf', byteSize: 2048 },
  resource: { url: '/uploads/resources/demo-full-source.zip', byteSize: 4096 },
};

it('creates the complete role, publication, review and gallery matrix and preserves edits on rerun', async () => {
  await seedFullDemo(prisma, assets);
  expect(await prisma.user.count()).toBe(60);
  expect(await prisma.showcaseItem.count()).toBe(56);
  const roles = await prisma.user.groupBy({ by: ['role'], _count: { _all: true } });
  expect(Object.fromEntries(roles.map(row => [row.role, row._count._all]))).toEqual({ ADMIN: 2, CORE_MEMBER: 10, MEMBER: 40, EDITOR: 4, GUEST: 4 });
  for (const type of ['PROJECT', 'RESEARCH_PAPER'] as const) {
    expect(await prisma.showcaseItem.count({ where: { type, status: 'PUBLISHED', visibility: 'PUBLIC' } })).toBeGreaterThanOrEqual(12);
    for (const status of ['DRAFT', 'PENDING_REVIEW', 'REVISION_REQUESTED', 'READY_FOR_APPROVAL', 'PUBLISHED', 'REJECTED', 'ARCHIVED'] as const) {
      expect(await prisma.showcaseItem.count({ where: { type, status } })).toBeGreaterThan(0);
    }
  }
  const core = await prisma.user.findUniqueOrThrow({ where: { email: 'core@gmail.com' } });
  expect(core).toMatchObject({ status: 'ACTIVE', mustChangePassword: false });
  expect(await bcrypt.compare('NexusDemo2026!Start', core.passwordHash!)).toBe(true);
  expect(await prisma.user.findUniqueOrThrow({ where: { email: 'member3@gmail.com' } })).toHaveProperty('mustChangePassword', true);
  expect(new Set((await prisma.user.findMany({ select: { status: true } })).map(user => user.status)).size).toBe(3);
  expect(await prisma.user.count({ where: { deletedAt: { not: null } } })).toBeGreaterThan(0);
  expect(await prisma.reviewComment.count({ where: { status: 'OPEN' } })).toBeGreaterThan(0);
  expect(await prisma.reviewComment.count({ where: { status: 'RESOLVED' } })).toBeGreaterThan(0);
  expect(await prisma.editorialDraft.count()).toBe(4);
  const pendingUpdate = await prisma.showcaseItem.findUniqueOrThrow({ where: { slug: 'demo-full-project-live-review-pending_review' } });
  expect((pendingUpdate.authorDraft as { title: string }).title).not.toBe(pendingUpdate.title);
  expect(await prisma.asset.count({ where: { provider: 'local', ownerId: core.id, byteSize: { gt: 0 } } })).toBe(15);
  expect(new Set((await prisma.showcaseItem.findMany({ where: { creatorId: core.id }, select: { status: true } })).map(item => item.status)).size).toBe(7);
  expect(await prisma.showcaseItem.count({ where: { isPinned: true } })).toBeLessThanOrEqual(3);
  for (const revision of await prisma.submissionRevision.findMany()) expect(showcaseSubmissionInputSchema.safeParse(revision.snapshot).success).toBe(true);
  const galleries = await prisma.homeMomentsGallery.findMany();
  expect(galleries.map(row => [row.id, (row.photos as unknown[]).length]).sort()).toEqual([['home', 12], ['research', 3]]);
  const post = await prisma.showcaseItem.findFirstOrThrow({ where: { slug: { startsWith: 'demo-full-' } } });
  await prisma.user.update({ where: { id: core.id }, data: { passwordHash: 'preserve-edited-credential' } });
  await prisma.showcaseItem.update({ where: { id: post.id }, data: { content: 'Preserve author edits' } });
  const before = { contributors: await prisma.itemContributor.count(), revisions: await prisma.submissionRevision.count(), comments: await prisma.reviewComment.count(), audits: await prisma.auditEvent.count(), assets: await prisma.asset.count() };
  await seedFullDemo(prisma, assets);
  expect(await prisma.user.count()).toBe(60);
  expect(await prisma.showcaseItem.count()).toBe(56);
  expect(await prisma.user.findUniqueOrThrow({ where: { id: core.id } })).toHaveProperty('passwordHash', 'preserve-edited-credential');
  expect(await prisma.showcaseItem.findUniqueOrThrow({ where: { id: post.id } })).toHaveProperty('content', 'Preserve author edits');
  expect({ contributors: await prisma.itemContributor.count(), revisions: await prisma.submissionRevision.count(), comments: await prisma.reviewComment.count(), audits: await prisma.auditEvent.count(), assets: await prisma.asset.count() }).toEqual(before);
});

it('rejects incomplete manifests before creating any records', async () => {
  const before = await prisma.user.count();
  await expect(seedFullDemo(prisma, { ...assets, thumbnails: assets.thumbnails.slice(0, 1) })).rejects.toThrow('twelve thumbnails');
  expect(await prisma.user.count()).toBe(before);
});
