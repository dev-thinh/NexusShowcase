import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { readBootstrapAdmin } from './seed-policy';

/** Creates only; duplicate identifiers never reset or promote existing users. */
export async function createAdditionalAdmin(prisma: PrismaClient, input: { identifier: string; password: string; hidden?: boolean }) {
  const { email, password } = readBootstrapAdmin({ BOOTSTRAP_ADMIN_EMAIL: input.identifier, BOOTSTRAP_ADMIN_PASSWORD: input.password });
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.create({ data: {
    email, fullName: email, passwordHash, role: 'ADMIN', status: 'ACTIVE',
    mustChangePassword: true, hiddenFromDirectory: input.hidden ?? false,
  } });
}
