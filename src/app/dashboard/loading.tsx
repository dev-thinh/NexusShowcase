import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-pulse">
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
        <Skeleton className="w-32 h-6" />
        <Skeleton className="w-24 h-9 rounded-lg" />
      </header>

      <main className="container mx-auto px-4 py-10 max-w-5xl flex-1">
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-2">
            <Skeleton className="w-64 h-8" />
            <Skeleton className="w-40 h-4" />
          </div>
          <Skeleton className="w-44 h-10 rounded-xl" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <Skeleton className="w-56 h-6" />
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="py-4 flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="w-72 h-5" />
                  <Skeleton className="w-36 h-3" />
                </div>
                <Skeleton className="w-24 h-6 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
