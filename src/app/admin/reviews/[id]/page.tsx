import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/current-user';
import { prisma } from '@/lib/prisma';
import { buildSubmissionSnapshot } from '@/lib/submission-snapshot';
import { ReviewWorkspace } from '@/components/editorial/review-workspace';
import type { SubmissionSnapshot } from '@/lib/submission-types';

interface ReviewDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewDetailPage({ params }: ReviewDetailPageProps) {
  const actor = await getCurrentUser(['EDITOR', 'ADMIN']);
  if (!actor) {
    redirect('/login?callbackUrl=/admin/reviews');
  }

  const { id } = await params;

  const item = await prisma.showcaseItem.findUnique({
    where: { id },
    include: {
      contributors: {
        orderBy: { displayOrder: 'asc' },
      },
      links: true,
      attachments: true,
      category: true,
    },
  });

  if (!item) {
    notFound();
  }

  const [revisions, editorialDraft, categories, comments] = await Promise.all([
    prisma.submissionRevision.findMany({
      where: { itemId: id },
      orderBy: { revisionNumber: 'desc' },
    }),
    prisma.editorialDraft.findUnique({
      where: { itemId: id },
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.reviewComment.findMany({
      where: { itemId: id },
      include: {
        author: {
          select: { fullName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const fallbackSnapshot: SubmissionSnapshot = buildSubmissionSnapshot({
    title: item.title,
    summary: item.summary,
    content: item.content,
    publishedYear: item.publishedYear,
    suggestedField: item.suggestedField,
    customProjectType: item.customProjectType,
    contributors: item.contributors.map((c) => ({
      userId: c.userId,
      externalName: c.externalName,
      externalAffiliation: c.externalAffiliation,
      externalLink: c.externalLink,
      role: c.role as any,
      customRoleTitle: c.customRoleTitle,
      displayOrder: c.displayOrder,
    })),
    links: item.links,
    attachments: item.attachments,
  });

  const latestSnapshot = revisions[0]
    ? (revisions[0].snapshot as unknown as SubmissionSnapshot)
    : fallbackSnapshot;

  return (
    <ReviewWorkspace
      item={{
        id: item.id,
        title: item.title,
        status: item.status,
        slug: item.slug,
        categoryId: item.categoryId,
      }}
      snapshot={latestSnapshot}
      revisions={revisions.map((r) => ({
        id: r.id,
        revisionNumber: r.revisionNumber,
        submittedAt: r.submittedAt,
        snapshot: r.snapshot as unknown as SubmissionSnapshot,
      }))}
      editorialDraft={
        editorialDraft
          ? {
              assignedEditorId: editorialDraft.assignedEditorId,
              overrides: editorialDraft.overrides as any,
              checklist: editorialDraft.checklist as any,
            }
          : null
      }
      categories={categories}
      comments={comments.map((c) => ({
        id: c.id,
        fieldKey: c.fieldKey,
        body: c.body,
        audience: c.audience as any,
        severity: c.severity as any,
        status: c.status as any,
        author: c.author,
        createdAt: c.createdAt,
      }))}
      currentUser={{
        id: actor.id,
        role: actor.role as 'EDITOR' | 'ADMIN',
        fullName: actor.fullName,
      }}
      previewUrl={`/admin/reviews/${item.id}/preview`}
    />
  );
}
