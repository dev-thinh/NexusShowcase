'use client';

import type { ActionResult } from '@/shared/lib/action-result';
import { useDialog } from '@/shared/dialogs/dialog-provider';
import { Modal } from '@/shared/ui/modal';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function ApprovalControls({ itemId, reviewVersion }: { itemId: string; reviewVersion: number }) {
  const dialog = useDialog();
  const [feedbackAction, setFeedbackAction] = useState<'REQUEST_REVISION' | 'REJECT' | null>(null);
  const [reason, setReason] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const deciding = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const decide = async (action: 'PUBLISH' | 'REQUEST_REVISION' | 'REJECT') => {
    if (deciding.current) return;
    if (action !== 'PUBLISH' && !reason.trim()) { setError('Nhập lý do hoặc yêu cầu chỉnh sửa cho tác giả.'); return; }
    deciding.current = true;
    let navigating = false;
    try {
      if (action === 'PUBLISH' && !await dialog.confirm({ title: 'Duyệt và xuất bản?', message: visibility === 'PUBLIC' ? 'Bài đăng sẽ được công khai cho mọi người.' : 'Bài đăng sẽ được xuất bản trong phạm vi nội bộ CLB.', confirmLabel: 'Xuất bản' })) return;
      if (!mounted.current) return;
      setError('');
      setPending(true);
      const response = await fetch('/api/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId, reviewVersion, action, visibility, reason: action === 'PUBLISH' ? '' : reason.trim() }) });
      const result = await response.json() as ActionResult<unknown>;
      if (!mounted.current) return;
      if (!result.success) { setError(result.error); return; }
      // The mutation response finishes independently of the RSC action queue.
      window.location.assign('/admin/reviews');
      navigating = true;
    } catch { if (mounted.current) setError('Không kết nối được. Vui lòng thử lại.'); }
    finally { if (!navigating) { deciding.current = false; if (mounted.current) setPending(false); } }
  };
  return <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 lg:sticky lg:top-32" aria-labelledby="approval-title">
    <Link href={`/admin/reviews/${encodeURIComponent(itemId)}/preview`} target="_blank" rel="noopener noreferrer" className="action-secondary-detail min-h-11 w-full">Xem trước</Link>
    <h2 id="approval-title" className="text-lg font-semibold text-[#1F2937]">Quyết định phê duyệt</h2>

    {error && !feedbackAction && <p role="alert" className="text-sm text-[#1F2937]">{error}</p>}
    <div className="flex flex-col gap-3">
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-slate-200 bg-[#FFFFFF] px-3 py-1 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[#1F2937]">Công khai</span>
        </span>
        <span className="relative inline-flex h-11 w-11 shrink-0 items-center">
          <input type="checkbox" role="switch" aria-label="Công khai" checked={visibility === 'PUBLIC'} disabled={pending} onChange={event => setVisibility(event.target.checked ? 'PUBLIC' : 'PRIVATE')} className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed" />
          <span aria-hidden="true" className="pointer-events-none h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-[#153D67] peer-focus-visible:ring-2 peer-focus-visible:ring-[#153D67] peer-focus-visible:ring-offset-2 motion-reduce:transition-none" />
          <span aria-hidden="true" className="pointer-events-none absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5 motion-reduce:transition-none" />
        </span>
      </label>
      <button type="button" disabled={pending} className="action-primary-detail min-h-11 disabled:opacity-50" onClick={() => decide('PUBLISH')}>{pending ? 'Đang xử lý…' : 'Duyệt và xuất bản'}</button>
      <button type="button" disabled={pending} className="action-secondary-detail min-h-11 disabled:opacity-50" onClick={() => { setError(''); setReason(''); setFeedbackAction('REQUEST_REVISION'); }}>Yêu cầu chỉnh sửa</button>
      <div className="border-t border-slate-200 pt-3">
        <button type="button" disabled={pending} className="min-h-11 w-full rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#1F2937] hover:bg-[#FFFFFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] disabled:opacity-50" onClick={() => { setError(''); setReason(''); setFeedbackAction('REJECT'); }}>Từ chối</button>
      </div>
    </div>
    {feedbackAction && createPortal(<Modal
      isOpen
      onClose={() => { if (!pending) { setFeedbackAction(null); setError(''); } }}
      title={feedbackAction === 'REQUEST_REVISION' ? 'Yêu cầu chỉnh sửa' : 'Từ chối bài đăng'}
      description={feedbackAction === 'REQUEST_REVISION' ? 'Nhập nội dung cần chỉnh sửa để gửi lại cho tác giả.' : 'Nhập lý do từ chối để thông báo cho tác giả.'}
    >
      <form className="space-y-4" onSubmit={event => { event.preventDefault(); decide(feedbackAction); }}>
        <label htmlFor="approval-feedback" className="block text-sm font-semibold text-[#1F2937]">{feedbackAction === 'REQUEST_REVISION' ? 'Nội dung yêu cầu chỉnh sửa' : 'Lý do từ chối'} <span className="text-[#1F2937]">*</span></label>
        <textarea id="approval-feedback" value={reason} disabled={pending} required maxLength={2000} rows={5} onChange={e => setReason(e.target.value)} aria-invalid={!!error} aria-describedby={error ? 'approval-feedback-error' : undefined} placeholder={feedbackAction === 'REQUEST_REVISION' ? 'Mô tả cụ thể những nội dung tác giả cần bổ sung hoặc sửa…' : 'Nhập lý do từ chối bài đăng…'} className="w-full rounded-md border border-slate-200 p-3 text-sm font-normal" />
        {error && <p id="approval-feedback-error" role="alert" className="text-sm text-[#1F2937]">{error}</p>}
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" disabled={pending} className="action-secondary-detail min-h-11 disabled:opacity-50" onClick={() => { setFeedbackAction(null); setError(''); }}>Hủy</button>
          <button type="submit" disabled={pending || !reason.trim()} className="action-primary-detail min-h-11 disabled:opacity-50">{pending ? 'Đang gửi…' : feedbackAction === 'REQUEST_REVISION' ? 'Gửi yêu cầu chỉnh sửa' : 'Xác nhận từ chối'}</button>
        </div>
      </form>
    </Modal>, document.body)}
  </section>;
}
