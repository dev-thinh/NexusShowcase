import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { RoutePageSkeleton, AdminContentSkeleton } from '@/shared/ui/route-loading';
import { PublicationSkeleton } from '@/shared/ui/content-skeletons';
import { Skeleton } from '@/shared/ui/skeleton';

vi.mock('next/navigation', () => ({ usePathname: () => '/research' }));

it.each([
  ['/', 'home'], ['/research', 'research'], ['/projects', 'projects'],
  ['/members', 'member-directory'], ['/members/all', 'member-cards'], ['/members/an', 'member-profile'],
  ['/works/robot', 'article'], ['/my-works', 'my-works'], ['/my-works/new', 'workspace'], ['/my-works/id/edit', 'workspace'],
  ['/admin', 'admin-overview'], ['/admin/members', 'admin-members'], ['/admin/works', 'admin-works'],
  ['/admin/reviews', 'admin-reviews'], ['/admin/reviews/id', 'review-detail'], ['/admin/reviews/id/preview', 'review-preview'],
  ['/login', 'login'], ['/contact', 'contact'], ['/account/change-password', 'member-profile'],
])('matches %s to the actual %s layout', (pathname, layout) => {
  const html = renderToStaticMarkup(<RoutePageSkeleton pathname={pathname} />);
  expect(html).toContain(`data-page-skeleton="${layout}"`);
  expect(html).toContain('aria-busy="true"');
  expect(html).not.toMatch(/<(img|button|input|a)\b/);
});

it('uses horizontal research rows and keeps projects in their responsive card grid', () => {
  const research = renderToStaticMarkup(<PublicationSkeleton variant="research" />);
  expect(research).toContain('sm:grid-cols-[15rem_minmax(0,1fr)]');
  expect(research).toContain('lg:grid-cols-[16rem_minmax(0,1fr)]');
  expect(research).not.toContain('lg:grid-cols-3');
  const projects = renderToStaticMarkup(<PublicationSkeleton variant="projects" />);
  expect(projects).toContain('md:grid-cols-2 lg:grid-cols-3');
});

it('leaves the shared admin shell in place when only the tab content is loading', () => {
  const html = renderToStaticMarkup(<AdminContentSkeleton pathname="/admin/members" />);
  expect(html).toContain('data-page-skeleton="admin-members"');
  expect(html).not.toContain('<main');
  expect(html).not.toContain('data-admin-skeleton-shell');
});

it('makes decorative skeletons silent and disables pulsing for reduced motion', () => {
  const html = renderToStaticMarkup(<Skeleton className="h-4 w-20" />);
  expect(html).toContain('aria-hidden="true"');
  expect(html).toContain('motion-reduce:animate-none');
});
