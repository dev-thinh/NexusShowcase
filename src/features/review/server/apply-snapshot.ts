import type { EffectivePublication } from '@/features/submissions/model/snapshot';
import { snapshotRelations } from '@/features/submissions/server/snapshot-relations';
import { StateConflict } from '@/server/db/command-error';
import { Prisma } from '@prisma/client';

export async function applyReviewedSnapshot(tx: Prisma.TransactionClient, input: { itemId: string; expectedReviewVersion: number; snapshot: EffectivePublication; visibility: 'PUBLIC' | 'PRIVATE' }): Promise<{ slug: string; memberIds: string[] }> {
  const { itemId, snapshot, expectedReviewVersion, visibility } = input;
  const previous = await tx.showcaseItem.findUniqueOrThrow({ where: { id: itemId }, select: { slug: true, publishedAt: true, categoryId: true, thumbnailUrl: true, contributors: { select: { userId: true } } } });
  const categoryId = snapshot.categoryId ?? previous.categoryId;
  const category = categoryId ? await tx.category.findUnique({ where: { id: categoryId }, select: { slug: true } }) : null;
  if (!category || !['bai-bao-khoa-hoc', 'robotics-iot'].includes(category.slug)) throw new StateConflict();
  const changed = await tx.showcaseItem.updateMany({ where: { id: itemId, reviewVersion: expectedReviewVersion }, data: {
    title: snapshot.title, summary: snapshot.summary, content: snapshot.content,
    type: category.slug === 'bai-bao-khoa-hoc' ? 'RESEARCH_PAPER' : 'PROJECT', categoryId,
    thumbnailUrl: snapshot.thumbnailUrl === undefined ? previous.thumbnailUrl : snapshot.thumbnailUrl,
    publishedYear: snapshot.publishedYear, suggestedField: snapshot.suggestedField, customProjectType: snapshot.customProjectType,
    issuer: snapshot.issuer,
    status: 'PUBLISHED', visibility, publishedAt: previous.publishedAt ?? new Date(),
    authorDraft: Prisma.DbNull, reviewStatus: null, rejectionReason: null, reviewVersion: { increment: 1 },
  } });
  if (changed.count !== 1) throw new StateConflict();
  const relations = snapshotRelations(snapshot);
  await tx.itemContributor.deleteMany({ where: { itemId } });
  await tx.itemLink.deleteMany({ where: { itemId } });
  await tx.itemAttachment.deleteMany({ where: { itemId } });
  await tx.showcaseItem.update({ where: { id: itemId }, data: {
    contributors: { create: relations.contributors }, links: { create: relations.links }, attachments: { create: relations.attachments },
  } });
  return { slug: previous.slug, memberIds: [...new Set([...previous.contributors.map(contributor => contributor.userId), ...snapshot.contributors.map(contributor => contributor.userId)].filter((id): id is string => !!id))] };
}
