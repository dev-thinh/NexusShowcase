import {afterEach, expect, it, vi} from 'vitest';
import {prisma} from '../fixtures/database';
import {reserveUpload, releaseUpload} from '@/features/assets/server/upload-quota';
afterEach(()=>vi.unstubAllEnvs());
it('serializes competing reservations so only the allowed byte capacity is admitted',async()=>{
 vi.stubEnv('UPLOAD_OWNER_MAX_BYTES','100');vi.stubEnv('UPLOAD_TOTAL_MAX_BYTES','1000');
 const results=await Promise.allSettled([reserveUpload('race-owner',60, '/uploads/resources/quota-reservation.bin'),reserveUpload('race-owner',60, '/uploads/resources/quota-reservation.bin')]);
 expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
 expect(await prisma.uploadReservation.count({where:{ownerId:'race-owner'}})).toBe(1);
 const accepted=results.find(r=>r.status==='fulfilled') as PromiseFulfilledResult<string>;
 await releaseUpload(accepted.value);
 const next=await reserveUpload('race-owner',60, '/uploads/resources/quota-reservation.bin');await releaseUpload(next);
});
it('counts registered bytes and unknown historical sizes, including ownerless assets globally',async()=>{
 vi.stubEnv('UPLOAD_OWNER_MAX_BYTES','100');vi.stubEnv('UPLOAD_TOTAL_MAX_BYTES','30000000');
 await prisma.asset.create({data:{url:'/uploads/resources/quota.bin',provider:'local',ownerId:'legacy-owner'}});
 await expect(reserveUpload('legacy-owner',1, '/uploads/resources/quota-reservation.bin')).rejects.toThrow('hạn mức');
 await prisma.asset.create({data:{url:'/uploads/resources/ownerless.bin',provider:'local'}});
 await expect(reserveUpload('another',1, '/uploads/resources/quota-reservation.bin')).rejects.toThrow('hạn mức');
});
it('enforces shared global concurrent upload capacity across different owners',async()=>{
 vi.stubEnv('UPLOAD_TOTAL_CONCURRENCY','1');
 const first=await reserveUpload('global-one',1, '/uploads/resources/quota-reservation.bin');
 await expect(reserveUpload('global-two',1, '/uploads/resources/quota-reservation.bin')).rejects.toThrow('hạn mức');
 await releaseUpload(first);
});
