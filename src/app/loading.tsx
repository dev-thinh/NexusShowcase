import { Skeleton } from '@/components/ui/skeleton';

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-pulse">
      {/* Top Navbar Skeleton */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <Skeleton className="w-32 h-6" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="w-20 h-9 rounded-lg" />
          <Skeleton className="w-24 h-9 rounded-lg" />
        </div>
      </header>

      {/* Hero Section Skeleton */}
      <section className="bg-gradient-to-b from-blue-50/50 to-white py-16 border-b border-slate-200">
        <div className="container mx-auto px-4 max-w-5xl text-center flex flex-col items-center">
          <Skeleton className="w-48 h-6 rounded-full mb-4" />
          <Skeleton className="w-3/4 max-w-xl h-10 mb-4" />
          <Skeleton className="w-1/2 max-w-md h-5 mb-8" />

          <div className="grid grid-cols-3 gap-4 w-full max-w-lg p-4 bg-white rounded-2xl border border-slate-200">
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="w-12 h-8" />
              <Skeleton className="w-24 h-4" />
            </div>
            <div className="flex flex-col items-center gap-2 border-x border-slate-100">
              <Skeleton className="w-12 h-8" />
              <Skeleton className="w-24 h-4" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="w-12 h-8" />
              <Skeleton className="w-24 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* Grid Cards Skeleton */}
      <main className="container mx-auto px-4 py-10 max-w-6xl flex-1">
        <div className="flex justify-between items-center pb-6 border-b border-slate-200 mb-8">
          <div className="flex gap-2">
            <Skeleton className="w-20 h-9 rounded-lg" />
            <Skeleton className="w-32 h-9 rounded-lg" />
            <Skeleton className="w-32 h-9 rounded-lg" />
          </div>
          <Skeleton className="w-48 h-9 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-0 overflow-hidden shadow-xs">
              <Skeleton className="aspect-[16/9] w-full rounded-none" />
              <div className="p-5 space-y-3">
                <Skeleton className="w-24 h-5 rounded-full" />
                <Skeleton className="w-full h-6" />
                <Skeleton className="w-3/4 h-4" />
                <Skeleton className="w-full h-12 pt-2" />
                <div className="pt-3 border-t border-slate-100 flex justify-between">
                  <Skeleton className="w-28 h-4" />
                  <Skeleton className="w-16 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
