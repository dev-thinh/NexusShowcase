import { LoadingCards, LoadingTitle } from '@/shared/ui/loading-content';
export default function Loading() {
  return <main className="container mx-auto max-w-7xl flex-1 space-y-8 px-4 py-10 sm:px-6 lg:px-8"><LoadingTitle fallback="Đang tải trang…" /><LoadingCards /></main>;
}
