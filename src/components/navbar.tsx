import Link from 'next/link';
import { auth } from '@/lib/auth';

export async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
            N
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">NexusShowcase</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/" className="text-slate-600 hover:text-blue-600 transition-colors">
            Khám phá
          </Link>
          {session?.user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
              >
                Dashboard
              </Link>
              {(session.user as any).role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="px-3 py-1.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold transition-colors"
                >
                  Admin
                </Link>
              )}
            </div>
          ) : (
            <Link
              href="/api/auth/signin"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              Đăng nhập
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
