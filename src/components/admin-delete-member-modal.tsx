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
    email: string;
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
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
        title="Xóa tài khoản thành viên"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Xóa</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                disabled={loading}
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1 font-serif">
              Xác nhận xóa tài khoản thành viên
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống quản lý học thuật?
            </p>

            {/* Member Details Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4 text-xs space-y-1.5">
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

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 mb-5 leading-relaxed">
              <strong>Lưu ý:</strong> Hành động này không thể hoàn tác. Dữ liệu thành viên sẽ được loại bỏ khỏi hệ thống cơ sở dữ liệu CLB.
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
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
