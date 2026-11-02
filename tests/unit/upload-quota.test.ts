import {beforeEach, expect, it, vi} from 'vitest';
const mock = vi.hoisted(() => ({ query: vi.fn(), create: vi.fn(), release: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/server/db/prisma', () => ({prisma: {$transaction: (work: (tx: unknown) => unknown) => work({$queryRaw: mock.query, uploadReservation: {create: mock.create}}), uploadReservation: {deleteMany: mock.release}}}));
import {reserveUpload, releaseUpload} from '@/features/assets/server/upload-quota';
beforeEach(() => {vi.resetAllMocks(); mock.query.mockResolvedValue([{ownerBytes:0n,totalBytes:0n,ownerFiles:0n,totalFiles:0n,ownerPending:0n,totalPending:0n}]);mock.create.mockResolvedValue({id:'reservation'});});
it('reserves capacity before upload and returns a release handle', async () => {
 expect(await reserveUpload('owner',1024, '/uploads/resources/quota-reservation.bin')).toBe('reservation');
 expect(mock.create).toHaveBeenCalledWith({data:{id:'/uploads/resources/quota-reservation.bin',ownerId:'owner',byteSize:1024n},select:{id:true}});
 await releaseUpload('reservation');expect(mock.release).toHaveBeenCalledWith({where:{id:'reservation'}});
});
it.each([
 {ownerBytes:209715200n}, {totalBytes:2147483648n}, {ownerFiles:200n}, {totalFiles:2000n}, {ownerPending:2n}, {totalPending:8n},
])('rejects exhausted capacity before allocating', async exceeded => {
 mock.query.mockResolvedValue([{ownerBytes:0n,totalBytes:0n,ownerFiles:0n,totalFiles:0n,ownerPending:0n,totalPending:0n,...exceeded}]);
 await expect(reserveUpload('owner',1, '/uploads/resources/quota-reservation.bin')).rejects.toThrow('hạn mức');expect(mock.create).not.toHaveBeenCalled();
});
it('rejects ownerless or invalid byte counts without touching storage', async () => {
 for(const [owner,bytes] of [['',1],['owner',0],['owner',NaN],['owner',-1]] as const) await expect(reserveUpload(owner,bytes, '/uploads/resources/quota-reservation.bin')).rejects.toThrow();
 expect(mock.query).not.toHaveBeenCalled();
});
