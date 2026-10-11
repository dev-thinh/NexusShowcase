import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl h-full flex items-center justify-between">
          <Skeleton className="w-36 h-6" />
          <Skeleton className="w-24 h-9 rounded-xl" />
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl flex-1">
        {/* Banner Skeleton */}
        <div className="p-6 sm:p-10 rounded-2xl bg-slate-900 border border-slate-800 mb-8 space-y-3.5">
          <Skeleton className="w-48 h-6 rounded-full bg-slate-800" />
          <Skeleton className="w-80 h-10 bg-slate-800" />
          <Skeleton className="w-full max-w-lg h-5 bg-slate-800" />
        </div>

        {/* Widgets Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-10">
          <div className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <Skeleton className="w-24 h-6 rounded-full" />
            </div>
            <Skeleton className="w-56 h-7" />
            <Skeleton className="w-full h-10" />
            <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
              <Skeleton className="w-24 h-9" />
              <Skeleton className="w-28 h-5" />
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <Skeleton className="w-28 h-6 rounded-full" />
            </div>
            <Skeleton className="w-64 h-7" />
            <Skeleton className="w-full h-10" />
            <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
              <Skeleton className="w-32 h-9" />
              <Skeleton className="w-32 h-5" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
