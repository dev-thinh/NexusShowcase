import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl h-full flex items-center justify-between">
          <Skeleton className="w-36 h-6" />
          <Skeleton className="w-24 h-9 rounded-xl" />
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="space-y-2">
            <Skeleton className="w-72 h-9" />
            <Skeleton className="w-56 h-5" />
          </div>
          <Skeleton className="w-52 h-10 rounded-xl" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <Skeleton className="w-56 h-7" />
            <Skeleton className="w-20 h-7 rounded-full" />
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex gap-2">
                    <Skeleton className="w-28 h-5 rounded-full" />
                    <Skeleton className="w-20 h-5" />
                  </div>
                  <Skeleton className="w-4/5 h-6" />
                  <Skeleton className="w-3/5 h-4" />
                </div>
                <Skeleton className="w-28 h-7 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
