'use client';

import { useI18n } from '@/shared/i18n/provider';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { NavigationLink } from '@/shared/navigation/navigation-link';
import { ChevronDown, KeyRound } from 'lucide-react';
import type { Role } from '@prisma/client';
import { AdminRecoverMemberModal } from './admin-recover-member-modal';
import { AdminRoleToggle } from './admin-role-toggle';
import { AdminDeleteMemberModal } from './admin-delete-member-modal';

export function AdminMemberActions({ member, isSelf = false }: { isSelf?: boolean; member: { id: string; fullName: string; role: Role; status?: string; deletedAt?: Date | string | null; sessionVersion?: number } }) {
  const { t: tr } = useI18n();

  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  useEffect(() => { setOpen(false); }, [member.role]);
  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      const bounds = trigger.current?.getBoundingClientRect();
      const height = panel.current?.offsetHeight ?? 0;
      if (bounds) setAbove(bounds.bottom + height + 20 > innerHeight && bounds.top > height + 20);
    };
    position();
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => { window.removeEventListener('resize', position); window.removeEventListener('scroll', position, true); };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      if (document.querySelector('[role="dialog"]')) return;
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || document.querySelector('[role="dialog"]')) return;
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  const disabled = !!member.deletedAt || !!member.status && member.status !== 'ACTIVE';
  return <div ref={root} className="relative" data-member-role={member.role}>
    <button ref={trigger} type="button" aria-label={tr("Quản lý tài khoản {0}", member.fullName)} aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)} className="member-permissions-trigger inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-[#153D67] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67]">{tr("Quản lý")}<ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    <div ref={panel} id={id} hidden={!open} role="group" aria-label={tr("Thao tác quản lý {0}", member.fullName)} className={`member-permissions-menu absolute right-0 z-30 w-60 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ${above ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
      {!disabled && member.role !== 'ADMIN' && <AdminRoleToggle userId={member.id} currentRole={member.role} />}
      {!disabled && !isSelf && member.role !== 'ADMIN' && <AdminDeleteMemberModal member={member} />}
      {!isSelf && member.role !== 'ADMIN' && <AdminDeleteMemberModal member={member} permanent />}
      {isSelf ? <NavigationLink href="/account/change-password" className="flex min-h-11 w-full items-center gap-2.5 rounded-lg p-3 text-left text-sm font-semibold text-[#153D67] hover:bg-slate-50"><KeyRound size={16} aria-hidden="true" />{tr("Đổi mật khẩu")}</NavigationLink> : <AdminRecoverMemberModal member={member} />}
    </div>
  </div>;
}
