import { expect, it } from 'vitest';
import nextConfig from '../../next.config';
import { categoryPagePath } from '@/shared/lib/page-urls';
import { showcaseHref, showcaseReturnTarget } from '@/features/publications/model/navigation';
it('uses current page names in public and private canonical paths', () => {
 expect(categoryPagePath('bai-bao-khoa-hoc')).toBe('/research');
 expect(categoryPagePath('robotics-iot')).toBe('/projects');
 expect(showcaseHref('robot','/projects?page=2')).toBe('/works/robot?returnTo=%2Fprojects%3Fpage%3D2');
});
it('retains direct permanent legacy redirects rather than chaining retired page routes', async () => {
 const redirects=await nextConfig.redirects!();
 for(const [source,destination] of [
  ['/category/bai-bao-khoa-hoc','/research'],['/category/robotics-iot','/projects'],['/category/du-an-sang-tao','/projects'],['/category/thanh-tich','/research'],['/explore','/research'],
  ['/showcase/:slug','/works/:slug'],['/dashboard','/my-works'],['/dashboard/items/new','/my-works/new'],['/dashboard/items/:id/edit','/my-works/:id/edit'],['/admin/content','/admin/works'],
 ]) expect(redirects).toContainEqual({source,destination,permanent:true});
});
it('normalizes old return links and keeps the internal destination allowlist', () => {
 expect(showcaseReturnTarget('/category/bai-bao-khoa-hoc?q=robot&page=2','/projects')).toBe('/research?q=robot&page=2');
 expect(showcaseReturnTarget('/explore?q=robot','/projects')).toBe('/research?q=robot');
 expect(showcaseReturnTarget('/projects?year=2026','/research')).toBe('/projects?year=2026');
 expect(showcaseReturnTarget('//evil.test/projects','/research')).toBe('/research');
 expect(showcaseReturnTarget('/admin/works','/research')).toBe('/research');
});
