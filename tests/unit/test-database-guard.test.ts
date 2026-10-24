import type { PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { assertTestDatabaseUrl, verifyTestDatabase } from '../setup/database-guard';

describe('Test Database Guard', () => {
  const devUrl = 'postgresql://nexus:secret@localhost:5434/nexus_showcase?schema=public';

  it('rejects absent TEST_DATABASE_URL', () => {
    expect(() => assertTestDatabaseUrl(devUrl, undefined)).toThrow(/TEST_DATABASE_URL is required/i);
    expect(() => assertTestDatabaseUrl(devUrl, '')).toThrow(/TEST_DATABASE_URL is required/i);
  });

  it('rejects TEST_DATABASE_URL when equal to normal DATABASE_URL', () => {
    expect(() => assertTestDatabaseUrl(devUrl, devUrl)).toThrow(/must not match DATABASE_URL/i);
  });

  it('rejects TEST_DATABASE_URL that does not identify a test database', () => {
    const productionUrl = 'postgresql://nexus:secret@localhost:5434/nexus_production?schema=public';
    expect(() => assertTestDatabaseUrl(devUrl, productionUrl)).toThrow(/must identify a dedicated test database/i);
  });

  it('accepts valid dedicated test database URL and sets DATABASE_URL', () => {
    const testUrl = 'postgresql://nexus:secret@localhost:5434/nexus_test?schema=public';
    const env: Record<string, string | undefined> = { DATABASE_URL: devUrl };
    assertTestDatabaseUrl(devUrl, testUrl, env);
    expect(env.DATABASE_URL).toBe(testUrl);
  });

  it.each([
    devUrl + '&test=true',
    'postgresql://other:password@localhost:5434/nexus_showcase?schema=test',
    'postgresql://nexus:secret@127.0.0.1:5434/nexus_showcase?test=true&schema=public',
    'postgresql://nexus:secret@LOCALHOST:5434/nexus_%73howcase?schema=test',
  ])('rejects resource aliases regardless of credentials/schema/query: %s', candidate => {
    expect(() => assertTestDatabaseUrl(devUrl, candidate, {})).toThrow();
  });

  it.each(['this-is-a-test', 'https://localhost/nexus_test', 'postgresql://localhost/', 'postgresql://localhost/nexus_test/extra', 'postgresql://localhost/nexus_%ZZtest'])('rejects malformed/non-Postgres URLs: %s', candidate => {
    expect(() => assertTestDatabaseUrl(devUrl, candidate, {})).toThrow();
  });

  it('rejects the same decoded test database with reordered query and default port aliases', () => {
    expect(() => assertTestDatabaseUrl('postgresql://u:p@localhost/nexus_test?schema=public&sslmode=require', 'postgres://other:pw@127.0.0.1:5432/nexus_%74est?sslmode=require&schema=other', {})).toThrow();
  });

  it('accepts a separate nexus_showcase_test database', () => {
    const url = 'postgresql://nexus:secret@localhost:5434/nexus_showcase_test?schema=public';
    expect(assertTestDatabaseUrl(devUrl, url, {})).toBe(url);
  });
});

describe('dedicated database catalog verification', () => {
  const url = 'postgresql://user:secret@localhost/nexus_showcase_test?schema=public';
  it.each([
    { rows: [{ database: 'nexus_showcase', schema: 'public' }] },
    { rows: [{ database: 'nexus_showcase_test', schema: 'other' }] },
    { rows: [] },
  ])('rejects an unexpected catalog before any mutation', async ({ rows }) => {
    const client = {
      $queryRaw: vi.fn().mockResolvedValue(rows),
      $executeRawUnsafe: vi.fn(),
      user: { deleteMany: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
    };
    await expect(verifyTestDatabase(client as unknown as PrismaClient, url)).rejects.toThrow(/catalog/);
    expect(client.$executeRawUnsafe).not.toHaveBeenCalled();
    for (const mutation of Object.values(client.user)) expect(mutation).not.toHaveBeenCalled();
  });
  it('accepts the expected connected database and effective schema', async () => {
    const client = { $queryRaw: vi.fn().mockResolvedValue([{ database: 'nexus_showcase_test', schema: 'public' }]) };
    await expect(verifyTestDatabase(client as unknown as PrismaClient, url)).resolves.toBeUndefined();
    expect(client.$queryRaw.mock.calls[0][0].join('')).toMatch(/^SELECT /);
  });
  it('redacts connection errors', async () => {
    const client = { $queryRaw: vi.fn().mockRejectedValue(new Error(url)) };
    await expect(verifyTestDatabase(client as unknown as PrismaClient, url)).rejects.toThrow('Cannot verify dedicated test database catalog');
    await expect(verifyTestDatabase(client as unknown as PrismaClient, url)).rejects.not.toThrow('secret');
  });
});
