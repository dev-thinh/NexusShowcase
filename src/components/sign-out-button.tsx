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
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all text-xs font-semibold cursor-pointer disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
      ) : (
        <LogOut className="w-3.5 h-3.5" />
      )}
      <span className="hidden sm:inline">Đăng xuất</span>
    </button>
  );
}
