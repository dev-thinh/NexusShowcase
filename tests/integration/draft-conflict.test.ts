import { saveShowcaseDraftAction, submitShowcaseForReviewAction } from '@/features/submissions/server/actions';
import { beforeAll, expect, it, vi } from 'vitest';
import { prisma } from '../fixtures/database';
const session = vi.hoisted(() => ({ id: '' }));
vi.mock('@/features/identity/server/actor', () => ({ getActor: async () => ({ id: session.id, role: 'CORE_MEMBER', status: 'ACTIVE' }) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
beforeAll(async () => {
  const user = await prisma.user.create({ data: { email: 'versioned@nexus.test', fullName: 'Author', status: 'ACTIVE', role: 'CORE_MEMBER' } });
  session.id = user.id;
});

it('rejects stale saves and submissions and preserves the winning draft', async () => {
  const item = await prisma.showcaseItem.create({ data: { title: 'Original', slug: 'versioned', summary: '', creatorId: session.id } });
  const result = await saveShowcaseDraftAction({ itemId: item.id, expectedReviewVersion: item.reviewVersion, draft: { title: 'First editor' } });
  expect(result).toMatchObject({ success: true, data: { reviewVersion: item.reviewVersion + 1 } });
  expect(await saveShowcaseDraftAction({ itemId: item.id, expectedReviewVersion: item.reviewVersion, draft: { title: 'Stale editor' } })).toMatchObject({ success: false, code: 'CONFLICT' });
  expect(await submitShowcaseForReviewAction({ itemId: item.id, expectedReviewVersion: item.reviewVersion })).toMatchObject({ success: false, code: 'CONFLICT' });
  expect(await prisma.showcaseItem.findUniqueOrThrow({ where: { id: item.id } })).toMatchObject({ title: 'First editor', reviewVersion: item.reviewVersion + 1 });
});
it('allows only one concurrent save for the same observed version', async () => {
  const item = await prisma.showcaseItem.create({ data: { title: 'Original', slug: 'concurrent-versioned', summary: '', creatorId: session.id } });
  const results = await Promise.all(['A', 'B'].map(title => saveShowcaseDraftAction({ itemId: item.id, expectedReviewVersion: item.reviewVersion, draft: { title } })));
  expect(results.filter(result => result.success)).toHaveLength(1);
  expect(results.find(result => !result.success)).toMatchObject({ code: 'CONFLICT' });
});

it('creates once and replays acknowledged saves without a second version increment', async () => {
  const { createShowcaseDraftAction } = await import('@/features/submissions/server/actions');
  const mutationId = crypto.randomUUID();
  const first = await createShowcaseDraftAction({ mutationId });
  expect(first.success).toBe(true);
  expect(await createShowcaseDraftAction({ mutationId })).toEqual(first);
  if (!first.success) throw Error('Creation failed');
  const input = { itemId: first.data.id, expectedReviewVersion: 0, mutationId: crypto.randomUUID(), draft: { title: '', summary: '  unfinished  ', resources: [{ kind: 'LINK', label: '', url: 'https://', linkType: 'GITHUB' }] } };
  const saved = await saveShowcaseDraftAction(input);
  expect(saved).toMatchObject({ success: true, data: { reviewVersion: 1 } });
  expect(await saveShowcaseDraftAction(input)).toEqual(saved);
  expect(await saveShowcaseDraftAction({ ...input, draft: { title: 'Different payload' } })).toMatchObject({ success: false, code: 'CONFLICT' });
  const row = await prisma.showcaseItem.findUniqueOrThrow({ where: { id: first.data.id } });
  expect(row.authorDraft).toMatchObject(input.draft);
  expect(row.reviewVersion).toBe(1);
  expect(await submitShowcaseForReviewAction({ itemId: row.id, expectedReviewVersion: 1 })).toMatchObject({ success: false, code: 'VALIDATION' });
});

it('serializes duplicate creation requests and isolates receipts by actor', async () => {
 const {createShowcaseDraftAction}=await import('@/features/submissions/server/actions');
 const mutationId=crypto.randomUUID();
 const [first,second]=await Promise.all([createShowcaseDraftAction({mutationId}),createShowcaseDraftAction({mutationId})]);
 expect(first).toEqual(second); if(!first.success) throw Error('Creation failed');
 const originalActor=session.id;
 const other=await prisma.user.create({data:{email:'other-versioned@nexus.test',fullName:'Other',role:'CORE_MEMBER',status:'ACTIVE'}});
 try {
  session.id=other.id;
  const own=await createShowcaseDraftAction({mutationId});
  expect(own.success).toBe(true); if(!own.success) throw Error(own.error);
  expect(own.data.id).not.toBe(first.data.id);
  expect(await saveShowcaseDraftAction({itemId:first.data.id,expectedReviewVersion:0,mutationId:crypto.randomUUID(),draft:{title:'Forged'}})).toMatchObject({success:false,code:'FORBIDDEN'});
 } finally {session.id=originalActor;}
 const item=await prisma.showcaseItem.findUniqueOrThrow({where:{id:first.data.id}});
 expect(item.authorDraft).toMatchObject({title:'',citationEnabled:false,contributors:[{userId:originalActor,role:'CONTRIBUTOR',displayOrder:0}]});
});

it('submits a legacy draft with no author snapshot using its existing fields and relations', async () => {
 const category=await prisma.category.create({data:{slug:'robotics-iot',name:'Project'}});
 const item=await prisma.showcaseItem.create({data:{creatorId:session.id,slug:'legacy-versioned',title:'Legacy',summary:'Legacy summary',categoryId:category.id,contributors:{create:{userId:session.id,role:'CONTRIBUTOR'}}}});
 expect(await submitShowcaseForReviewAction({itemId:item.id,expectedReviewVersion:0})).toMatchObject({success:true});
 expect((await prisma.submissionRevision.findFirstOrThrow({where:{itemId:item.id}})).snapshot).toMatchObject({title:'Legacy',summary:'Legacy summary'});
});
