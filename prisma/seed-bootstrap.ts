import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { readBootstrapAdmin } from './seed-policy';

export async function bootstrapAdmin(prisma: PrismaClient, env: Parameters<typeof readBootstrapAdmin>[0]) {
  return prisma.$transaction(async tx => {
    // Serialize competing bootstrap commands without changing existing accounts.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(192837465)::text`;
    if (await tx.user.count({ where: { role: 'ADMIN' } })) return 'existing' as const;
    const { email, password } = readBootstrapAdmin(env);
    if (await tx.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } })) {
      throw new Error('Bootstrap identifier already belongs to an account.');
    }
    await tx.user.create({ data: { email, fullName: 'Administrator', role: 'ADMIN', status: 'ACTIVE', passwordHash: await bcrypt.hash(password, 12), mustChangePassword: true } });
    return 'created' as const;
  }, { timeout: 30_000 });
}
