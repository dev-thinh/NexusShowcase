'use client';

import { deleteMemberAction } from '@/features/identity/server/member-actions';
import { Role } from '@prisma/client';
import { Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Modal } from '@/shared/ui/modal';

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
        className="inline-flex items-center gap-1 min-h-9 px-2.5 py-1.5 rounded-md text-xs font-semibold text-[#1F2937] hover:text-[#1F2937] hover:bg-[#FFFFFF] border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] transition-colors cursor-pointer"
        title="Xóa tài khoản thành viên"
        aria-label={`Xóa tài khoản ${member.fullName}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Xóa</span>
      </button>

      <Modal
        isOpen={isOpen}
        closeDisabled={loading}
        onClose={() => { if (!loading) setIsOpen(false); }}
        title="Xác nhận xóa tài khoản"
        description="Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống?"
        className="!max-w-md"
      >
            {/* Member Details Box */}
            <div className="bg-[#FFFFFF] border border-slate-200 rounded-md p-3 mb-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#1F2937]">Họ và tên:</span>
                <span className="font-semibold text-[#1F2937]">{member.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#1F2937]">Email:</span>
                <span className="text-[#1F2937]">{member.email}</span>
              </div>
              {member.studentId && (
                <div className="flex justify-between">
                  <span className="text-[#1F2937]">MSSV:</span>
                  <span className="font-semibold text-[#1F2937]">{member.studentId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#1F2937]">Vai trò:</span>
                <span className="font-semibold text-[#1F2937]">{member.role}</span>
              </div>
            </div>

            <div className="p-3 bg-[#FFFFFF] border border-slate-200 rounded-md text-[11px] text-[#1F2937] mb-4 leading-relaxed">
              <strong>Lưu ý:</strong> Hành động này sẽ vô hiệu hóa tài khoản thành viên. Các công trình và bài báo liên quan vẫn được bảo lưu an toàn.
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-md bg-[#FFFFFF] border border-slate-200 text-xs text-[#1F2937]">
                {error}
              </div>
            )}

            <div className="modal-footer">
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsOpen(false)}
                className="action-secondary-detail disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleDelete}
                className="action-primary-detail bg-[#153D67] hover:bg-[#153D67] disabled:opacity-50"
              >
                {loading ? <Loader2 aria-hidden="true" className="w-3.5 h-3.5 animate-spin" /> : <Trash2 aria-hidden="true" className="w-3.5 h-3.5" />}
                <span>Xóa tài khoản</span>
              </button>
            </div>
      </Modal>
    </>
  );
}
