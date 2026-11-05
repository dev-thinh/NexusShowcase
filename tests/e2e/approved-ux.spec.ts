import { expect,test } from './fixtures';
import { serializeArticle } from '../../src/features/submissions/model/article';

test('titles follow pages, detail highlights its parent and mobile contents precedes the body',async({page,fixture,database})=>{
 const category=await database.category.findUniqueOrThrow({where:{slug:'bai-bao-khoa-hoc'}});
 const content=serializeArticle({version:1,sections:[{id:'method',title:'Phương pháp',blocks:[{id:'text',kind:'TEXT',text:'Nội dung phương pháp nghiên cứu.'}]}]});
 await database.showcaseItem.create({data:{creatorId:fixture.users[1].id,slug:'approved-ux-review',title:'Công trình kiểm tra UX',summary:'Tóm tắt nghiên cứu',content,type:'RESEARCH_PAPER',categoryId:category.id,status:'PUBLISHED',visibility:'PUBLIC',links:{create:{label:'Mã nguồn',url:'https://github.com/lab/robot',type:'GITHUB'}}}});
 await page.setViewportSize({width:390,height:844});
 await page.goto('/works/approved-ux-review');
 await expect(page).toHaveTitle('Công trình kiểm tra UX | Robotics & IoT HCMUS');
 await expect(page.locator('#public-navigation a[href="/research"]')).toHaveAttribute('aria-current','location');
 const contents=page.locator('article details');await expect(contents).toBeVisible();await expect(contents).not.toHaveAttribute('open','');
 await contents.locator('summary').click();await expect(contents.getByRole('link',{name:/Phương pháp/})).toBeVisible();
 const tocBox=await contents.boundingBox();const body=await page.locator('#section-1').boundingBox();expect(tocBox!.y).toBeLessThan(body!.y);
 await expect(page.getByRole('region',{name:'Tài nguyên công trình'}).getByRole('link',{name:'Mã nguồn',exact:true})).toBeVisible();
 await page.setViewportSize({width:1440,height:1000});
 await expect(contents).toBeHidden();await expect(page.locator('aside').getByRole('navigation',{name:'Mục lục bài viết'})).toBeVisible();
 await page.goto('/members');await expect(page).toHaveTitle('Thành viên | Robotics & IoT HCMUS');
 await page.goto('/research');await expect(page).toHaveTitle('Nghiên cứu khoa học | Robotics & IoT HCMUS');
 await page.goto('/projects');await expect(page).toHaveTitle('Dự án & Sản phẩm | Robotics & IoT HCMUS');
});
