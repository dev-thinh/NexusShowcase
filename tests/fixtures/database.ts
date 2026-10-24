import { Prisma, PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { assertTestDatabaseUrl, verifyTestDatabase } from '../setup/database-guard';

export type DatabaseFixture = { prisma: PrismaClient; prefix: string };
const quote = (identifier: string) => `"${identifier.replace(/"/g, '""')}"`;
const literal = (value: string) => `'${value.replace(/'/g, "''")}'`;
const ownedSchema = /^nexus_test_[a-f0-9]{32}$/;
const tables = Prisma.dmmf.datamodel.models.map(model => model.dbName ?? model.name);

/** Each suite owns an empty schema, including its global pin capacity. */
export async function createTestFixtures(): Promise<DatabaseFixture & { cleanup(): Promise<void> }> {
  const url = assertTestDatabaseUrl(process.env.DATABASE_URL, process.env.TEST_DATABASE_URL, {});
  const sourceSchema = new URL(url).searchParams.get('schema') ?? 'public';
  const prefix = `nexus_test_${randomUUID().replace(/-/g, '')}`;
  const catalog = new PrismaClient({ datasources: { db: { url } }, log: [] });
  let scoped: PrismaClient | undefined;
  let created = false;
  async function cleanup() {
    try {
      await scoped?.$disconnect();
      if (created) {
        await verifyTestDatabase(catalog, url);
        if (!ownedSchema.test(prefix)) throw new Error('Refusing cleanup outside the generated fixture schema.');
        await catalog.$executeRawUnsafe(`DROP SCHEMA ${quote(prefix)} CASCADE`);
        created = false;
      }
    } finally { await catalog.$disconnect(); }
  }
  try {
    await verifyTestDatabase(catalog, url);
    const available = await catalog.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = ${sourceSchema}`;
    if (!tables.every(table => available.some(row => row.tablename === table))) {
      throw new Error('Dedicated test database template is missing application tables; initialize it separately.');
    }
    const foreignKeys = await catalog.$queryRaw<Array<{ table: string; name: string; target: string; targetSchema: string; definition: string }>>`
      SELECT c.relname AS "table", con.conname AS name, target.relname AS target,
        target_ns.nspname AS "targetSchema", pg_get_constraintdef(con.oid) AS definition
      FROM pg_catalog.pg_constraint con
      JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
      JOIN pg_catalog.pg_namespace ns ON ns.oid = c.relnamespace
      JOIN pg_catalog.pg_class target ON target.oid = con.confrelid
      JOIN pg_catalog.pg_namespace target_ns ON target_ns.oid = target.relnamespace
      WHERE con.contype = 'f' AND ns.nspname = ${sourceSchema}`;
    const relevantKeys = foreignKeys.filter(key => tables.includes(key.table));
    if (relevantKeys.some(key => key.targetSchema !== sourceSchema || !tables.includes(key.target))) {
      throw new Error('Refusing a fixture template with foreign keys outside application tables.');
    }
    await catalog.$executeRawUnsafe(`CREATE SCHEMA ${quote(prefix)}`);
    created = true;
    for (const enumeration of Prisma.dmmf.datamodel.enums) {
      await catalog.$executeRawUnsafe(`CREATE TYPE ${quote(prefix)}.${quote(enumeration.dbName ?? enumeration.name)} AS ENUM (${enumeration.values.map(value => literal(value.dbName ?? value.name)).join(', ')})`);
    }
    for (const table of tables) {
      await catalog.$executeRawUnsafe(`CREATE TABLE ${quote(prefix)}.${quote(table)} (LIKE ${quote(sourceSchema)}.${quote(table)} INCLUDING ALL)`);
    }
    // Prisma qualifies enum casts with its configured schema. LIKE retains source
    // enum OIDs, so rebind empty columns/defaults to the fixture's own enum types.
    for (const model of Prisma.dmmf.datamodel.models) {
      for (const field of model.fields.filter(field => field.kind === 'enum')) {
        const table = `${quote(prefix)}.${quote(model.dbName ?? model.name)}`;
        const column = quote(field.dbName ?? field.name);
        const enumeration = Prisma.dmmf.datamodel.enums.find(value => value.name === field.type)!;
        const type = `${quote(prefix)}.${quote(enumeration.dbName ?? enumeration.name)}`;
        await catalog.$executeRawUnsafe(`ALTER TABLE ${table} ALTER COLUMN ${column} DROP DEFAULT`);
        await catalog.$executeRawUnsafe(`ALTER TABLE ${table} ALTER COLUMN ${column} TYPE ${type} USING ${column}::text::${type}`);
        if (typeof field.default === 'string') {
          const value = enumeration.values.find(value => value.name === field.default)!;
          await catalog.$executeRawUnsafe(`ALTER TABLE ${table} ALTER COLUMN ${column} SET DEFAULT ${literal(value.dbName ?? value.name)}::${type}`);
        }
      }
    }
    for (const key of relevantKeys) {
      // LIKE does not copy foreign keys. Always point reconstructed keys into this fixture.
      const definition = key.definition.replace(/REFERENCES\s+(?:"(?:[^"]|"")*"|[^\s(]+)(?:\s*\.\s*(?:"(?:[^"]|"")*"|[^\s(]+))?/, `REFERENCES ${quote(prefix)}.${quote(key.target)}`);
      await catalog.$executeRawUnsafe(`ALTER TABLE ${quote(prefix)}.${quote(key.table)} ADD CONSTRAINT ${quote(key.name)} ${definition}`);
    }
    const scopedUrl = new URL(url);
    scopedUrl.searchParams.set('schema', prefix);
    scoped = new PrismaClient({ datasources: { db: { url: scopedUrl.toString() } }, log: [] });
    await verifyTestDatabase(scoped, scopedUrl.toString());
    return { prisma: scoped, prefix, cleanup };
  } catch (error) {
    await cleanup();
    if (error instanceof Error && /^(Dedicated|Refusing|Cannot verify)/.test(error.message)) throw error;
    throw new Error('Could not initialize the isolated test fixture schema.');
  }
}

export async function withTestFixtures<T>(run: (fixture: DatabaseFixture) => Promise<T>): Promise<T> {
  const fixture = await createTestFixtures();
  try { return await run(fixture); } finally { await fixture.cleanup(); }
}

// Assigned by the integration-only setup before test modules or application imports run.
export let prisma: PrismaClient;
export async function initializeSuiteFixtures() {
  const fixture = await createTestFixtures();
  prisma = fixture.prisma;
  return fixture.cleanup;
}
