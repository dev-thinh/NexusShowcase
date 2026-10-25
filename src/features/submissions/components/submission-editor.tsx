'use client';

import { MediaImage } from '@/shared/ui/media-image';

import { ArticleContent, ArticleTableOfContents } from '@/features/submissions/components/article-content';
import { ResourceLinks } from '@/features/submissions/components/resource-links';
import { articleFromLegacy, type ArticleBlock } from '@/features/submissions/model/article';
import type { ShowcaseDraftInput } from '@/features/submissions/model/input';
import { useDialog } from '@/shared/dialogs/dialog-provider';
import type { Role } from '@prisma/client';
import { useEffect, useRef, useState } from 'react';
import { BasicInformationFields } from './basic-information-fields';
import { ContributorEditor } from './contributor-editor';
import { ResourceEditor } from './resource-editor';
import { ReviewComments, type AuthorReviewComment } from './review-comments';
import { SectionEditor } from './section-editor';
import { SubmissionActionBar } from './submission-action-bar';
import { useSubmissionEditor } from './use-submission-editor';
import { notifySuccess } from '@/shared/dialogs/success';

export interface SubmissionEditorProps {
  initialData: Partial<ShowcaseDraftInput> & { id?: string; reviewVersion?: number };
  currentUser: { id: string; fullName: string; role: Role };
  clubMembers: Array<{ id: string; fullName: string }>;
  categories?: Array<{ id: string; name: string; slug: string }>;
  mode: 'create' | 'edit';
  reviewComments?: AuthorReviewComment[];
}

export function SubmissionEditor({ initialData, currentUser, clubMembers, categories = [], reviewComments = [] }: SubmissionEditorProps) {
  const dialog = useDialog();
  const dataWithAuthor = initialData.contributors?.length ? initialData : {
    ...initialData,
    contributors: [{ userId: currentUser.id, role: 'CONTRIBUTOR' as const, displayOrder: 0 }],
  };
  const { state, updateField, saveDraft, submitForReview } = useSubmissionEditor(dataWithAuthor);
  const [preview, setPreview] = useState(false);
  const [uploads, setUploads] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const busy = state.saveState === 'saving' || uploads > 0;
  useEffect(() => {
    if (!state.formError) return;
    setPreview(false);
    requestAnimationFrame(() => {
      const target = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]') || formRef.current?.querySelector<HTMLElement>('[role="alert"]');
      target?.focus(); target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [state.formError]);
  const content = state.data.content ?? '';
  const images = articleFromLegacy(content, state.data.resources ?? []).sections.flatMap(section => section.blocks).filter((block): block is Extract<ArticleBlock, { kind: 'IMAGE' }> => block.kind === 'IMAGE' && !!block.url);
  return (
    <form ref={formRef} className="panel-detail w-full !p-0" onSubmit={event => event.preventDefault()} noValidate>
      {state.formError && <div role="alert" tabIndex={-1} className="border-b border-slate-200 bg-[#FFFFFF] px-6 py-3 text-sm font-semibold text-[#1F2937] sm:px-8">{state.formError}</div>}
      {reviewComments.length > 0 && <aside aria-label="Yêu cầu chỉnh sửa" className="border-b border-slate-200 bg-[#FFFFFF] px-6 py-4 text-sm text-[#1F2937] sm:px-8"><h2 className="font-semibold">Phản hồi cần xử lý</h2><ul className="mt-2 list-disc space-y-1 pl-5">{reviewComments.filter(comment => comment.audience === 'AUTHOR').map(comment => <li key={comment.id}>{comment.body}</li>)}</ul></aside>}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4 sm:px-8"><p className="text-sm font-semibold text-[#1F2937]">{preview ? 'Bản xem trước · Chưa xuất bản' : 'Workspace soạn thảo'}</p><button type="button" className="action-secondary-detail min-h-10" onClick={() => setPreview(value => !value)}>{preview ? 'Quay lại soạn thảo' : 'Xem trước'}</button></div>
      {preview ? <div className="space-y-8 p-6 sm:p-8">
        <h1 className="break-words text-3xl font-semibold text-[#1F2937]">{state.data.title || 'Tiêu đề công trình'}</h1>
        {<MediaImage src={state.data.thumbnailUrl} alt="Ảnh đại diện" className="mx-auto flex min-h-40 w-full max-h-[24rem] max-w-full rounded-md object-contain" />}
        <ArticleTableOfContents content={content} />
        <section id="abstract" className="scroll-mt-36"><h2 className="mb-3 text-xl font-semibold text-[#1F2937]">Abstract / Tóm tắt</h2><p className="whitespace-pre-line break-words text-base leading-8 text-[#1F2937]">{state.data.summary || 'Chưa có tóm tắt.'}</p></section>
        <ArticleContent content={content} />
        <section><h2 className="mb-4 text-lg font-semibold text-[#1F2937]">Tài nguyên</h2><ResourceLinks resources={state.data.resources ?? []} /></section>
      </div> : <fieldset disabled={busy} className="min-w-0 disabled:opacity-70">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(18rem,4fr)] lg:divide-x lg:divide-[#153D67]">
          <section className="p-6 sm:p-8"><h2 className="text-xl font-semibold text-[#1F2937]">Thông tin công trình</h2><div className="mt-6"><BasicInformationFields value={state.data} errors={state.fieldErrors} onChange={updateField} reviewComments={reviewComments} categories={categories} thumbnailImages={images} onBusy={value => setUploads(count => Math.max(0, count + (value ? 1 : -1)))} /></div>

          </section>
          <div className="min-w-0 border-t border-slate-200 bg-[#FFFFFF] p-6 sm:p-8 lg:border-t-0">
            <section aria-labelledby="submission-contributors-title"><h2 id="submission-contributors-title" className="text-lg font-semibold text-[#1F2937]">Tác giả và người đóng góp</h2><p className="mt-2 text-sm leading-6 text-[#1F2937]">Thêm người tham gia và xác nhận vai trò của từng người.</p><ReviewComments comments={reviewComments} fieldKey="contributors" />{!!state.fieldErrors.contributors?.length && <p role="alert" tabIndex={-1} className="mt-2 text-sm text-rose-800">{state.fieldErrors.contributors[0]}</p>}<ContributorEditor value={state.data.contributors ?? []} clubMembers={clubMembers} onChange={contributors => updateField('contributors', contributors)} /></section>
            <section className="mt-7 border-t border-slate-200 pt-6" aria-labelledby="submission-resources-title">
              <h2 id="submission-resources-title" className="text-lg font-semibold text-[#1F2937]">Tài nguyên đính kèm</h2>
              <p className="mt-2 text-sm leading-6 text-[#1F2937]">Thêm tệp hoặc liên kết bổ sung cho bài viết.</p>
              <ReviewComments comments={reviewComments} fieldKey="resources" />
              {!!state.fieldErrors.resources?.length && <p role="alert" className="mt-2 text-sm text-[#1F2937]">{state.fieldErrors.resources[0]}</p>}
              <ResourceEditor value={state.data.resources ?? []} onChange={value => updateField('resources', value)} onBusy={value => setUploads(count => Math.max(0, count + (value ? 1 : -1)))} />
            </section>
          </div>
        </div>
        <div className="space-y-5 border-t border-slate-200 p-6 sm:p-8">
          <ReviewComments comments={reviewComments} fieldKey="content" />
          {!!state.fieldErrors.content?.length && <p role="alert" tabIndex={-1} className="text-sm text-[#1F2937]">{state.fieldErrors.content[0]}</p>}
          <SectionEditor content={content} resources={[]} onBusy={value => setUploads(count => Math.max(0, count + (value ? 1 : -1)))} onChange={value => updateField('content', value)} />

        </div>

      </fieldset>}
      <SubmissionActionBar preview={preview} onPreview={() => setPreview(value => !value)} saveState={state.saveState} disabled={uploads > 0} onSave={async () => { if (await saveDraft()) await notifySuccess('Đã lưu bản nháp công trình.'); }} onSubmit={async () => { if (await dialog.confirm({ title: 'Gửi bài duyệt', message: 'Bạn sẽ không thể chỉnh sửa trong khi bài chờ duyệt.', confirmLabel: 'Gửi duyệt' })) await submitForReview(); }} />
    </form>
  );
}
