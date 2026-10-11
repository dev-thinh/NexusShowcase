import { Skeleton } from '@/components/ui/skeleton';

export default function HomeLoading() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Top Navbar Skeleton */}
      <header className="h-16 bg-white/95 border-b border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="w-36 h-5" />
              <Skeleton className="w-48 h-3 hidden sm:block" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="w-24 h-9 rounded-xl" />
            <Skeleton className="w-24 h-9 rounded-xl" />
          </div>
        </div>
      </header>

      {/* Hero Section Skeleton */}
      <section className="py-14 sm:py-20 border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center flex flex-col items-center">
          <Skeleton className="w-64 h-7 rounded-full mb-5" />
          <Skeleton className="w-full max-w-3xl h-14 mb-4" />
          <Skeleton className="w-full max-w-xl h-6 mb-10" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-3xl p-5 bg-white/95 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col items-center gap-2 p-2">
              <Skeleton className="w-20 h-10" />
              <Skeleton className="w-28 h-4" />
            </div>
            <div className="flex flex-col items-center gap-2 p-2 sm:border-x border-slate-100">
              <Skeleton className="w-20 h-10" />
              <Skeleton className="w-28 h-4" />
            </div>
            <div className="flex flex-col items-center gap-2 p-2">
              <Skeleton className="w-20 h-10" />
              <Skeleton className="w-28 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* Grid Cards Skeleton */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200 mb-8">
          <div className="flex gap-2.5 flex-wrap">
            <Skeleton className="w-32 h-10 rounded-xl" />
            <Skeleton className="w-36 h-10 rounded-xl" />
            <Skeleton className="w-36 h-10 rounded-xl" />
          </div>
          <Skeleton className="w-72 h-10 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <Skeleton className="aspect-[16/9] w-full rounded-none" />
              <div className="p-6 space-y-3.5">
                <Skeleton className="w-28 h-5 rounded-full" />
                <Skeleton className="w-full h-7" />
                <Skeleton className="w-4/5 h-4" />
                <Skeleton className="w-full h-12 pt-2" />
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <Skeleton className="w-32 h-4" />
                  <Skeleton className="w-20 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
