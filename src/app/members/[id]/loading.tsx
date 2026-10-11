import { Skeleton } from '@/components/ui/skeleton';

export default function MemberProfileLoading() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl h-full flex items-center justify-between">
          <Skeleton className="w-36 h-6" />
          <Skeleton className="w-24 h-9 rounded-xl" />
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl flex-1">
        {/* Profile Card Skeleton */}
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs mb-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl shrink-0" />
          <div className="space-y-3.5 flex-1 w-full text-center md:text-left">
            <div className="flex gap-3 justify-center md:justify-start items-center">
              <Skeleton className="w-56 h-9" />
              <Skeleton className="w-36 h-7 rounded-full" />
            </div>
            <Skeleton className="w-44 h-4 mx-auto md:mx-0" />
            <Skeleton className="w-full max-w-xl h-14 mx-auto md:mx-0" />
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto md:mx-0 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
            </div>
            <div className="flex gap-3 justify-center md:justify-start flex-wrap">
              <Skeleton className="w-32 h-9 rounded-xl" />
              <Skeleton className="w-28 h-9 rounded-xl" />
              <Skeleton className="w-28 h-9 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Section Cards Skeleton */}
        <div className="space-y-12">
          {[1, 2].map((s) => (
            <div key={s} className="space-y-5">
              <Skeleton className="w-64 h-7" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {[1, 2, 3].map((c) => (
                  <div key={c} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                    <Skeleton className="aspect-[16/9] w-full rounded-none" />
                    <div className="p-6 space-y-3.5">
                      <Skeleton className="w-28 h-5 rounded-full" />
                      <Skeleton className="w-full h-7" />
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
