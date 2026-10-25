'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { Modal } from '@/shared/ui/modal';
import { ChangePasswordForm } from './change-password-form';

export function ChangePasswordModal({ autoOpen = false, required = false }: { autoOpen?: boolean; required?: boolean }) {
  const [open, setOpen] = useState(autoOpen || required);
  const [busy, setBusy] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  return <>
    <button type="button" onClick={() => setOpen(true)} className="action-secondary-detail"><KeyRound aria-hidden="true" className="h-4 w-4" />Đổi mật khẩu</button>
    <Modal isOpen={open} closeDisabled={busy || required} onClose={() => { setOpen(false); if (autoOpen) router.replace(pathname, { scroll: false }); }} title="Đổi mật khẩu" description={required ? 'Vui lòng thay mật khẩu tạm thời để tiếp tục sử dụng tài khoản.' : 'Sau khi đổi mật khẩu, bạn sẽ đăng nhập lại.'} className="!rounded-2xl">
      <ChangePasswordForm embedded onBusyChange={setBusy} />
    </Modal>
  </>;
}
