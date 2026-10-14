import { Skeleton } from '@/components/ui/skeleton';

export default function ShowcaseDetailLoading() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl h-full flex items-center justify-between">
          <Skeleton className="w-36 h-6" />
          <Skeleton className="w-24 h-9 rounded-lg" />
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl flex-1">
        <Skeleton className="w-48 h-5 mb-5" />

        {/* Header Skeleton */}
        <div className="panel-detail mb-6 space-y-4">
          <div className="flex gap-2.5">
            <Skeleton className="w-28 h-6 rounded-md" />
            <Skeleton className="w-24 h-6 rounded-md" />
          </div>
          <Skeleton className="w-4/5 h-10" />
          <div className="panel-nested space-y-2">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-full h-12" />
          </div>
          <div className="action-row-detail">
            <Skeleton className="w-36 h-9 rounded-lg" />
            <Skeleton className="w-40 h-9 rounded-lg" />
            <Skeleton className="w-40 h-9 rounded-lg" />
          </div>
        </div>

        {/* Video Skeleton */}
        <div className="panel-detail mb-6 space-y-4">
          <Skeleton className="w-48 h-6" />
          <Skeleton className="aspect-video w-full rounded-lg" />
        </div>

        {/* Contributors Skeleton */}
        <div className="panel-detail mb-6 space-y-5">
          <div className="flex justify-between items-center">
            <Skeleton className="w-48 h-6" />
            <Skeleton className="w-24 h-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="panel-nested flex items-center gap-3.5">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="w-36 h-5" />
                  <Skeleton className="w-28 h-4 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
