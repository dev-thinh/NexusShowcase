import { Skeleton } from '@/components/ui/skeleton';

export default function ShowcaseDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-pulse">
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
        <Skeleton className="w-32 h-6" />
        <Skeleton className="w-24 h-9 rounded-lg" />
      </header>

      <main className="container mx-auto px-4 py-10 max-w-4xl flex-1">
        <Skeleton className="w-32 h-4 mb-6" />

        {/* Header Skeleton */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-8 space-y-4">
          <div className="flex gap-3">
            <Skeleton className="w-24 h-6 rounded-full" />
            <Skeleton className="w-28 h-6 rounded-full" />
          </div>
          <Skeleton className="w-3/4 h-10" />
          <Skeleton className="w-full h-16" />
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Skeleton className="w-36 h-9 rounded-xl" />
            <Skeleton className="w-36 h-9 rounded-xl" />
          </div>
        </div>

        {/* Video Skeleton */}
        <div className="mb-8 space-y-3">
          <Skeleton className="w-32 h-6" />
          <Skeleton className="aspect-video w-full rounded-2xl" />
        </div>

        {/* Contributors Skeleton */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8 space-y-4">
          <Skeleton className="w-48 h-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="w-32 h-4" />
                  <Skeleton className="w-24 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
