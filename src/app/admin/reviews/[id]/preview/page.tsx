import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/current-user';
import { prisma } from '@/lib/prisma';
import { buildSubmissionSnapshot, mergeEditorialOverrides } from '@/lib/submission-snapshot';
import type { SubmissionSnapshot } from '@/lib/submission-types';

interface ReviewPreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewPreviewPage({ params }: ReviewPreviewPageProps) {
  const actor = await getCurrentUser(['EDITOR', 'ADMIN']);
  if (!actor) {
    redirect('/login?callbackUrl=/admin/reviews');
  }

  const { id } = await params;

  const item = await prisma.showcaseItem.findUnique({
    where: { id },
    include: {
      contributors: { orderBy: { displayOrder: 'asc' } },
      links: true,
      attachments: true,
      category: true,
    },
  });

  if (!item) {
    notFound();
  }

  const [revisions, editorialDraft] = await Promise.all([
    prisma.submissionRevision.findMany({
      where: { itemId: id },
      orderBy: { revisionNumber: 'desc' },
      take: 1,
    }),
    prisma.editorialDraft.findUnique({
      where: { itemId: id },
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

  const overrides = (editorialDraft?.overrides as any) || {};
  const effective = mergeEditorialOverrides(latestSnapshot, overrides);

  // Fetch category name if categoryId override is present
  let categoryName = item.category?.name || 'Chưa gán chuyên mục';
  if (overrides.categoryId && overrides.categoryId !== item.categoryId) {
    const cat = await prisma.category.findUnique({
      where: { id: overrides.categoryId },
      select: { name: true },
    });
    if (cat) categoryName = cat.name;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Editorial Preview Banner */}
      <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-medium sticky top-0 z-30 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider bg-slate-950 text-amber-400 px-1.5 py-0.5 rounded text-[10px]">
            Preview
          </span>
          <span>Chế độ xem trước bản biên tập (Chưa xuất bản chính thức)</span>
        </div>
        <Link
          href={`/admin/reviews/${item.id}`}
          className="bg-slate-950 text-white px-2.5 py-1 rounded text-xs hover:bg-slate-800 transition"
        >
          ← Quay lại không gian biên tập
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 space-y-8">
        {/* Header section */}
        <div className="space-y-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded font-medium border border-blue-200">
              {categoryName}
            </span>
            <span>•</span>
            <span className="uppercase tracking-wider font-mono text-[11px]">
              {effective.type || item.type}
            </span>
            <span>•</span>
            <span>Năm {effective.publishedYear || item.publishedYear}</span>
            {effective.issuer && (
              <>
                <span>•</span>
                <span>{effective.issuer}</span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {effective.title}
          </h1>

          <p className="text-base text-slate-600 leading-relaxed">
            {effective.summary}
          </p>

          {/* Tags */}
          {effective.tags && effective.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-2">
              {effective.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail if present */}
        {effective.thumbnailUrl && (
          <div className="rounded-lg overflow-hidden border border-slate-200 max-h-96 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={effective.thumbnailUrl}
              alt={effective.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Detailed content */}
        {effective.content && (
          <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-line">
            {effective.content}
          </div>
        )}

        {/* Contributors */}
        {effective.contributors.length > 0 && (
          <div className="pt-6 border-t border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Tác giả & Người thực hiện</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {effective.contributors.map((c, idx) => (
                <div key={idx} className="p-3 bg-white border border-slate-200 rounded">
                  <div className="font-medium text-slate-900">
                    {c.externalName || c.userId || 'Thành viên'}
                  </div>
                  {c.externalAffiliation && (
                    <div className="text-slate-500 text-[11px]">{c.externalAffiliation}</div>
                  )}
                  <div className="text-[11px] text-blue-600 font-medium mt-1">
                    {c.customRoleTitle || c.role}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resources */}
        {effective.resources.length > 0 && (
          <div className="pt-6 border-t border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Tài liệu & Liên kết</h2>
            <div className="divide-y divide-slate-200 bg-white border border-slate-200 rounded text-xs">
              {effective.resources.map((res, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-900">{res.label}</span>
                    <span className="block text-slate-400 text-[11px] truncate max-w-md">
                      {res.url}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                    {res.kind}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
