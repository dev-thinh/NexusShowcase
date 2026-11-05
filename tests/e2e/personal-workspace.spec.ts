import {expect,login,test} from './fixtures';

for(const width of [390,1440])test(`personal tabs, filters and breadcrumbs are visible and consistent at ${width}px`,async({page,fixture})=>{
 await page.setViewportSize({width,height:1000});
 const user=fixture.users[1];await login(page,user);
 const tabs=page.getByRole('navigation',{name:'Điều hướng quản lý',exact:true});
 await expect(tabs).toHaveCount(0);
 await expect(page.locator('[data-breadcrumbs]')).toContainText('Công trình của tôi');
 const filters=page.getByRole('combobox',{name:'Lọc trạng thái bài đăng'});
 if(width<768)await page.getByRole('button',{name:/Bộ lọc/}).click();
 await filters.click();
 await page.getByRole('option',{name:/^Bản nháp/}).click();
 await page.getByRole('search').getByRole('button',{name:'Áp dụng',exact:true}).click();
 await expect(page).toHaveURL(/filter=DRAFT/);
 await expect(page.getByRole('search').locator('input[name="filter"]')).toHaveValue('DRAFT');
 await page.locator('#my-post-search').fill('Benchmark');await page.locator('#my-post-search').press('Enter');
 await expect(page).toHaveURL(url=>url.searchParams.get('filter')==='DRAFT'&&url.searchParams.get('q')==='Benchmark');
 await page.getByRole('button',{name:/Menu tài khoản:/}).click();
 await page.getByRole('navigation',{name:'Chức năng tài khoản'}).getByRole('link',{name:'Hồ sơ của tôi',exact:true}).click();
 await expect(page).toHaveURL(new RegExp(`/members/${user.id}$`));
 await expect(tabs).toHaveCount(0);
 const breadcrumb=page.locator('[data-breadcrumbs]');await expect(breadcrumb).toContainText('Hồ sơ của tôi');
 await expect(breadcrumb.locator('a[href="/members"]')).toHaveCount(0);
 await page.getByRole('button',{name:/Menu tài khoản:/}).click();
 await expect(page.getByRole('navigation',{name:'Chức năng tài khoản'}).getByRole('link',{name:'Hồ sơ của tôi',exact:true})).toHaveAttribute('aria-current','page');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.goto(`/members/${fixture.users[3].id}`);
 await expect(page.locator('[data-breadcrumbs] a[href="/members"]')).toBeVisible();
 await expect(page.getByRole('navigation',{name:'Điều hướng quản lý',exact:true})).toHaveCount(0);
});

test('admin member directory has ten rows per page and retains filters in pagination',async({page,fixture})=>{
 await login(page,fixture.users[0],'/admin/members');
 const rows=page.locator('section[aria-label="Danh sách thành viên"] ul > li');await expect(rows).toHaveCount(10);
 const count=page.getByText('Hiển thị 10 / 100 thành viên',{exact:true});
 await expect(count).toBeVisible();await expect(count).toHaveCSS('text-align','right');
 await expect(page.locator('section[aria-label="Danh sách thành viên"]')).not.toContainText('Hiển thị');
 const footer=page.locator('[data-pagination-footer]');
 await expect(footer).toContainText('Trang 1 / 10 · 10 thành viên mỗi trang');
 const footerBox=await footer.boundingBox();const navBox=await footer.locator('nav').boundingBox();
 expect(Math.abs(footerBox!.x+footerBox!.width-navBox!.x-navBox!.width)).toBeLessThan(2);

 await page.getByRole('navigation',{name:'Phân trang thành viên'}).getByRole('link',{name:'Trang sau',exact:true}).click();
 await expect(page).toHaveURL(/page=2/);await expect(rows).toHaveCount(10);
 await page.getByRole('combobox',{name:'Vai trò',exact:true}).click();
 await page.getByRole('option',{name:/^Thành viên/}).click();
 await page.getByRole('search').getByRole('button',{name:'Áp dụng',exact:true}).click();
 await expect(page).toHaveURL(url=>url.searchParams.get('role')==='MEMBER');await expect(rows).toHaveCount(10);
 await page.locator('#admin-member-search').fill('Benchmark');await page.locator('#admin-member-search').press('Enter');
 await expect(page).toHaveURL(url => url.searchParams.get('role') === 'MEMBER' && url.searchParams.get('q') === 'Benchmark');await expect(rows).toHaveCount(10);
 await page.getByRole('navigation',{name:'Phân trang thành viên'}).getByRole('link',{name:'Trang sau',exact:true}).click();
 await expect(page).toHaveURL(url => url.searchParams.get('role') === 'MEMBER' && url.searchParams.get('q') === 'Benchmark' && url.searchParams.get('page') === '2');await expect(rows).toHaveCount(10);
});


test('public members shows all members without pagination',async({page,fixture})=>{
 await page.goto('/members?page=99&corePage=99&adminPage=99');
 await expect(page.getByRole('navigation',{name:'Phân trang thành viên'})).toHaveCount(0);
 const wall=page.locator('main .home-member-grid');
 await expect(wall).toHaveCount(3);
 await expect(page.locator('main .home-member-grid a')).toHaveCount(fixture.users.length);
});
