import { verifyDatabaseUpgrade } from '../../scripts/verify-database-upgrade';
import { expect, it, vi } from 'vitest';
vi.mock('@prisma/client', async importOriginal => ({ ...await importOriginal<object>(), PrismaClient: vi.fn(() => { throw Error('Client must not be constructed for unsafe input'); }) }));
it('rejects arbitrary test schemas before constructing a client', async () => {
  await expect(verifyDatabaseUpgrade({ freshUrl: 'postgresql://local/nexus_test?schema=public', legacyFixtureUrl: 'postgresql://local/nexus_test?schema=legacy', outputPath: 'unused.json' })).rejects.toThrow('generated test schemas');
});
it('rejects the same schema for both fixture paths', async () => {
  await expect(verifyDatabaseUpgrade({ freshUrl: 'postgresql://local/nexus_test?schema=public', legacyFixtureUrl: 'postgresql://local/nexus_test?schema=public', outputPath: 'unused.json' })).rejects.toThrow('distinct owned schemas');
});
