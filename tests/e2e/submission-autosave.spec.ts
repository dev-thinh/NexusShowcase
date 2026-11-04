import { expect, login, test } from './fixtures';

test('creates an empty draft immediately and autosaves without blocking typing or duplicating preview', async ({ page, fixture, database }) => {
 const author = fixture.users.find(user => user.role === 'CORE_MEMBER')!;
 await login(page, author);
 await page.getByRole('link',{name:'Đăng bài mới',exact:true}).click();
 await expect(page).toHaveURL(/\/my-works\/[^/]+\/edit$/);
 const id = page.url().split('/').at(-2)!;
 expect(await database.showcaseItem.findUniqueOrThrow({where:{id}})).toMatchObject({creatorId:author.id,status:'DRAFT',title:''});
 await expect(page.getByRole('button',{name:'Xem trước',exact:true})).toHaveCount(1);
 await expect(page.locator('[data-submission-actions]').getByRole('button',{name:'Xem trước',exact:true}).locator('svg')).toBeVisible();
 await page.locator('#submission-title').fill('Tự lưu công trình');
 await page.locator('#submission-summary').fill('Nội dung được giữ tự động');
 await expect(page.locator('#submission-title')).toBeEnabled();
 await expect.poll(async()=> (await database.showcaseItem.findUniqueOrThrow({where:{id}})).authorDraft).toMatchObject({title:'Tự lưu công trình',summary:'Nội dung được giữ tự động'});
 await page.reload();
 await expect(page.locator('#submission-title')).toHaveValue('Tự lưu công trình');
 await page.getByRole('button',{name:'Xem trước',exact:true}).click();
 await expect(page.getByRole('button',{name:'Soạn thảo',exact:true})).toHaveCount(1);
 await page.locator('[data-breadcrumbs]').getByRole('link',{name:'Công trình của tôi',exact:true}).click();
 await expect(page).toHaveURL(/\/my-works$/);
 await expect(page.getByRole('heading',{level:3,name:'Tự lưu công trình',exact:true})).toBeVisible();
});

test('preserves both tabs on version conflict', async ({ page, context, fixture, database }) => {
 const author = fixture.users.find(user=>user.role==='CORE_MEMBER')!;
 await login(page,author,'/my-works/new');
 await expect(page).toHaveURL(/\/my-works\/[^/]+\/edit$/);
 const url = page.url(); const id=url.split('/').at(-2)!;
 const second = await context.newPage();
 try {
  await test.step('open an independent editor at the same version', async()=>{
   await second.goto(url); await expect(second.locator('#submission-title')).toBeEnabled();
  });
  await test.step('save the winning tab',async()=>{
   await page.bringToFront(); await page.locator('#submission-title').fill('Tab thứ nhất');
   await expect.poll(async()=> (await database.showcaseItem.findUniqueOrThrow({where:{id}})).title).toBe('Tab thứ nhất');
   await expect(page.locator('[data-submission-actions]')).toContainText('Đã lưu');
  });
  await test.step('retain the losing tab without overwriting the winner',async()=>{
   await second.bringToFront(); await second.locator('#submission-title').fill('Nội dung tab thứ hai');
   await expect(second.getByText('Bài đã thay đổi.',{exact:false})).toBeVisible();
   await expect(second.locator('#submission-title')).toHaveValue('Nội dung tab thứ hai');
   expect((await database.showcaseItem.findUniqueOrThrow({where:{id}})).title).toBe('Tab thứ nhất');
  });
 } finally {await second.close();}
});

test('recovers offline edits after reload and reconnect', async ({ page, context, fixture, database }) => {
 const author = fixture.users.find(user=>user.role==='CORE_MEMBER')!;
 await login(page,author,'/my-works/new');
 await expect(page).toHaveURL(/\/my-works\/[^/]+\/edit$/);
 const id=page.url().split('/').at(-2)!;
 await test.step('retain an offline edit locally',async()=>{
  await context.setOffline(true);
  await page.locator('#submission-summary').fill('Viết khi mất mạng');
  await expect.poll(() => page.evaluate(() => Object.keys(localStorage).some(key => key.startsWith('nexus:draft-recovery:') && localStorage.getItem(key)?.includes('Viết khi mất mạng')))).toBe(true);
 });
 await test.step('reload and restore while writes are unavailable',async()=>{
  await page.route('**/*', async route => route.request().method()==='POST' && route.request().headers()['next-action'] ? route.abort() : route.continue());
  await context.setOffline(false); await page.reload();
  await expect(page.getByRole('region',{name:'Khôi phục bản nháp'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Khôi phục',exact:true})).toHaveCount(0);
  await expect(page.locator('#submission-summary')).toHaveValue('Viết khi mất mạng');
 });
 await test.step('sync the restored edit',async()=>{
  await page.unroute('**/*');
  await page.getByRole('button',{name:'Lưu bản nháp',exact:true}).click();
  await expect.poll(async()=> (await database.showcaseItem.findUniqueOrThrow({where:{id}})).authorDraft).toMatchObject({summary:'Viết khi mất mạng'});
 });
});
