'use client';

import { CustomSelect } from '@/shared/ui/custom-select';
import { Plus, Trash2 } from 'lucide-react';
import { MAX_CONFERENCE_RANKINGS, type ConferenceInput } from '@/features/publications/model/conference';
import { SubmissionField } from './submission-field';

const inputClass = 'mt-2 min-h-11 w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#1F2937] outline-none focus:ring-2 focus:ring-[#153D67]/15';

export function ConferenceFields({ value, errors, onChange }: {
  value: ConferenceInput | null | undefined;
  errors: Record<string, string[]>;
  onChange: (value: ConferenceInput | null) => void;
}) {
  const rankings = value?.rankings ?? [];
  const published = value?.status === 'PUBLISHED';
  const patch = (update: Partial<ConferenceInput>) => onChange({ ...value!, ...update });
  return <section className="min-w-0 border-t border-slate-200 pt-6" aria-label="Thông tin hội nghị">
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-[#1F2937]">
      <input type="checkbox" checked={!!value} onChange={event => onChange(event.target.checked ? { name: '', status: 'ACCEPTED', rankings: [] } : null)} className="h-4 w-4 shrink-0 accent-[#153D67]" aria-controls="conference-fields" aria-expanded={!!value} />
      Bài có thông tin hội nghị
    </label>
    <p className="mt-1 text-sm leading-6 text-slate-500">Không bắt buộc. Có thể bổ sung ngày và xếp hạng sau khi có thông tin.</p>
    {value && <div id="conference-fields" className="mt-5 min-w-0 space-y-5">
      <SubmissionField name="conference" errors={errors}>
        <SubmissionField name="conference.name" errors={errors}>
          <label htmlFor="conference-name" className="block text-sm font-semibold">Tên hội nghị <span aria-hidden="true">*</span></label>
          <input id="conference-name" value={value.name} onChange={event => patch({ name: event.target.value })} maxLength={240} required aria-required="true" className={inputClass} />
        </SubmissionField>
      </SubmissionField>
      <SubmissionField name="conference.status" errors={errors}>
        <label htmlFor="conference-status" className="block text-sm font-semibold">Trạng thái công bố</label>
        <CustomSelect id="conference-status" className="mt-2" value={value.status ?? 'ACCEPTED'} options={[{ value: 'ACCEPTED', label: 'Đã chấp nhận' }, { value: 'PUBLISHED', label: 'Đã công bố' }]} onChange={status => patch({ status: status === 'PUBLISHED' ? 'PUBLISHED' : 'ACCEPTED' })} />
      </SubmissionField>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <SubmissionField name="conference.eventDate" errors={errors} className="min-w-0">
          <label htmlFor="conference-date" className="block text-sm font-semibold">Ngày diễn ra hội nghị</label>
          <input id="conference-date" type="date" value={value.eventDate ?? ''} onChange={event => patch({ eventDate: event.target.value || null })} className={inputClass} />
        </SubmissionField>
        {published ? <SubmissionField name="conference.publicationDate" errors={errors} className="min-w-0">
          <label htmlFor="conference-publication-date" className="block text-sm font-semibold">Ngày công bố</label>
          <input id="conference-publication-date" type="date" value={value.publicationDate ?? ''} onChange={event => patch({ publicationDate: event.target.value || null })} className={inputClass} />
        </SubmissionField> : <SubmissionField name="conference.acceptedDate" errors={errors} className="min-w-0">
          <label htmlFor="conference-accepted-date" className="block text-sm font-semibold">Ngày chấp nhận đăng</label>
          <input id="conference-accepted-date" type="date" value={value.acceptedDate ?? ''} onChange={event => patch({ acceptedDate: event.target.value || null })} className={inputClass} />
        </SubmissionField>}
      </div>
      <SubmissionField name="conference.rankings" errors={errors}>
        <h3 className="text-sm font-semibold">Xếp hạng</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">Mỗi hàng gồm hệ thống đánh giá và mức hạng tương ứng.</p>
        <div className="mt-3 space-y-3">
          {rankings.map((entry, index) => <div key={index} className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-start gap-2">
            <SubmissionField name={`conference.rankings.${index}.system`} errors={errors} className="min-w-0">
              <label htmlFor={`conference-ranking-system-${index}`} className="block truncate text-xs font-semibold">Hệ thống<span className="sr-only"> xếp hạng {index + 1}</span></label>
              <input id={`conference-ranking-system-${index}`} maxLength={80} value={entry.system} onChange={event => patch({ rankings: rankings.map((row, i) => i === index ? { ...row, system: event.target.value } : row) })} className={inputClass} />
            </SubmissionField>
            <SubmissionField name={`conference.rankings.${index}.rank`} errors={errors} className="min-w-0">
              <label htmlFor={`conference-ranking-value-${index}`} className="block truncate text-xs font-semibold">Mức hạng<span className="sr-only"> {index + 1}</span></label>
              <input id={`conference-ranking-value-${index}`} maxLength={40} value={entry.rank} onChange={event => patch({ rankings: rankings.map((row, i) => i === index ? { ...row, rank: event.target.value } : row) })} className={inputClass} />
            </SubmissionField>
            <button type="button" aria-label={`Xóa xếp hạng ${index + 1}`} onClick={() => patch({ rankings: rankings.filter((_, i) => i !== index) })} className="action-secondary-detail mt-6 h-11 w-11 !px-0"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
          </div>)}
        </div>
        <button type="button" disabled={rankings.length >= MAX_CONFERENCE_RANKINGS} onClick={() => patch({ rankings: [...rankings, { system: '', rank: '' }] })} className="action-secondary-detail mt-3 min-h-11"><Plus aria-hidden="true" className="h-4 w-4" />Thêm xếp hạng</button>
      </SubmissionField>
    </div>}
  </section>;
}
