import { Skeleton } from '@/components/ui/skeleton';

export default function MemberProfileLoading() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl h-full flex items-center justify-between">
          <Skeleton className="w-36 h-6" />
          <Skeleton className="w-24 h-9 rounded-lg" />
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl flex-1">
        {/* Profile Card Skeleton */}
        <div className="bg-white p-5 sm:p-8 rounded-lg border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row items-center md:items-start gap-6">
          <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg shrink-0" />
          <div className="space-y-3.5 flex-1 w-full text-center md:text-left">
            <div className="flex gap-3 justify-center md:justify-start items-center">
              <Skeleton className="w-56 h-8" />
              <Skeleton className="w-36 h-6 rounded-md" />
            </div>
            <Skeleton className="w-44 h-4 mx-auto md:mx-0" />
            <Skeleton className="w-full max-w-xl h-12 mx-auto md:mx-0" />
            <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto md:mx-0 p-3.5 bg-slate-50 border border-slate-200 rounded-md">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
            <div className="flex gap-2.5 justify-center md:justify-start flex-wrap">
              <Skeleton className="w-32 h-8 rounded-lg" />
              <Skeleton className="w-28 h-8 rounded-lg" />
              <Skeleton className="w-28 h-8 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Section Cards Skeleton */}
        <div className="space-y-8">
          {[1, 2].map((s) => (
            <div key={s} className="space-y-4">
              <Skeleton className="w-64 h-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((c) => (
                  <div key={c} className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
                    <Skeleton className="aspect-[16/9] w-full rounded-none" />
                    <div className="p-4 sm:p-5 space-y-3">
                      <Skeleton className="w-28 h-5 rounded-md" />
                      <Skeleton className="w-full h-6" />
                      <Skeleton className="w-4/5 h-4" />
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
