import { describe, expect, it } from 'vitest';
import { assertTestDatabaseUrl } from '../setup/database-guard';

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
});
