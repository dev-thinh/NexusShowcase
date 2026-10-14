'use client';

export function OptionalDetails({ content, driveUrl, onContentChange, onDriveUrlChange }: { content: string; driveUrl: string; onContentChange: (value: string) => void; onDriveUrlChange: (value: string) => void }) {
  return (
    <details className="mt-6 border-t border-slate-200 pt-5">
      <summary className="cursor-pointer text-sm font-semibold text-[#0F294A]">Thông tin tùy chọn</summary>
      <div className="mt-5 space-y-5">
        <div><label htmlFor="submission-drive" className="block text-sm font-semibold text-slate-900">Thư mục Google Drive</label><input id="submission-drive" type="url" value={driveUrl} onChange={(event) => onDriveUrlChange(event.target.value)} placeholder="https://drive.google.com/…" className="mt-2 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm" /></div>
        <div><label htmlFor="submission-content" className="block text-sm font-semibold text-slate-900">Nội dung mở rộng bằng Markdown</label><textarea id="submission-content" rows={10} value={content} onChange={(event) => onContentChange(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 font-mono text-sm" /></div>
      </div>
    </details>
  );
}
