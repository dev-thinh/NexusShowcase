import type { PrismaClient } from '@prisma/client';

function databaseIdentity(value: string) {
  try {
    const url = new URL(value);
    const database = decodeURIComponent(url.pathname.slice(1));
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || !database || /[/\\\0]/.test(database) || url.hash || url.searchParams.getAll('schema').length > 1) throw Error();
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    const host = ['localhost', '127.0.0.1', '[::1]'].includes(hostname) ? 'loopback' : hostname;
    const schema = url.searchParams.get('schema') ?? 'public';
    if (!schema || schema.includes('\0') || url.searchParams.has('host')) throw Error();
    return { host, port: url.port || '5432', database, schema };
  } catch {
    throw new Error('Database test configuration must use valid PostgreSQL URLs.');
  }
}

export function assertTestDatabaseUrl(
  devUrl?: string,
  testUrl?: string,
  env: Record<string, string | undefined> = process.env,
): string {
  if (arguments.length === 0) {
    devUrl = process.env.DATABASE_URL;
    testUrl = process.env.TEST_DATABASE_URL;
  }
  if (!testUrl?.trim()) throw new Error('TEST_DATABASE_URL is required to run database integration tests.');
  const candidate = testUrl.trim();
  const test = databaseIdentity(candidate);
  if (devUrl?.trim()) {
    const dev = databaseIdentity(devUrl.trim());
    // Credentials, schema and query options never establish a separate database.
    if (dev.host === test.host && dev.port === test.port && dev.database === test.database) {
      throw new Error('TEST_DATABASE_URL must not match DATABASE_URL database identity.');
    }
  }
  if (!/(^|[_-])test([_-]|$)/i.test(test.database)) {
    throw new Error('TEST_DATABASE_URL must identify a dedicated test database by database name.');
  }
  env.DATABASE_URL = candidate;
  return candidate;
}

/** Catalog reads only: call before creating schemas, fixtures or running mutations. */
export async function verifyTestDatabase(client: PrismaClient, expectedUrl: string): Promise<void> {
  const expected = databaseIdentity(assertTestDatabaseUrl(undefined, expectedUrl, {}));
  let rows: Array<{ database: string; schema: string | null }>;
  try {
    rows = await client.$queryRaw`SELECT current_database() AS database, current_schema() AS schema`;
  } catch {
    // Prisma connection errors may contain credentials; never propagate them.
    throw new Error('Cannot verify dedicated test database catalog; no fixture writes were authorized.');
  }
  if (rows.length !== 1 || rows[0].database !== expected.database || rows[0].schema !== expected.schema) {
    throw new Error('Dedicated test database catalog does not match expected database/schema; no fixture writes were authorized.');
  }
}
