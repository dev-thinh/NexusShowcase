import { expect, login, test } from './fixtures';

test('legacy page addresses redirect directly with filters preserved', async ({ request }) => {
 for(const [source,target] of [
  ['/category/bai-bao-khoa-hoc','/research'],['/category/robotics-iot','/projects'],['/explore','/research'],
  ['/category/du-an-sang-tao','/projects'],['/category/thanh-tich','/research'],
  ['/showcase/old-work','/works/old-work'],['/dashboard','/my-works'],['/dashboard/items/new','/my-works/new'],
  ['/dashboard/items/existing-id/edit','/my-works/existing-id/edit'],['/admin/content','/admin/works'],
 ]) {
  const response=await request.get(`${source}?q=robot&page=2`,{maxRedirects:0});
  expect(response.status()).toBe(308);
  const location=new URL(response.headers().location,'https://nexus.test');
  expect(location.pathname).toBe(target); expect(location.searchParams.get('q')).toBe('robot'); expect(location.searchParams.get('page')).toBe('2');
 }
});

test('navigation, filtered detail return links and account links use canonical URLs', async ({ page,fixture }) => {
 await page.goto('/research?q=Benchmark');
 await expect(page.getByRole('heading',{level:1,name:'Benchmark Research',exact:true})).toBeVisible();
 const detail=page.locator('main a[href^="/works/"]').first();
 await detail.click(); await expect(page).toHaveURL(/\/works\/[^/]+/);
 const back=page.locator('[data-breadcrumbs] a[href^="/research"]');
 await expect(back).toHaveAttribute('href','/research?q=Benchmark');
 await back.click(); await expect(page).toHaveURL(/\/research\?q=Benchmark$/);
 await login(page,fixture.users[0],'/admin/works');
 await expect(page).toHaveURL(/\/admin\/works$/);
 await page.getByRole('button',{name:/Menu tài khoản:/}).click();
 const menu=page.getByRole('navigation',{name:'Chức năng tài khoản'});
 await expect(menu.getByRole('link',{name:'Công trình của tôi',exact:true})).toHaveAttribute('href','/my-works');
 await expect(menu.getByRole('link',{name:'Đăng bài mới',exact:true})).toHaveAttribute('href','/my-works/new');
});
