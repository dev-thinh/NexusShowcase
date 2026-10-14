'use client';

import { Save, Send } from 'lucide-react';
import type { SaveState } from './use-submission-editor';

const labels: Record<SaveState, string> = {
  idle: 'Chưa lưu',
  saving: 'Đang lưu…',
  saved: 'Đã lưu',
  error: 'Lưu thất bại',
};

export function SubmissionActionBar({ saveState, onSave, onSubmit }: { saveState: SaveState; onSave: () => void; onSubmit: () => void }) {
  const busy = saveState === 'saving';
  return (
    <div className="sm:sticky sm:bottom-0 z-10 mt-8 flex flex-col gap-3 border-t border-slate-200 bg-white/95 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <p className={`text-sm ${saveState === 'error' ? 'text-rose-700' : 'text-slate-600'}`} aria-live="polite">{labels[saveState]}</p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <button type="button" disabled={busy} onClick={onSave} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-800 disabled:opacity-60"><Save className="h-4 w-4" aria-hidden="true" />Lưu bản nháp</button>
        <button type="button" disabled={busy} onClick={onSubmit} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#0F294A] px-4 text-sm font-semibold text-white disabled:opacity-60"><Send className="h-4 w-4" aria-hidden="true" />Gửi duyệt</button>
      </div>
    </div>
  );
}
