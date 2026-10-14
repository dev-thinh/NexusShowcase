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
  const driveResource = (state.data.resources ?? []).find((resource) => resource.kind === 'LINK' && resource.label === 'Google Drive');
  return (
    <form className="max-w-4xl divide-y divide-slate-200 bg-white" onSubmit={(event) => event.preventDefault()} noValidate>
      {state.formError && <div role="alert" className="mb-2 border-l-2 border-rose-600 py-2 pl-3 text-sm text-rose-800">{state.formError}</div>}
      <section className="pb-8">
        <h2 className="text-lg font-bold text-slate-950">Thông tin cơ bản</h2>
        <div className="mt-5"><BasicInformationFields value={state.data} errors={state.fieldErrors} onChange={updateField} reviewComments={reviewComments} /></div>
      </section>
      <section className="py-8">
        <h2 className="text-lg font-bold text-slate-950">Tác giả và người đóng góp</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Thêm những người trực tiếp tham gia công trình và sắp xếp theo thứ tự hiển thị.</p>
        <ReviewComments comments={reviewComments} fieldKey="contributors" />
        <ContributorEditor value={state.data.contributors ?? []} clubMembers={clubMembers} onChange={(contributors) => updateField('contributors', contributors)} />
      </section>
      <section className="pt-8">
        <h2 className="text-lg font-bold text-slate-950">Tài nguyên và thông tin bổ sung</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Đính kèm tài liệu, hình ảnh hoặc liên kết giúp hội đồng hiểu và kiểm chứng công trình.</p>
        <ReviewComments comments={reviewComments} fieldKey="resources" />
        <ResourceEditor value={state.data.resources ?? []} onChange={(resources) => updateField('resources', resources)} />
        <OptionalDetails content={state.data.content ?? ''} driveUrl={driveResource?.url ?? ''} onContentChange={(content) => updateField('content', content)} onDriveUrlChange={(url) => {
          const resources = (state.data.resources ?? []).filter((resource) => !(resource.kind === 'LINK' && resource.label === 'Google Drive'));
          updateField('resources', url ? [...resources, { kind: 'LINK', label: 'Google Drive', url }] : resources);
        }} />
        <SubmissionActionBar saveState={state.saveState} onSave={() => void saveDraft()} onSubmit={() => void submitForReview()} />
      </section>
    </form>
  );
}
