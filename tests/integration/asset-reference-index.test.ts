import {expect,it,vi} from 'vitest';
import {prisma} from '../fixtures/database';
vi.mock('@/features/identity/server/actor',()=>({getActor:async()=>null}));
import {getAssetAccess} from '@/features/assets/server/access';
it('maintains live/link/history provenance and immediately revokes anonymous access on visibility change',async()=>{
 const user=await prisma.user.create({data:{email:'reference-index@test.invalid',fullName:'Indexed Owner',role:'CORE_MEMBER',status:'ACTIVE'}});
 const live='/uploads/thumbnails/index-live.png',draft='/uploads/documents/index-history.pdf',link='/uploads/resources/index-link.bin';
 const item=await prisma.showcaseItem.create({data:{title:'Indexed',slug:'indexed',summary:'Indexed',creatorId:user.id,status:'PUBLISHED',visibility:'PUBLIC',thumbnailUrl:live}});
 expect(await prisma.assetItemReference.findMany({where:{itemId:item.id}})).toHaveLength(1);
 expect(await getAssetAccess(live)).toMatchObject({allowed:true,public:true});
 await prisma.itemLink.create({data:{itemId:item.id,url:link,type:'OTHER',label:'Reference'}});
 await prisma.submissionRevision.create({data:{itemId:item.id,revisionNumber:1,snapshot:{thumbnailUrl:draft},submittedById:user.id}});
 expect((await prisma.assetItemReference.findMany({where:{itemId:item.id}})).map(r=>r.url).sort()).toEqual([live,draft,link].sort());
 expect(await getAssetAccess(draft)).toMatchObject({allowed:false});
 await prisma.showcaseItem.update({where:{id:item.id},data:{visibility:'PRIVATE'}});
 expect(await getAssetAccess(live)).toMatchObject({allowed:false});
 await prisma.itemLink.deleteMany({where:{itemId:item.id}});
 expect(await prisma.assetItemReference.count({where:{url:link}})).toBe(0);
 await prisma.showcaseItem.delete({where:{id:item.id}});
 expect(await prisma.assetItemReference.count({where:{itemId:item.id}})).toBe(0);
});
it('indexes encoded and historical draft references without granting access for an external URL',async()=>{
 const user=await prisma.user.create({data:{email:'reference-encoded@test.invalid',fullName:'Encoded Owner',role:'CORE_MEMBER',status:'ACTIVE'}});
 const url='/uploads/thumbnails/index-encoded.png';
 const item=await prisma.showcaseItem.create({data:{title:'Encoded',slug:'encoded',summary:'',creatorId:user.id,status:'PUBLISHED',visibility:'PUBLIC',content:'https://foreign.test'+url,authorDraft:{content:url.replaceAll('/','%252F')}}});
 expect(await prisma.assetItemReference.count({where:{itemId:item.id,url}})).toBe(1);
 expect(await getAssetAccess(url)).toMatchObject({allowed:false});
 await prisma.showcaseItem.update({where:{id:item.id},data:{thumbnailUrl:url}});
 expect(await getAssetAccess(url)).toMatchObject({allowed:true});
});

it('preserves the union of references under concurrent child inserts',async()=>{
 const user=await prisma.user.create({data:{email:'reference-race@test.invalid',fullName:'Index Race',status:'ACTIVE'}});
 const item=await prisma.showcaseItem.create({data:{creatorId:user.id,title:'Race',slug:'index-race',summary:''}});
 const urls=Array.from({length:8},(_,index)=>`/uploads/resources/race-${index}.bin`);
 await Promise.all(urls.map(url=>prisma.itemLink.create({data:{itemId:item.id,url,type:'OTHER',label:'Concurrent'}})));
 expect((await prisma.assetItemReference.findMany({where:{itemId:item.id}})).map(r=>r.url).sort()).toEqual(urls.sort());
});
