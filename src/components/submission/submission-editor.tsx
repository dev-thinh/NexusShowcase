'use client';

import type { Role } from '@prisma/client';
import type { ShowcaseDraftInput } from '@/lib/action-schemas';
import { BasicInformationFields } from './basic-information-fields';
import { SubmissionActionBar } from './submission-action-bar';
import { useSubmissionEditor } from './use-submission-editor';
import { ContributorEditor } from './contributor-editor';
import { ResourceEditor } from './resource-editor';
import { OptionalDetails } from './optional-details';
import { ReviewComments, type AuthorReviewComment } from './review-comments';

export interface SubmissionEditorProps {
  initialData: Partial<ShowcaseDraftInput> & { id?: string };
  currentUser: { id: string; fullName: string; role: Role };
  clubMembers: Array<{ id: string; fullName: string }>;
  mode: 'create' | 'edit';
  reviewComments?: AuthorReviewComment[];
}

export function SubmissionEditor({ initialData, currentUser, clubMembers, reviewComments = [] }: SubmissionEditorProps) {
  const dataWithAuthor = initialData.contributors?.length ? initialData : {
    ...initialData,
    contributors: [{ userId: currentUser.id, role: 'PROJECT_LEAD' as const, displayOrder: 0 }],
  };
  const { state, updateField, saveDraft, submitForReview } = useSubmissionEditor(dataWithAuthor);
  return (
    <form className="panel-detail max-w-6xl overflow-hidden !p-0" onSubmit={(event) => event.preventDefault()} noValidate>
      {state.formError && <div role="alert" className="border-b border-rose-200 bg-rose-50 px-6 py-3 text-sm font-medium text-rose-800 sm:px-8">{state.formError}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(20rem,5fr)] lg:divide-x lg:divide-slate-200">
        <section className="p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Hồ sơ công trình</p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">Thông tin cơ bản</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Trình bày ngắn gọn vấn đề nghiên cứu, phương pháp và đóng góp chính.</p>
          <div className="mt-6"><BasicInformationFields value={state.data} errors={state.fieldErrors} onChange={updateField} reviewComments={reviewComments} /></div>
          <OptionalDetails content={state.data.content ?? ''} onContentChange={(content) => updateField('content', content)} />
        </section>

        <div className="divide-y divide-slate-200 bg-slate-50/40">
          <section className="p-6 sm:p-8 lg:p-6 xl:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Nhóm thực hiện</p>
            <h2 className="mt-2 text-lg font-bold text-slate-950">
              Tác giả và người đóng góp <span className="text-rose-700" aria-hidden="true">*</span>
              <span className="sr-only"> (Bắt buộc khi gửi)</span>
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Thêm người tham gia và xác định vai trò.</p>
            <ReviewComments comments={reviewComments} fieldKey="contributors" />
            <ContributorEditor value={state.data.contributors ?? []} clubMembers={clubMembers} onChange={(contributors) => updateField('contributors', contributors)} />
          </section>
          <section className="p-6 sm:p-8 lg:p-6 xl:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Minh chứng</p>
            <h2 className="mt-2 text-lg font-bold text-slate-950">Tài nguyên đính kèm</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Bổ sung hình ảnh, PDF hoặc liên kết cần thiết.</p>
            <ReviewComments comments={reviewComments} fieldKey="resources" />
            <ResourceEditor value={state.data.resources ?? []} onChange={(resources) => updateField('resources', resources)} />
          </section>
        </div>
      </div>
      <SubmissionActionBar saveState={state.saveState} onSave={() => void saveDraft()} onSubmit={() => void submitForReview()} />
    </form>
  );
}
