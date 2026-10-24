'use client';

import { Skeleton } from '@/shared/ui/skeleton';
import { usePathname } from 'next/navigation';

export function LoadingTitle({ fallback, pathname: destination }: { fallback: string; pathname?: string }) {
  const currentPathname = usePathname();
  const pathname = destination ?? currentPathname;
  const title = pathname === '/' ? 'Trang chủ'
    : pathname === '/explore' ? 'Khám phá công trình'
    : pathname === '/members' ? 'Thành viên CLB Robotics & IoT'
    : pathname === '/login' ? 'Đăng nhập'
    : pathname === '/account/change-password' ? 'Đổi mật khẩu'
    : pathname === '/admin/members' ? 'Quản lý thành viên'
    : pathname.startsWith('/admin/reviews') ? 'Phê duyệt bài đăng'
    : pathname === '/admin' ? 'Tổng quan quản trị'
    : pathname.includes('/items/new') ? 'Đăng công trình mới'
    : pathname.includes('/edit') ? 'Chỉnh sửa bài đăng'
    : pathname.startsWith('/dashboard') ? 'Bài đăng của tôi'
    : pathname.startsWith('/members/all') ? 'Tất cả thành viên'
    : pathname.startsWith('/category/bai-bao-khoa-hoc') ? 'Nghiên cứu khoa học'
    : pathname.startsWith('/category/robotics-iot') ? 'Robotics & IoT'
    : fallback;
  return <h1 className="text-2xl font-semibold tracking-tight text-[#1F2937] sm:text-3xl">{title}</h1>;
}

export function LoadingCards({ members = false }: { members?: boolean }) {
  return <div role="status" aria-label="Đang tải dữ liệu" aria-busy="true" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {[1, 2, 3, 4, 5, 6].map(index => <div key={index} className="panel-public space-y-4">
      <Skeleton className={members ? 'h-14 w-14 rounded-full' : 'aspect-video w-full rounded-md'} />
      <Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" />
    </div>)}
    <span className="sr-only">Đang tải nội dung, vui lòng chờ.</span>
  </div>;
}
