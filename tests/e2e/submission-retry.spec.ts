import { expect, login, test } from './fixtures';

test('retries a committed submission after losing its response without enabling edits or duplicating review history', async({page,fixture,database})=>{
 const author=fixture.users.find(user=>user.role==='CORE_MEMBER')!;
 await login(page,author,'/my-works/new');
 await expect(page).toHaveURL(/\/my-works\/[^/]+\/edit$/);
 const id=page.url().split('/').at(-2)!;
 const category=await database.category.findUniqueOrThrow({where:{slug:'robotics-iot'}});
 await page.locator('#submission-title').fill('Lost submission response');
 await page.locator('#submission-summary').fill('A complete summary');
 await page.getByRole('combobox',{name:'Chuyên mục',exact:true}).click();
 await page.getByRole('option',{name:category.name,exact:true}).click();
 await expect(page.locator('[data-submission-actions]')).toContainText('Đã lưu');
 let drop=true;
 await page.route('**/my-works/**',async route=>{
  if(drop && route.request().method()==='POST' && route.request().headers()['next-action']){
   drop=false;await route.fetch();await route.abort();
  }else await route.continue();
 });
 await page.getByRole('button',{name:'Gửi duyệt',exact:true}).click();
 await page.getByRole('dialog',{name:'Gửi bài duyệt',exact:true}).getByRole('button',{name:'Gửi duyệt',exact:true}).click();
 await expect.poll(async()=>(await database.showcaseItem.findUniqueOrThrow({where:{id}})).status).toBe('PENDING_REVIEW');
 await expect(page.getByRole('button',{name:'Thử gửi lại',exact:true})).toBeEnabled();
 await expect(page.locator('#submission-title')).toBeDisabled();
 await page.getByRole('button',{name:'Thử gửi lại',exact:true}).click();
 await expect(page).toHaveURL(/\/my-works$/);
 expect(await database.submissionRevision.count({where:{itemId:id}})).toBe(1);
 expect(await database.auditEvent.count({where:{itemId:id,action:'SUBMITTED_FOR_REVIEW'}})).toBe(1);
});

test('resumes an unconfirmed submission after reload without permitting unsaved edits',async({page,fixture,database})=>{
 const author=fixture.users.find(user=>user.role==='CORE_MEMBER')!;
 await login(page,author,'/my-works/new');await expect(page).toHaveURL(/\/my-works\/[^/]+\/edit$/);
 const id=page.url().split('/').at(-2)!;const category=await database.category.findUniqueOrThrow({where:{slug:'robotics-iot'}});
 await page.locator('#submission-title').fill('Retry after reload');await page.locator('#submission-summary').fill('Summary');
 await page.getByRole('combobox',{name:'Chuyên mục',exact:true}).click();await page.getByRole('option',{name:category.name,exact:true}).click();
 await expect(page.locator('[data-submission-actions]')).toContainText('Đã lưu');
 await page.route('**/my-works/**',async route=>route.request().method()==='POST'&&route.request().headers()['next-action']?route.abort():route.continue());
 await page.getByRole('button',{name:'Gửi duyệt',exact:true}).click();await page.getByRole('dialog',{name:'Gửi bài duyệt',exact:true}).getByRole('button',{name:'Gửi duyệt',exact:true}).click();
 await expect(page.getByRole('button',{name:'Thử gửi lại',exact:true})).toBeEnabled();
 await page.reload();await expect(page.getByRole('button',{name:'Thử gửi lại',exact:true})).toBeEnabled();await expect(page.locator('#submission-title')).toBeDisabled();
 await page.unroute('**/my-works/**');await page.getByRole('button',{name:'Thử gửi lại',exact:true}).click();
 await expect(page).toHaveURL(/\/my-works$/);expect(await database.submissionRevision.count({where:{itemId:id}})).toBe(1);
});

test('does not unlock an uncertain submitted draft when its session expires before retry',async({page,fixture,database})=>{
 const author=fixture.users.find(user=>user.role==='CORE_MEMBER')!;
 await login(page,author,'/my-works/new');await expect(page).toHaveURL(/\/my-works\/[^/]+\/edit$/);
 const id=page.url().split('/').at(-2)!;const category=await database.category.findUniqueOrThrow({where:{slug:'robotics-iot'}});
 await page.locator('#submission-title').fill('Expired retry session');await page.locator('#submission-summary').fill('Summary');
 await page.getByRole('combobox',{name:'Chuyên mục',exact:true}).click();await page.getByRole('option',{name:category.name,exact:true}).click();
 await expect(page.locator('[data-submission-actions]')).toContainText('Đã lưu');
 let drop=true;
 await page.route('**/my-works/**',async route=>{
  if(drop&&route.request().method()==='POST'&&route.request().headers()['next-action']){drop=false;await route.fetch();await route.abort();}else await route.continue();
 });
 await page.getByRole('button',{name:'Gửi duyệt',exact:true}).click();await page.getByRole('dialog',{name:'Gửi bài duyệt',exact:true}).getByRole('button',{name:'Gửi duyệt',exact:true}).click();
 await expect(page.getByRole('button',{name:'Thử gửi lại',exact:true})).toBeEnabled();
 await database.user.update({where:{id:author.id},data:{sessionVersion:{increment:1}}});
 await page.getByRole('button',{name:'Thử gửi lại',exact:true}).click();
 await expect.poll(async()=>!(await page.locator('#submission-title').count())||await page.locator('#submission-title').isDisabled()).toBe(true);
 expect(await page.evaluate(()=>Object.keys(localStorage).some(key=>key.startsWith('nexus:submission-attempt:')))).toBe(true);
 expect((await database.showcaseItem.findUniqueOrThrow({where:{id}})).status).toBe('PENDING_REVIEW');
});
