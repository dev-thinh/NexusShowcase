'use client';

export function OptionalDetails({ content, onContentChange }: { content: string; onContentChange: (value: string) => void }) {
  return (
    <details className="panel-nested mt-6 !p-0 shadow-none">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[#0F294A]">Nội dung chi tiết</summary>
      <div className="border-t border-slate-200 px-4 py-4">
        <div><label htmlFor="submission-content" className="block text-sm font-semibold text-slate-900">Nội dung mở rộng bằng Markdown</label><textarea id="submission-content" rows={10} value={content} onChange={(event) => onContentChange(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 font-mono text-sm" /></div>
      </div>
    </details>
  );
}
