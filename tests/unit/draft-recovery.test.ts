import { expect, it } from 'vitest';
import { listRecoveries, writeRecovery, removeRecovery, type DraftRecovery } from '@/features/submissions/components/draft-recovery';
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
