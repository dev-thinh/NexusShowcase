'use client';

import { Loader2, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTransition } from 'react';

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
      className={variant === 'menu' ? 'w-full min-h-11 px-3 py-2 rounded-lg flex items-center gap-2.5 text-sm font-semibold text-foreground-muted hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#153D67]' : "h-9 px-3 rounded-lg inline-flex items-center justify-center gap-1.5 text-foreground-muted hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-50 shadow-2xs active:scale-[0.98]"}
    >
      {isPending ? (
        <Loader2 aria-hidden="true" className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <LogOut aria-hidden="true" className="w-3.5 h-3.5" />
      )}
      <span className={variant === 'menu' ? '' : 'hidden sm:inline'}>Đăng xuất</span>
    </button>
  );
}
