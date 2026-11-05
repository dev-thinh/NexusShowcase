import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db/prisma';
import type { ActionResult } from '@/shared/lib/action-result';

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonical(entry)]));
  return value;
}

/** Receipt and state change commit together; a lost response can be retried verbatim. */
export async function withDraftMutation<T extends object>(
  actorId: string, mutationId: string | undefined, operation: string, payload: unknown,
  run: (tx: Prisma.TransactionClient) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  const payloadHash = createHash('sha256').update(JSON.stringify(canonical(payload))).digest('hex');
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(async tx => {
        if (mutationId) {
          // Serialize duplicate attempts before reading the receipt. Serialization
          // failures below restart the transaction with a fresh database snapshot.
          await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${actorId}:${mutationId}`}, 0))::text`;
          const receipt = await tx.draftMutation.findUnique({ where: { actorId_mutationId: { actorId, mutationId } } });
          if (receipt) {
            if (receipt.operation !== operation || receipt.payloadHash !== payloadHash) return { success: false, code: 'CONFLICT', error: 'Mã lần lưu đã được dùng cho nội dung khác.' };
            return { success: true, data: receipt.response as unknown as T };
          }
        }
        const result = await run(tx);
        if (result.success && mutationId) await tx.draftMutation.create({ data: { actorId, mutationId, operation, payloadHash, response: JSON.parse(JSON.stringify(result.data)) } });
        return result;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2034', 'P2002'].includes(error.code) && attempt < 3) continue;
      throw error;
    }
  }
}
