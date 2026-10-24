import { afterEach, describe, expect, it, vi } from 'vitest';
import { withTestFixtures } from '../fixtures/database';
const mocks = vi.hoisted(() => ({
  catalog: {
    $queryRaw: vi.fn(), $executeRawUnsafe: vi.fn(), $disconnect: vi.fn(),
    user: { deleteMany: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
  },
}));
vi.mock('@prisma/client', async importOriginal => ({
  ...await importOriginal<typeof import('@prisma/client')>(),
  PrismaClient: vi.fn(function () { return mocks.catalog; }),
}));

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
describe('fixture write authorization', () => {
  it('never creates a schema or fixture data when the connected catalog is wrong', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://u:p@localhost/nexus_showcase');
    vi.stubEnv('TEST_DATABASE_URL', 'postgresql://u:p@localhost/nexus_showcase_test');
    mocks.catalog.$queryRaw.mockResolvedValue([{ database: 'nexus_showcase', schema: 'public' }]);
    const run = vi.fn();
    await expect(withTestFixtures(run)).rejects.toThrow(/catalog/);
    expect(run).not.toHaveBeenCalled();
    expect(mocks.catalog.$executeRawUnsafe).not.toHaveBeenCalled();
    for (const mutation of Object.values(mocks.catalog.user)) expect(mutation).not.toHaveBeenCalled();
    expect(mocks.catalog.$disconnect).toHaveBeenCalledOnce();
  });
});
