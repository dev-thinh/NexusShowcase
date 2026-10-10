import { Skeleton } from '@/components/ui/skeleton';

export default function MemberProfileLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-pulse">
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
        <Skeleton className="w-32 h-6" />
        <Skeleton className="w-24 h-9 rounded-lg" />
      </header>

      <main className="container mx-auto px-4 py-10 max-w-5xl flex-1">
        {/* Profile Card Skeleton */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-10 flex flex-col md:flex-row items-center gap-6">
          <Skeleton className="w-24 h-24 rounded-full shrink-0" />
          <div className="space-y-3 flex-1 w-full text-center md:text-left">
            <div className="flex gap-3 justify-center md:justify-start">
              <Skeleton className="w-48 h-8" />
              <Skeleton className="w-32 h-8 rounded-full" />
            </div>
            <Skeleton className="w-32 h-4 mx-auto md:mx-0" />
            <Skeleton className="w-full max-w-lg h-12 mx-auto md:mx-0" />
            <div className="flex gap-4 justify-center md:justify-start">
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-20 h-4" />
              <Skeleton className="w-16 h-4" />
            </div>
          </div>
        </div>

        {/* Section Cards Skeleton */}
        <div className="space-y-10">
          {[1, 2].map((s) => (
            <div key={s} className="space-y-4">
              <Skeleton className="w-64 h-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((c) => (
                  <div key={c} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                    <Skeleton className="aspect-[16/9] w-full rounded-none" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="w-24 h-4" />
                      <Skeleton className="w-full h-5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
