'use client';

import { useTransition } from 'react';
import { signOut } from 'next-auth/react';
import { LogOut, Loader2 } from 'lucide-react';

export function SignOutButton({ variant = 'default' }: { variant?: 'default' | 'menu' }) {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut({ callbackUrl: '/' });
    });
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      title="Đăng xuất khỏi hệ thống"
      aria-label="Đăng xuất khỏi hệ thống"
      className={variant === 'menu' ? 'w-full min-h-11 px-3 py-2 rounded-lg flex items-center gap-2.5 text-sm font-semibold text-slate-700 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0F294A]' : "h-9 px-3 rounded-lg inline-flex items-center justify-center gap-1.5 text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-50 shadow-2xs active:scale-[0.98]"}
    >
      {isPending ? (
        <Loader2 aria-hidden="true" className="w-3.5 h-3.5 animate-spin text-rose-600" />
      ) : (
        <LogOut aria-hidden="true" className="w-3.5 h-3.5" />
      )}
      <span className={variant === 'menu' ? '' : 'hidden sm:inline'}>Đăng xuất</span>
    </button>
  );
}
