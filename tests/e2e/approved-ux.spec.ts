import { expect,test } from './fixtures';
import { serializeArticle } from '../../src/features/submissions/model/article';

test('titles follow pages, detail highlights its parent and mobile contents floats beside the article',async({page,fixture,database})=>{
 const category=await database.category.findUniqueOrThrow({where:{slug:'bai-bao-khoa-hoc'}});
 const content=serializeArticle({version:1,sections:[{id:'method',title:'Phương pháp',blocks:[{id:'text',kind:'TEXT',text:'Nội dung phương pháp nghiên cứu. '.repeat(150)}]}]});
 await database.showcaseItem.create({data:{creatorId:fixture.users[1].id,slug:'approved-ux-review',title:'Công trình kiểm tra UX',summary:'Tóm tắt nghiên cứu',content,type:'RESEARCH_PAPER',categoryId:category.id,status:'PUBLISHED',visibility:'PUBLIC',links:{create:{label:'Mã nguồn',url:'https://github.com/lab/robot',type:'GITHUB'}}}});
 await page.setViewportSize({width:390,height:844});
 await page.goto('/works/approved-ux-review');
 await expect(page).toHaveTitle('Công trình kiểm tra UX | Robotics & IoT HCMUS');
 await expect(page.locator('#public-navigation a[href="/research"]')).toHaveAttribute('aria-current','location');
 const trigger=page.getByRole('button',{name:'Mở mục lục',exact:true});
 const contents=page.getByRole('dialog',{name:'Mục lục bài viết',exact:true});
 await expect(trigger).toBeVisible();await expect(contents).toBeHidden();
 expect(await page.locator('article details').count()).toBe(0);
 const before=await trigger.boundingBox();
 await page.evaluate(()=>window.scrollTo(0,700));
 const after=await trigger.boundingBox();
 expect(Math.abs(before!.y-after!.y)).toBeLessThan(2);
 expect(after!.x+after!.width).toBeLessThanOrEqual(390);
 await trigger.click();await expect(contents).toBeVisible();
 await contents.getByRole('link',{name:/Phương pháp/}).click();
 await expect(contents).toBeHidden();await expect(page).toHaveURL(/#section-1$/);
 expect((await page.locator('#section-1').boundingBox())!.y).toBeGreaterThanOrEqual(80);
 await trigger.click();await page.keyboard.press('Escape');await expect(contents).toBeHidden();
 await expect(trigger).toBeFocused();
 await trigger.click();await page.locator('#section-title-1').click();await expect(contents).toBeHidden();
 await trigger.click();await contents.getByRole('button',{name:'Đóng mục lục'}).click();await expect(contents).toBeHidden();
 for(const width of [320,390,768]) {
  await page.setViewportSize({width,height:844});
  await trigger.click();await expect(contents).toBeVisible();
  const bounds=await contents.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);expect(bounds!.height).toBeLessThanOrEqual(844*0.65+1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.keyboard.press('Escape');
 }
 await expect(page.getByRole('region',{name:'Tài nguyên công trình'}).getByRole('link',{name:'Mã nguồn',exact:true})).toBeVisible();
 await trigger.click();
 await page.setViewportSize({width:1440,height:1000});
 await expect(trigger).toBeHidden();await expect(contents).toBeHidden();
 await expect(page.locator('aside').getByRole('navigation',{name:'Mục lục bài viết'})).toBeVisible();
 await page.setViewportSize({width:390,height:844});await expect(contents).toBeHidden();
 await page.goto('/members');await expect(page).toHaveTitle('Thành viên | Robotics & IoT HCMUS');
 await page.goto('/research');await expect(page).toHaveTitle('Nghiên cứu khoa học | Robotics & IoT HCMUS');
 await page.goto('/projects');await expect(page).toHaveTitle('Dự án & Sản phẩm | Robotics & IoT HCMUS');
});
