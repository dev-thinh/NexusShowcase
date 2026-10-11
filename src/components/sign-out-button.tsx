'use client';

import { useTransition } from 'react';
import { signOut } from 'next-auth/react';
import { LogOut, Loader2 } from 'lucide-react';

export function SignOutButton() {
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
      className="h-10 px-3 rounded-xl inline-flex items-center justify-center gap-1.5 text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50 shadow-2xs active:scale-[0.98]"
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
      ) : (
        <LogOut className="w-3.5 h-3.5" />
      )}
      <span className="hidden sm:inline">Đăng xuất</span>
    </button>
  );
}
