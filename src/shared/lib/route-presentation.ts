const routes = {
  '/': { layout: 'home', title: 'Trang chủ' },
  '/research': { layout: 'research', title: 'Nghiên cứu khoa học' },
  '/projects': { layout: 'projects', title: 'Dự án & Sản phẩm' },
  '/members': { layout: 'member-directory', title: 'Thành viên CLB Robotics & IoT - HCMUS' },
  '/members/all': { layout: 'member-cards', title: 'Tất cả thành viên' },
  '/my-works': { layout: 'my-works', title: 'Công trình của tôi' },
  '/my-works/new': { layout: 'workspace', title: 'Đăng công trình mới' },
  '/admin': { layout: 'admin-overview', title: 'Tổng quan quản trị' },
  '/admin/members': { layout: 'admin-members', title: 'Quản lý thành viên' },
  '/admin/works': { layout: 'admin-works', title: 'Nội dung' },
  '/admin/reviews': { layout: 'admin-reviews', title: 'Phê duyệt bài đăng' },
  '/login': { layout: 'login', title: 'Đăng nhập' },
  '/contact': { layout: 'contact', title: 'Liên hệ Ban chủ nhiệm CLB Robotics & IoT - HCMUS' },
  '/account/change-password': { layout: 'member-profile', title: 'Đổi mật khẩu' },
} as const;

type RoutePresentation = {
  layout: typeof routes[keyof typeof routes]['layout'] | 'review-preview' | 'review-detail' | 'article' | 'content';
  title?: string;
};

/** Match static routes before dynamic families such as /members/[id]. */
export function getRoutePresentation(pathname: string): RoutePresentation {
  const exact = routes[pathname as keyof typeof routes];
  if (exact) return exact;
  if (/^\/admin\/reviews\/[^/]+\/preview$/.test(pathname)) return { layout: 'review-preview', title: 'Phê duyệt bài đăng' };
  if (pathname.startsWith('/admin/reviews/')) return { layout: 'review-detail', title: 'Phê duyệt bài đăng' };
  if (/^\/my-works\/[^/]+\/edit$/.test(pathname)) return { layout: 'workspace', title: 'Chỉnh sửa bài đăng' };
  if (pathname.startsWith('/members/')) return { layout: 'member-profile' };
  if (pathname.startsWith('/works/')) return { layout: 'article' };
  return { layout: 'content' };
}
