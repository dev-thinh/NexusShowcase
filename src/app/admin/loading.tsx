import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-pulse">
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
        <Skeleton className="w-32 h-6" />
        <Skeleton className="w-24 h-9 rounded-lg" />
      </header>

      <main className="container mx-auto px-4 py-10 max-w-5xl flex-1">
        <div className="mb-8 space-y-2">
          <Skeleton className="w-72 h-8" />
          <Skeleton className="w-96 h-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </main>
    </div>
  );
}
