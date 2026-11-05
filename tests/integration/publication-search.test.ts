import { expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import { prisma } from '../fixtures/database';
import { publicationSearchPredicate, publicationSearchOrder } from '@/features/publications/server/search';

it('folds public title, summary and author search with literal wildcards and stable SQL pages', async () => {
  const owner = await prisma.user.create({data:{email:'public-search@test.invalid',fullName:'Đặng Nguyễn',status:'ACTIVE'}});
  const category = await prisma.category.create({data:{name:'Tìm kiếm',slug:'search-fixture'}});
  const create = (slug:string,title:string,status:'PUBLISHED'|'DRAFT'='PUBLISHED',visibility:'PUBLIC'|'PRIVATE'='PUBLIC') => prisma.showcaseItem.create({data:{creatorId:owner.id,categoryId:category.id,slug,title,summary:'Nghiên cứu 100%_ chính xác',status,visibility,publishedYear:2026,contributors:{create:{userId:owner.id,displayOrder:0}}}});
  const first = await create('search-first','Đồ án A');
  await create('search-second','Đồ án B');
  await create('search-private','Đồ án riêng','PUBLISHED','PRIVATE');
  await create('search-draft','Đồ án nháp','DRAFT');
  const search = async(q:string,authenticated=false,offset=0) => prisma.$queryRaw<Array<{id:string}>>(Prisma.sql`SELECT id FROM showcase_items WHERE ${publicationSearchPredicate({authenticated,q,categorySlug:category.slug,year:2026})} ORDER BY ${publicationSearchOrder('title')} LIMIT 1 OFFSET ${offset}`);
  expect(await search('do an')).toEqual([{id:first.id}]);
  expect(await search('nghien cuu 100%_')).toEqual([{id:first.id}]);
  expect(await search('dang nguyen')).toEqual([{id:first.id}]);
  expect(await search('100XY')).toEqual([]);
  expect(await search('do an',false,1)).toHaveLength(1);
  expect(await search('do an',false,2)).toEqual([]);
  expect(await search('do an',true,2)).toHaveLength(1);
});
