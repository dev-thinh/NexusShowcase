'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMemberAction } from '@/actions/admin-actions';
import { Modal } from '@/components/ui/modal';
import {
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Mail,
  KeyRound,
  GraduationCap,
  Shield,
  UserCheck,
  Copy,
  Check,
} from 'lucide-react';

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
      setTemporaryPassword((res as any).temporaryPassword || 'Đã tạo');
      router.refresh();
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#1E3A5F] active:scale-[0.98] text-white text-xs font-bold shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A]/20"
      >
        <UserPlus className="w-4 h-4 text-white/80" />
        <span>Thêm thành viên mới</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => !loading && setIsOpen(false)}
        title="Tạo Tài Khoản Thành Viên Mới"
        description="Cấp quyền truy cập hệ thống nghiên cứu cho sinh viên hoặc nghiên cứu viên."
      >
        {temporaryPassword ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Tài khoản đã được tạo thành công!</span>
              </div>
              <p className="text-emerald-700 leading-relaxed">
                Tài khoản <strong>{email}</strong> đã sẵn sàng. Hãy sao chép mật khẩu tạm thời dưới đây và gửi cho thành viên. Thành viên sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Mật khẩu tạm thời</span>
                <span className="text-sm font-mono font-bold text-slate-900">{temporaryPassword}</span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
              </button>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#0F294A] hover:bg-[#1E3A5F] text-white text-xs font-bold transition-all shadow-xs"
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
                className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ và tên thành viên *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F294A]/15 focus:border-slate-400 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên đăng nhập / Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="VD: 22120001 hoặc email..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F294A]/15 focus:border-slate-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã số sinh viên (MSSV)
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="VD: 22120001"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F294A]/15 focus:border-slate-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Phân quyền ban đầu *
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <label
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    role === 'MEMBER'
                      ? 'bg-blue-50/50 border-blue-300 text-blue-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="MEMBER"
                    checked={role === 'MEMBER'}
                    onChange={() => setRole('MEMBER')}
                    className="mt-0.5 accent-[#0F294A]"
                  />
                  <div>
                    <div className="flex items-center gap-1 font-bold text-slate-900">
                      <UserCheck className="w-3.5 h-3.5 text-[#0F294A]" />
                      <span>MEMBER</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                      Thành viên thông thường, sở hữu portfolio
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    role === 'CORE_MEMBER'
                      ? 'bg-blue-50/50 border-blue-300 text-blue-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="CORE_MEMBER"
                    checked={role === 'CORE_MEMBER'}
                    onChange={() => setRole('CORE_MEMBER')}
                    className="mt-0.5 accent-[#0F294A]"
                  />
                  <div>
                    <div className="flex items-center gap-1 font-bold text-slate-900">
                      <Shield className="w-3.5 h-3.5 text-blue-700" />
                      <span>CORE MEMBER</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                      Được quyền đại diện nhóm nộp bài báo/dự án
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mật khẩu khởi tạo
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Để trống để tự động tạo mật khẩu ngẫu nhiên"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F294A]/15 focus:border-slate-400 font-mono transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Để trống để hệ thống tự tạo mật khẩu an toàn. Thành viên sẽ phải đổi mật khẩu khi đăng nhập lần đầu.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0F294A] hover:bg-[#1E3A5F] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
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
