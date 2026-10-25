import { Skeleton } from '@/shared/ui/skeleton';

export default function AdminLoading() {
  return <div role="status" aria-label="Đang tải nội dung quản trị" className="space-y-4">
    <Skeleton className="h-7 w-48" />
    <Skeleton className="h-11 w-full" />
    <Skeleton className="h-64 w-full rounded-xl" />
  </div>;
}
