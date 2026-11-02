import 'server-only';
import {assertAssetPath} from './asset-path';
import {prisma} from '@/server/db/prisma';

export class UploadQuotaError extends Error {
  constructor() {super('Đã đạt hạn mức lưu trữ hoặc số lượt tải đồng thời. Vui lòng liên hệ quản trị viên.');}
}
function limit(name: string, fallback: number): bigint {
  const value = process.env[name] === undefined ? fallback : Number(process.env[name]);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error('Invalid upload quota configuration');
  return BigInt(value);
}
type Occupancy = {ownerBytes: bigint; totalBytes: bigint; ownerFiles: bigint; totalFiles: bigint; ownerPending: bigint; totalPending: bigint};

/** Reserve before provider I/O. Unknown historical sizes count conservatively as 25 MiB.
 * Reservations intentionally never expire automatically: a crashed provider write
 * must be reconciled before its capacity can be reused.
 */
export async function reserveUpload(ownerId: string, byteSize: number, assetUrl: string): Promise<string> {
  if (!ownerId || !Number.isSafeInteger(byteSize) || byteSize < 1) throw new Error('Invalid upload reservation');
  assertAssetPath(assetUrl);
  const bytes = BigInt(byteSize);
  const limits = {
    ownerBytes:limit('UPLOAD_OWNER_MAX_BYTES',200 * 1024 * 1024),totalBytes:limit('UPLOAD_TOTAL_MAX_BYTES',2 * 1024 * 1024 * 1024),
    ownerFiles:limit('UPLOAD_OWNER_MAX_FILES',200),totalFiles:limit('UPLOAD_TOTAL_MAX_FILES',2000),
    ownerPending:limit('UPLOAD_OWNER_CONCURRENCY',2),totalPending:limit('UPLOAD_TOTAL_CONCURRENCY',8),
  };
  return prisma.$transaction(async tx => {
    // One short global lock serializes reservations across every app process.
    await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(735291, 1)`;
    const [usage] = await tx.$queryRaw<Occupancy[]>`
      WITH occupied AS (
        SELECT "ownerId", coalesce("byteSize", 26214400::bigint) AS bytes, false AS pending FROM assets WHERE "deletedAt" IS NULL
        UNION ALL SELECT "ownerId", "byteSize" AS bytes, true AS pending FROM upload_reservations
      ) SELECT coalesce(sum(bytes) FILTER (WHERE "ownerId" = ${ownerId}),0)::bigint AS "ownerBytes",
        coalesce(sum(bytes),0)::bigint AS "totalBytes",
        count(*) FILTER (WHERE "ownerId" = ${ownerId}) AS "ownerFiles", count(*) AS "totalFiles",
        count(*) FILTER (WHERE pending AND "ownerId" = ${ownerId}) AS "ownerPending", count(*) FILTER (WHERE pending) AS "totalPending"
      FROM occupied`;
    if (!usage || usage.ownerBytes + bytes > limits.ownerBytes || usage.totalBytes + bytes > limits.totalBytes ||
      usage.ownerFiles >= limits.ownerFiles || usage.totalFiles >= limits.totalFiles ||
      usage.ownerPending >= limits.ownerPending || usage.totalPending >= limits.totalPending) throw new UploadQuotaError();
    return (await tx.uploadReservation.create({data:{id:assetUrl,ownerId,byteSize:bytes},select:{id:true}})).id;
  });
}
export async function releaseUpload(id: string): Promise<void> {
  await prisma.uploadReservation.deleteMany({where:{id}});
}
