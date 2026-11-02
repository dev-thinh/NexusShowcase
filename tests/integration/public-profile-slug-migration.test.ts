import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import { prisma } from '../fixtures/database';
import { verifyTestDatabase } from '../setup/database-guard';

it('backfills only public slugs while preserving all existing identity and credential data', async () => {
  const schema = `profile_migration_${randomUUID().replaceAll('-', '')}`;
  if (!/^profile_migration_[a-f0-9]{32}$/.test(schema)) throw new Error('Invalid owned schema');
  const url = new URL(process.env.TEST_DATABASE_URL!); url.searchParams.set('schema', schema);
  await prisma.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
  const db = new PrismaClient({ datasources: { db: { url: url.toString() } }, log: [] });
  try {
    await verifyTestDatabase(db, url.toString());
    await db.$executeRawUnsafe('CREATE TABLE users (id TEXT PRIMARY KEY, "fullName" TEXT NOT NULL, email TEXT NOT NULL, "passwordHash" TEXT, "updatedAt" TIMESTAMP NOT NULL)');
    await db.$executeRawUnsafe(`INSERT INTO users VALUES ('internal-1', 'Nguyễn An', 'first@test.invalid', 'preserved-hash', '2020-01-01'), ('internal-2', 'Nguyễn An', 'second@test.invalid', NULL, '2021-01-01')`);
    const before = await db.$queryRaw`SELECT * FROM users ORDER BY id`;
    const migration = await readFile('prisma/migrations/20261027_public_profile_slugs/migration.sql', 'utf8');
    const statements = migration.replace(/--[^\n]*/g, '').match(/CREATE FUNCTION[\s\S]*?\$\$;|(?:ALTER TABLE|CREATE UNIQUE INDEX|CREATE TRIGGER|UPDATE)[^;]+;/g);
    if (!statements) throw new Error('Missing slug migration statements');
    for (const statement of statements) await db.$executeRawUnsafe(statement);
    const after = await db.$queryRaw<Array<Record<string, unknown> & { publicSlug: string }>>`SELECT id, "fullName", email, "passwordHash", "updatedAt", "publicSlug" FROM users ORDER BY id`;
    expect(after.map(({ publicSlug: _slug, ...identity }) => identity)).toEqual(before);
    expect(after.map(user => user.publicSlug)).toEqual(expect.arrayContaining(['nguyen-an']));
    expect(new Set(after.map(user => user.publicSlug)).size).toBe(2);
  } finally {
    await db.$disconnect();
    await prisma.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
  }
});
