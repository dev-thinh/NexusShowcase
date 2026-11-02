import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('@/server/db/prisma', () => ({ prisma: { $queryRaw: database.query } }));

describe('GET /api/health', () => {
  beforeEach(() => {
    database.query.mockReset();
    database.query.mockResolvedValue([{ '?column?': 1 }]);
  });

  afterEach(() => vi.unstubAllEnvs());

  it('checks database connectivity and returns the running release without caching', async () => {
    vi.stubEnv('NEXUS_RELEASE_SHA', 'a'.repeat(40));
    const { GET } = await import('@/app/api/health/route');

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ status: 'ok', release: 'a'.repeat(40) });
    expect(database.query).toHaveBeenCalledOnce();
    expect(database.query.mock.calls[0][0]).toEqual(['SELECT 1']);
  });

  it('reports a null release when release metadata is absent', async () => {
    vi.stubEnv('NEXUS_RELEASE_SHA', undefined);
    const { GET } = await import('@/app/api/health/route');

    expect(await (await GET()).json()).toEqual({ status: 'ok', release: null });
  });

  it('rechecks the database on each request and sanitizes database failures', async () => {
    vi.stubEnv('NEXUS_RELEASE_SHA', 'a'.repeat(40));
    database.query.mockResolvedValueOnce([{ '?column?': 1 }]).mockRejectedValueOnce(
      new Error('postgresql://admin:secret@private-host/production connection refused'),
    );
    const { GET } = await import('@/app/api/health/route');

    expect((await GET()).status).toBe(200);
    const response = await GET();

    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ status: 'unavailable' });
  });
});
