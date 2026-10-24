'use client';

import { createMemberAction } from '@/features/identity/server/member-actions';
import { Modal } from '@/shared/ui/modal';
import {
AlertCircle,
Check,
CheckCircle2,
Copy,
GraduationCap,
KeyRound,
Loader2,
Mail,
Shield,
User,
UserCheck,
UserPlus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AdminCreateMemberModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'CORE_MEMBER'>('MEMBER');
  const [password, setPassword] = useState('');

  const handleOpen = () => {
    setError(null);
    setTemporaryPassword(null);
    setCopied(false);
    setFullName('');
    setEmail('');
    setStudentId('');
    setRole('MEMBER');
    setPassword('');
    setIsOpen(true);
  };

  const handleCopy = () => {
    if (temporaryPassword) {
      navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError('Vui lòng nhập họ tên và tên đăng nhập/email.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await createMemberAction({
      fullName: fullName.trim(),
      email: email.trim(),
      studentId: studentId.trim() || undefined,
      role,
      password: password.trim() || undefined,
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Tạo tài khoản thất bại');
    } else {
      setTemporaryPassword(res.data.temporaryPassword);
      router.refresh();
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="action-primary-detail"
      >
        <UserPlus className="w-4 h-4 text-white/80" />
        <span>Thêm thành viên</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => !loading && setIsOpen(false)}
        title="Thêm thành viên"
        description="Cấp quyền truy cập hệ thống nghiên cứu cho sinh viên hoặc nghiên cứu viên."
      >
        {temporaryPassword ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-[#FFFFFF] border border-slate-200 rounded-md text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#1F2937] font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5 text-[#1F2937]" />
                <span>Tài khoản đã được tạo thành công!</span>
              </div>
              <p className="text-[#1F2937] leading-relaxed">
                Tài khoản <strong>{email}</strong> đã sẵn sàng. Hãy sao chép mật khẩu tạm thời dưới đây và gửi cho thành viên. Thành viên sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên.
              </p>
            </div>

            <div className="p-3.5 bg-[#FFFFFF] border border-slate-200 rounded-md flex items-center justify-between">
              <div>
                <span className="block text-[11px] font-semibold text-[#1F2937] uppercase tracking-wider">Mật khẩu tạm thời</span>
                <span className="text-sm font-mono font-semibold text-[#1F2937]">{temporaryPassword}</span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#1F2937] hover:bg-[#FFFFFF] transition-colors shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#1F2937]" /> : <Copy className="w-3.5 h-3.5 text-[#1F2937]" />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
              </button>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="action-primary-detail"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="p-3 bg-[#FFFFFF] border border-slate-200 text-[#1F2937] rounded-md text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-[#1F2937]" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                Họ và tên thành viên *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#1F2937] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#153D67]/15 focus:border-slate-200 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Tên đăng nhập / Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#1F2937] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="VD: 22120001 hoặc email..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#153D67]/15 focus:border-slate-200 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Mã số sinh viên (MSSV)
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-[#1F2937] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="VD: 22120001"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#153D67]/15 focus:border-slate-200 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                Phân quyền ban đầu *
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <label
                  className={`flex items-start gap-2.5 p-3 rounded-md border text-xs cursor-pointer transition-all ${
                    role === 'MEMBER'
                      ? 'bg-[#FFFFFF] border-slate-200 text-[#1F2937] font-semibold'
                      : 'bg-white border-slate-200 text-[#1F2937] hover:bg-[#FFFFFF]'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="MEMBER"
                    checked={role === 'MEMBER'}
                    onChange={() => setRole('MEMBER')}
                    className="mt-0.5 accent-[#153D67]"
                  />
                  <div>
                    <div className="flex items-center gap-1 font-semibold text-[#1F2937]">
                      <UserCheck className="w-3.5 h-3.5 text-[#1F2937]" />
                      <span>MEMBER</span>
                    </div>
                    <p className="text-[11px] text-[#1F2937] font-normal mt-0.5">
                      Thành viên thông thường, sở hữu portfolio
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2.5 p-3 rounded-md border text-xs cursor-pointer transition-all ${
                    role === 'CORE_MEMBER'
                      ? 'bg-[#FFFFFF] border-slate-200 text-[#1F2937] font-semibold'
                      : 'bg-white border-slate-200 text-[#1F2937] hover:bg-[#FFFFFF]'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="CORE_MEMBER"
                    checked={role === 'CORE_MEMBER'}
                    onChange={() => setRole('CORE_MEMBER')}
                    className="mt-0.5 accent-[#153D67]"
                  />
                  <div>
                    <div className="flex items-center gap-1 font-semibold text-[#1F2937]">
                      <Shield className="w-3.5 h-3.5 text-[#1F2937]" />
                      <span>CORE MEMBER</span>
                    </div>
                    <p className="text-[11px] text-[#1F2937] font-normal mt-0.5">
                      Được quyền đại diện nhóm nộp bài báo/dự án
                    </p>
                  </div>
                </label>


              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                Mật khẩu khởi tạo
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#1F2937] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Để trống để tự động tạo mật khẩu ngẫu nhiên"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#153D67]/15 focus:border-slate-200 font-mono transition-colors"
                />
              </div>
              <p className="text-[11px] text-[#1F2937] mt-1">
                Để trống để hệ thống tự tạo mật khẩu an toàn. Thành viên sẽ phải đổi mật khẩu khi đăng nhập lần đầu.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsOpen(false)}
                className="action-secondary-detail disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="action-primary-detail disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{loading ? 'Đang tạo...' : 'Xác nhận tạo'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
