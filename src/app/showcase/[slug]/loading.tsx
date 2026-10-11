import { Skeleton } from '@/components/ui/skeleton';

export default function ShowcaseDetailLoading() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl h-full flex items-center justify-between">
          <Skeleton className="w-36 h-6" />
          <Skeleton className="w-24 h-9 rounded-xl" />
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl flex-1">
        <Skeleton className="w-48 h-5 mb-6" />

        {/* Header Skeleton */}
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs mb-8 space-y-5">
          <div className="flex gap-3">
            <Skeleton className="w-28 h-6 rounded-full" />
            <Skeleton className="w-24 h-6 rounded-full" />
          </div>
          <Skeleton className="w-4/5 h-12" />
          <div className="p-5 sm:p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-full h-14" />
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100 flex-wrap">
            <Skeleton className="w-36 h-10 rounded-xl" />
            <Skeleton className="w-40 h-10 rounded-xl" />
            <Skeleton className="w-40 h-10 rounded-xl" />
          </div>
        </div>

        {/* Video Skeleton */}
        <div className="mb-8 p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <Skeleton className="w-48 h-7" />
          <Skeleton className="aspect-video w-full rounded-2xl" />
        </div>

        {/* Contributors Skeleton */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs mb-8 space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="w-48 h-7" />
            <Skeleton className="w-24 h-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <Skeleton className="w-11 h-11 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="w-36 h-5" />
                  <Skeleton className="w-28 h-4 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
