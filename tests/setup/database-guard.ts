export function assertTestDatabaseUrl(
  devUrl: string | undefined = process.env.DATABASE_URL,
  testUrl: string | undefined = process.env.TEST_DATABASE_URL,
  env: Record<string, string | undefined> = process.env
): string {
  if (!testUrl || !testUrl.trim()) {
    throw new Error('TEST_DATABASE_URL is required to run database integration tests.');
  }

  const normalizedTest = testUrl.trim();
  const normalizedDev = devUrl?.trim();

  if (normalizedDev && normalizedTest === normalizedDev) {
    throw new Error('TEST_DATABASE_URL must not match DATABASE_URL.');
  }

  try {
    const parsed = new URL(normalizedTest);
    const hasTestInPath = parsed.pathname.toLowerCase().includes('test');
    const hasTestInQuery = parsed.search.toLowerCase().includes('test');
    if (!hasTestInPath && !hasTestInQuery) {
      throw new Error('TEST_DATABASE_URL must identify a dedicated test database (must include "test" in path or schema).');
    }
  } catch (err: any) {
    if (err.message.includes('must identify a dedicated test database')) {
      throw err;
    }
    if (!normalizedTest.toLowerCase().includes('test')) {
      throw new Error('TEST_DATABASE_URL must identify a dedicated test database (must include "test" in path or schema).');
    }
  }

  env.DATABASE_URL = normalizedTest;
  return normalizedTest;
}
