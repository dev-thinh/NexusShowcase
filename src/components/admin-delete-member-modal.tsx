'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteMemberAction } from '@/actions/admin-actions';
import { Trash2, Loader2, AlertTriangle, X } from 'lucide-react';
import { Role } from '@prisma/client';

interface AdminDeleteMemberModalProps {
  member: {
    id: string;
    fullName: string;
    email?: string;
    role: Role;
    studentId?: string | null;
  };
}

export function AdminDeleteMemberModal({ member }: AdminDeleteMemberModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (member.role === 'ADMIN') {
    return null;
  }

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    const res = await deleteMemberAction(member.id);
    if (!res.success) {
      setError(res.error || 'Có lỗi xảy ra khi xóa tài khoản.');
      setLoading(false);
      return;
    }

    setLoading(false);
    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
        title="Xóa tài khoản thành viên"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Xóa</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Xác nhận xóa tài khoản
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống?
                  </p>
                </div>
              </div>
              <button
                disabled={loading}
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-2"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member Details Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Họ và tên:</span>
                <span className="font-bold text-slate-800">{member.fullName}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-700">{member.email}</span>
              </div>
              {member.studentId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">MSSV:</span>
                  <span className="font-semibold text-slate-700">{member.studentId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Vai trò:</span>
                <span className="font-bold text-[#0F294A]">{member.role}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-900 mb-4 leading-relaxed">
              <strong>Lưu ý:</strong> Hành động này sẽ vô hiệu hóa tài khoản thành viên. Các công trình và bài báo liên quan vẫn được bảo lưu an toàn.
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-1.5 rounded-md text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Xóa tài khoản</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
