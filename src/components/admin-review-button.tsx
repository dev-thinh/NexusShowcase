'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { reviewShowcaseItemAction } from '@/actions/showcase-actions';
import { Modal } from '@/components/ui/modal';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';

export function AdminReviewButton({ adminId, itemId }: { adminId: string; itemId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    const res = await reviewShowcaseItemAction(adminId, itemId, { action: 'PUBLISH' });
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Có lỗi xảy ra khi phê duyệt');
    } else {
      setPublishModalOpen(false);
      router.refresh();
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Vui lòng nhập lý do hoặc hướng dẫn chỉnh sửa cho nhóm');
      return;
    }
    setLoading(true);
    setError(null);
    const res = await reviewShowcaseItemAction(adminId, itemId, {
      action: 'REJECT',
      reason: rejectReason.trim(),
    });
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Có lỗi xảy ra khi từ chối');
    } else {
      setRejectModalOpen(false);
      setRejectReason('');
      router.refresh();
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setError(null);
            setPublishModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Duyệt xuất bản</span>
        </button>

        <button
          onClick={() => {
            setError(null);
            setRejectModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 active:scale-95 text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        >
          <XCircle className="w-4 h-4" />
          <span>Yêu cầu sửa</span>
        </button>
      </div>

      {/* Modal Duyệt Bài */}
      <Modal
        isOpen={publishModalOpen}
        onClose={() => !loading && setPublishModalOpen(false)}
        title="Xác nhận Phê Duyệt Xuất Bản"
        description="Bài viết sẽ được công khai ngay lập tức trên trang chủ và trang cá nhân của tất cả các tác giả."
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-sm text-slate-600 leading-relaxed">
            Thầy đã kiểm tra kỹ nội dung, tính liêm chính học thuật và danh sách tác giả của công trình này chưa?
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              disabled={loading}
              onClick={() => setPublishModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              disabled={loading}
              onClick={handlePublish}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Đang duyệt...' : 'Xác nhận duyệt'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Từ Chối & Yêu Cầu Sửa */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => !loading && setRejectModalOpen(false)}
        title="Yêu Cầu Nhóm Chỉnh Sửa"
        description="Gửi lời nhận xét và hướng dẫn cụ thể để nhóm nghiên cứu hoàn thiện lại bài viết."
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nhận xét / Điểm cần chỉnh sửa *
            </label>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ví dụ: Cần bổ sung link arXiv chính thức, kiểm tra lại thứ tự tác giả 2 và 3, cập nhật ảnh thumbnail rõ nét hơn..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              disabled={loading}
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              disabled={loading}
              onClick={handleReject}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Đang gửi...' : 'Gửi yêu cầu sửa'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
