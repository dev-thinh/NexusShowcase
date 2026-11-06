'use client';

import { useI18n } from '@/shared/i18n/provider';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { Modal } from '@/shared/ui/modal';
import { ChangePasswordForm } from './change-password-form';

export function ChangePasswordModal({ autoOpen = false, required = false }: { autoOpen?: boolean; required?: boolean }) {
  const { t: tr } = useI18n();

  const [open, setOpen] = useState(autoOpen || required);
  const [busy, setBusy] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  return <>
    <button type="button" onClick={() => setOpen(true)} className="action-secondary-detail"><KeyRound aria-hidden="true" className="h-4 w-4" />{tr("Đổi mật khẩu")}</button>
    <Modal isOpen={open} closeDisabled={busy || required} onClose={() => { setOpen(false); if (autoOpen) router.replace(pathname, { scroll: false }); }} title={tr("Đổi mật khẩu")} description={required ? tr("Cần đổi mật khẩu.") : tr("Đăng nhập lại sau khi đổi mật khẩu.")} className="!rounded-2xl">
      <ChangePasswordForm embedded onBusyChange={setBusy} />
    </Modal>
  </>;
}
