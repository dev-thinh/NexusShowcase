'use client';

import { Eye, Save, Send } from 'lucide-react';
import type { SaveState } from './use-submission-editor';

const labels: Record<SaveState, string> = {
  idle: 'Chưa đồng bộ',
  saving: 'Đang lưu…',
  saved: 'Đã lưu',
  error: 'Lưu thất bại',
  offline: 'Ngoại tuyến',
  conflict: 'Có thay đổi ở phiên khác',
};

export function SubmissionActionBar({ saveState, onSave, onSubmit, disabled = false, preview = false, onPreview, locallySaved = true, dirty = false }: { locallySaved?: boolean; dirty?: boolean; preview?: boolean; onPreview?: () => void; disabled?: boolean; saveState: SaveState; onSave: () => void; onSubmit: () => void }) {
  const busy = disabled;
  return (
    <div data-submission-actions className="submission-actions sticky bottom-0 z-10 flex flex-col gap-2 border-t border-slate-200 bg-white px-3 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <p className="text-sm font-semibold text-[#1F2937]" aria-live="polite">{labels[saveState]}{dirty && locallySaved && saveState !== 'saved' ? ' · Đã lưu trên thiết bị' : ''}</p>
      <div className="grid grid-cols-3 gap-2 sm:flex">
        {onPreview && <button type="button" disabled={disabled} onClick={onPreview} aria-pressed={preview} className="action-secondary-detail min-h-11 px-2 sm:px-4"><Eye className="h-4 w-4 shrink-0" aria-hidden="true" />{preview ? 'Soạn thảo' : 'Xem trước'}</button>}
        <button type="button" disabled={busy} onClick={onSave} aria-label="Lưu bản nháp" className="action-secondary-detail min-h-11 w-full px-2 sm:w-40 sm:px-4 disabled:cursor-not-allowed disabled:opacity-60"><Save className="hidden h-4 w-4 sm:block" aria-hidden="true" /><span className="sm:hidden">Lưu nháp</span><span className="hidden sm:inline">Lưu bản nháp</span></button>
        <button type="button" disabled={busy} onClick={onSubmit} className="action-primary-detail min-h-11 w-full px-2 sm:w-40 sm:px-4 disabled:cursor-not-allowed disabled:opacity-60"><Send className="hidden h-4 w-4 sm:block" aria-hidden="true" />Gửi duyệt</button>
      </div>
    </div>
  );
}
