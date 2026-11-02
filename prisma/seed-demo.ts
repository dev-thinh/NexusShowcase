import { loadEnvConfig } from '@next/env';
import { PrismaClient, type Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { seedMockPosts } from './seed-mock-posts';
import { assertDemoSeedAllowed } from './seed-policy';

async function main() {
  // Run the guard before constructing the client or performing any database work.
  assertDemoSeedAllowed(process.env);
  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash('123456', 10);
    const accounts: { email: string; fullName: string; role: Role }[] = [
      { email: 'admin@gmail.com', fullName: 'Admin', role: 'ADMIN' },
      { email: 'core@gmail.com', fullName: 'Core Member', role: 'CORE_MEMBER' },
      ...[1, 2, 3].map(index => ({ email: `member${index}@gmail.com`, fullName: `Member ${index}`, role: 'MEMBER' as const })),
    ];
    const users = await prisma.$transaction(accounts.map(account => prisma.user.upsert({
      where: { email: account.email },
      create: { ...account, passwordHash, status: 'ACTIVE', mustChangePassword: false },
      update: {},
    })));
    await seedMockPosts(prisma, users.filter(user => user.status === 'ACTIVE' && !user.deletedAt).map(user => user.id));
    console.log('Demo accounts created if absent; existing credentials preserved. Demo content seeded.');
  } finally { await prisma.$disconnect(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  loadEnvConfig(process.cwd());
  main().catch(() => {
    console.error('Demo seed failed. Requires explicit ALLOW_DEMO_SEED=true, nonproduction NODE_ENV, and a database name containing a demo segment.');
    process.exitCode = 1;
  });
}
