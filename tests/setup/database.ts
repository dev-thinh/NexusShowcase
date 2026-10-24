import { afterAll, vi } from 'vitest';
import { initializeSuiteFixtures } from '../fixtures/database';
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/server/db/prisma', async () => {
  const { prisma } = await import('../fixtures/database');
  return { prisma };
});

const cleanup = await initializeSuiteFixtures();
// Run after suite-specific hooks, which may still need the scoped client.
afterAll(cleanup);
