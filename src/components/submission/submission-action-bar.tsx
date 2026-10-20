'use client';

import { Eye, Save, Send } from 'lucide-react';
import type { SaveState } from './use-submission-editor';

const labels: Record<SaveState, string> = {
  idle: 'Chưa lưu',
  saving: 'Đang lưu…',
  saved: 'Đã lưu',
  error: 'Lưu thất bại',
};

export function SubmissionActionBar({ saveState, onSave, onSubmit, disabled = false, preview = false, onPreview }: { preview?: boolean; onPreview?: () => void; disabled?: boolean; saveState: SaveState; onSave: () => void; onSubmit: () => void }) {
  const busy = disabled || saveState === 'saving';
  return (
    <div className="sticky bottom-0 z-10 flex flex-col gap-2 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <p className={`text-sm font-semibold ${saveState === 'error' ? 'text-rose-700' : saveState === 'saved' ? 'text-emerald-700' : 'text-slate-600'}`} aria-live="polite">{labels[saveState]}</p>
      <div className="grid grid-cols-3 gap-2 sm:flex">
        {onPreview && <button type="button" disabled={disabled} onClick={onPreview} aria-pressed={preview} className="action-secondary-detail min-h-11 px-2 sm:px-4"><Eye className="h-4 w-4" aria-hidden="true" />{preview ? 'Soạn thảo' : 'Xem trước'}</button>}
        <button type="button" disabled={busy} onClick={onSave} className="action-secondary-detail min-h-11 w-full px-2 sm:w-40 sm:px-4 disabled:cursor-not-allowed disabled:opacity-60"><Save className="h-4 w-4" aria-hidden="true" />Lưu bản nháp</button>
        <button type="button" disabled={busy} onClick={onSubmit} className="action-primary-detail min-h-11 w-full px-2 sm:w-40 sm:px-4 disabled:cursor-not-allowed disabled:opacity-60"><Send className="h-4 w-4" aria-hidden="true" />Gửi duyệt</button>
      </div>
    </div>
  );
}
