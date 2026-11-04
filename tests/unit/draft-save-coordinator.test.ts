import { afterEach, expect, it, vi } from 'vitest';
import { DraftSaveCoordinator } from '@/features/submissions/components/draft-save-coordinator';
import type { SaveDraftInput } from '@/features/submissions/model/versioned-input';
const receipt = (version: number) => ({ success: true as const, data: { id: 'item', slug: 'item', status: 'DRAFT', reviewVersion: version } });
afterEach(() => vi.useRealTimers());
function setup(save = vi.fn(async (_input: SaveDraftInput) => receipt(1))) {
  const changes: unknown[] = [];
  const coordinator = new DraftSaveCoordinator({ itemId: 'item', reviewVersion: 0, data: { title: '' }, save, persist: () => true, onChange: snapshot => changes.push(snapshot) });
  return { coordinator, save, changes };
}
it('debounces idle edits and caps continuous typing at ten seconds', async () => {
  vi.useFakeTimers();
  const { coordinator, save } = setup();
  coordinator.update({ title: 'a' });
  await vi.advanceTimersByTimeAsync(1499); expect(save).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1); expect(save).toHaveBeenCalledTimes(1);
  for (let n=0;n<10;n++) { coordinator.update({ title: String(n) }); await vi.advanceTimersByTimeAsync(1000); }
  expect(save).toHaveBeenCalledTimes(2);
  coordinator.dispose();
});
it('serializes pending saves and flush waits for the latest edit with the acknowledged version', async () => {
  let resolve!: (value: ReturnType<typeof receipt>) => void;
  const save = vi.fn((_input: SaveDraftInput) => new Promise<ReturnType<typeof receipt>>(r => { resolve = r; }));
  const { coordinator } = setup(save);
  coordinator.update({ title: 'first' });
  const flush = coordinator.flush();
  await Promise.resolve();
  coordinator.update({ title: 'second' });
  expect(save).toHaveBeenCalledTimes(1);
  resolve(receipt(1)); await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(2));
  expect(save.mock.calls[1][0]).toMatchObject({ expectedReviewVersion: 1, draft: { title: 'second' } });
  resolve(receipt(2)); expect(await flush).toMatchObject({ reviewVersion: 2, editSequence: 2 });
  expect(coordinator.snapshot.isDirty).toBe(false); coordinator.dispose();
});
it('retries the same immutable envelope after a lost response, then saves newer data', async () => {
  vi.useFakeTimers();
  const save = vi.fn(async (_input: SaveDraftInput) => receipt(1)).mockRejectedValueOnce(Error('lost response'));
  const { coordinator } = setup(save);
  coordinator.update({ title: 'first' }); expect(await coordinator.flush()).toBeNull();
  const first = structuredClone(save.mock.calls[0][0]);
  coordinator.update({ title: 'newer' });
  await coordinator.retry();
  expect(save.mock.calls[1][0]).toEqual(first);
  expect(save.mock.calls[2][0]).toMatchObject({ expectedReviewVersion: 1, draft: { title: 'newer' } });
  coordinator.dispose();
});
it('stops automatic writes on conflict and preserves dirty data', async () => {
  vi.useFakeTimers();
  const save = vi.fn(async () => ({ success: false as const, code: 'CONFLICT' as const, error: 'Changed elsewhere' }));
  const { coordinator } = setup(save as never);
  coordinator.update({ title: 'mine' }); expect(await coordinator.flush()).toBeNull();
  coordinator.update({ title: 'still mine' }); await vi.advanceTimersByTimeAsync(60_000);
  expect(save).toHaveBeenCalledTimes(1); expect(coordinator.snapshot).toMatchObject({ isDirty: true, status: 'conflict', data: { title: 'still mine' } });
  coordinator.dispose();
});
it('does not start another request when the connection drops during an in-flight save', async () => {
 let resolve!: (value: ReturnType<typeof receipt>) => void;
 const save = vi.fn((_input:SaveDraftInput)=>new Promise<ReturnType<typeof receipt>>(r=>{resolve=r;}));
 const {coordinator}=setup(save);
 coordinator.update({title:'first'}); const flush=coordinator.flush();
 coordinator.update({title:'offline edit'}); coordinator.setOnline(false);
 resolve(receipt(1)); await flush;
 expect(save).toHaveBeenCalledTimes(1);
 expect(coordinator.snapshot).toMatchObject({isDirty:true,status:'offline'}); coordinator.dispose();
});
it('allows a corrected draft to save after an explicit validation rejection', async () => {
 const save=vi.fn(async (_input:SaveDraftInput)=>receipt(1)).mockResolvedValueOnce({success:false,code:'VALIDATION',error:'Title too long'} as never);
 const {coordinator}=setup(save);
 coordinator.update({title:'x'.repeat(201)}); expect(await coordinator.flush()).toBeNull();
 const rejected=save.mock.calls[0][0];
 coordinator.update({title:'Corrected'});
 expect(await coordinator.flush()).toMatchObject({reviewVersion:1});
 expect(save.mock.calls[1][0]).toMatchObject({expectedReviewVersion:0,draft:{title:'Corrected'}});
 expect(save.mock.calls[1][0].mutationId).not.toBe(rejected.mutationId); coordinator.dispose();
});
it('starts a fresh maximum-save window after a slow in-flight request', async () => {
 vi.useFakeTimers(); let resolve!: (value:ReturnType<typeof receipt>)=>void;
 const save=vi.fn(async (_input:SaveDraftInput)=>receipt(2)).mockImplementationOnce(()=>new Promise(r=>{resolve=r;}));
 const {coordinator}=setup(save);
 coordinator.update({title:'first'}); const flush=coordinator.flush();
 for(let n=0;n<11;n++){coordinator.update({title:`during ${n}`});await vi.advanceTimersByTimeAsync(1000);}
 resolve(receipt(1)); await flush; expect(save).toHaveBeenCalledTimes(2);
 for(let n=0;n<10;n++){coordinator.update({title:`after ${n}`});await vi.advanceTimersByTimeAsync(1000);}
 expect(save).toHaveBeenCalledTimes(3); coordinator.dispose();
});
it('automatically saves a correction made before an invalid request returns', async () => {
 let resolve!: (value: {success:false;code:'VALIDATION';error:string})=>void;
 const save=vi.fn(async (_input:SaveDraftInput)=>receipt(1)).mockImplementationOnce(()=>new Promise(r=>{resolve=r as never;}));
 const {coordinator}=setup(save);
 coordinator.update({title:'x'.repeat(201)}); const flush=coordinator.flush();
 coordinator.update({title:'Corrected while pending'}); resolve({success:false,code:'VALIDATION',error:'Too long'});
 await flush;
 expect(save).toHaveBeenCalledTimes(2);
 expect(coordinator.snapshot).toMatchObject({status:'saved',isDirty:false,data:{title:'Corrected while pending'}});
 coordinator.dispose();
});
