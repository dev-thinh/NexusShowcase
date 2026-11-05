import { expect, it } from 'vitest';
import { chooseDraftRecovery, listRecoveries, writeRecovery, removeRecovery, type DraftRecovery } from '@/features/submissions/components/draft-recovery';
function memory() {
 const map = new Map<string,string>();
 return { get length() { return map.size; }, key: (n:number) => [...map.keys()][n] ?? null, getItem:(k:string)=>map.get(k) ?? null, setItem:(k:string,v:string)=> {map.set(k,v);}, removeItem:(k:string)=> {map.delete(k);} };
}
const record: DraftRecovery = { format: 1, accountId: 'account', itemId: 'item', sessionId: 'tab-a', expectedReviewVersion: 0, editSequence: 1, updatedAt: 1, data: { title: 'mine' } };
it('isolates accounts and tab sessions, and never removes a newer edit on an old ack', () => {
 const storage = memory();
 expect(writeRecovery(storage, record)).toBe(true);
 writeRecovery(storage, {...record,sessionId:'tab-b'});
 writeRecovery(storage, {...record,accountId:'other'});
 expect(listRecoveries(storage,'account','item').records).toHaveLength(2);
 writeRecovery(storage,{...record,editSequence:2});
 expect(removeRecovery(storage,record)).toBe(false);
 expect(listRecoveries(storage,'account','item').records.find(r=>r.sessionId==='tab-a')?.editSequence).toBe(2);
});
it('reports inaccessible storage rather than claiming local durability', () => {
 const storage = memory(); storage.setItem = () => { throw Error('quota'); };
 expect(writeRecovery(storage,record)).toBe(false);
 storage.key = () => { throw Error('blocked'); };
 storage.setItem = () => {}; Object.defineProperty(storage,'length',{ get() {throw Error('blocked');} });
 expect(listRecoveries(storage,'account','item').error).toBe(true);
});
it('retains edits that exceed server validation limits so they can still be copied after reload', () => {
 const storage=memory(); const oversized={...record,data:{title:'a'.repeat(201)}};
 expect(writeRecovery(storage,oversized)).toBe(true);
 expect(listRecoveries(storage,'account','item').records[0]?.data.title).toBe(oversized.data.title);
});
it('never promises durability for a record that cannot be read back', () => {
 const storage=memory(); const oversized={...record,data:{title:'a'.repeat(2_000_001)}};
 expect(writeRecovery(storage,oversized)).toBe(false);
 expect(storage.length).toBe(0);
});

it('automatically resumes the latest compatible draft and ignores already-saved copies', async () => {
 const { chooseDraftRecovery }=await import('@/features/submissions/components/draft-recovery');
 const saved={...record,sessionId:'saved',data:{title:'Server'}};
 const newer={...record,sessionId:'newer',updatedAt:3,data:{title:'Continue writing'}};
 const result=chooseDraftRecovery([record,saved,newer],{title:'Server'},0);
 expect(result.resume).toEqual(newer);
 expect(result.obsolete).toEqual([saved]);
 expect(result.conflicts).toEqual([]);
});
it('never automatically overwrites a newer server draft with a stale browser copy', async()=>{
 const { chooseDraftRecovery }=await import('@/features/submissions/components/draft-recovery');
 const result=chooseDraftRecovery([record],{title:'Changed elsewhere'},2);
 expect(result.resume).toBeUndefined(); expect(result.conflicts).toEqual([record]);
});
it('prefers a compatible local draft over a newer stale pending request',()=>{
 const compatible={...record,expectedReviewVersion:3,sessionId:'compatible',updatedAt:1};
 const stale={...record,updatedAt:2,pendingMutation:{input:{itemId:'item',expectedReviewVersion:0,mutationId:crypto.randomUUID(),draft:{title:'older'}},editSequence:1}};
 expect(chooseDraftRecovery([compatible,stale],{title:'Server'},3).resume).toEqual(compatible);
});
