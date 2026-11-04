/** Category IDs/slugs stay internal; public URLs use the current page names. */
export function categoryPagePath(slug: string): string {
  return slug === 'robotics-iot' || slug === 'du-an-sang-tao' ? '/projects' : '/research';
}

export const legacyPageRedirects = [
  { source: '/category/bai-bao-khoa-hoc', destination: '/research', permanent: true },
  { source: '/category/robotics-iot', destination: '/projects', permanent: true },
  { source: '/category/du-an-sang-tao', destination: '/projects', permanent: true },
  { source: '/category/thanh-tich', destination: '/research', permanent: true },
  { source: '/explore', destination: '/research', permanent: true },
  { source: '/showcase/:slug', destination: '/works/:slug', permanent: true },
  { source: '/dashboard/items/new', destination: '/my-works/new', permanent: true },
  { source: '/dashboard/items/:id/edit', destination: '/my-works/:id/edit', permanent: true },
  { source: '/dashboard', destination: '/my-works', permanent: true },
  { source: '/admin/content', destination: '/admin/works', permanent: true },
];
