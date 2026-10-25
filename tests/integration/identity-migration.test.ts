import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import { prisma } from '../fixtures/database';
import { verifyTestDatabase } from '../setup/database-guard';

it.each([['Mixed@Test.Invalid', 'mixed@test.invalid'], ['legacy-alias', 'legacy-alias@robotics.hcmus.edu.vn']])('refuses identifier collision groups without rewriting identities or printing their values', async (first, second) => {
  const schema = `identity_collision_${randomUUID().replaceAll('-', '')}`;
  if (!/^identity_collision_[a-f0-9]{32}$/.test(schema)) throw new Error('Invalid owned schema');
  const url = new URL(process.env.TEST_DATABASE_URL!); url.searchParams.set('schema', schema);
  await prisma.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
  const db = new PrismaClient({ datasources: { db: { url: url.toString() } }, log: [] });
  try {
    await verifyTestDatabase(db, url.toString());
    await db.$executeRawUnsafe('CREATE TABLE users (email TEXT NOT NULL)');
    await db.$executeRaw`INSERT INTO users(email) VALUES (${first}), (${second})`;
    const migration = await readFile('prisma/migrations/20261025_identity_hardening/migration.sql', 'utf8');
    const guard = migration.match(/DO \$\$[\s\S]*?\$\$;/)?.[0];
    if (!guard) throw new Error('Missing collision guard');
    const error = await db.$executeRawUnsafe(guard).catch(value => value as Error);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('collision');
    expect((error as Error).message).not.toContain(first);
    expect((error as Error).message).not.toContain(second);
    expect(await db.$queryRaw<Array<{ email: string }>>`SELECT email FROM users ORDER BY email`).toHaveLength(2);
  } finally {
    await db.$disconnect();
    await prisma.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
  }
});
