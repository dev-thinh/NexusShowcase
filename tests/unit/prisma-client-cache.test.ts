import { afterEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ models: [{ name: 'ShowcaseItem', fields: ['title'] }] as unknown[], created: 0 }));
vi.mock('@prisma/client', () => ({
  Prisma: { dmmf: { datamodel: { get models() { return mocks.models; } } } },
  PrismaClient: class {
    id = ++mocks.created;
    $disconnect = vi.fn().mockResolvedValue(undefined);
  },
}));
vi.mock('@/server/observability/timing', () => ({ recordQueryDuration: vi.fn() }));
const cache = globalThis as unknown as { prisma?: { $disconnect: ReturnType<typeof vi.fn> }; prismaSchema?: string };
afterEach(() => {
  delete cache.prisma;
  delete cache.prismaSchema;
  vi.resetModules();
});

it('reuses the client across reloads with an unchanged schema', async () => {
  const first = await import('@/server/db/prisma');
  vi.resetModules();
  const second = await import('@/server/db/prisma');
  expect(second.prisma).toBe(first.prisma);
});

it('replaces and disconnects a client cached before a schema change', async () => {
  const first = await import('@/server/db/prisma');
  mocks.models = [{ name: 'ShowcaseItem', fields: ['title', 'citationEnabled'] }];
  vi.resetModules();
  const second = await import('@/server/db/prisma');
  expect(second.prisma).not.toBe(first.prisma);
  expect(first.prisma.$disconnect).toHaveBeenCalledOnce();
});

it('replaces a legacy cached client without schema metadata', async () => {
  const old = { $disconnect: vi.fn().mockResolvedValue(undefined) };
  cache.prisma = old;
  delete cache.prismaSchema;
  const { prisma } = await import('@/server/db/prisma');
  expect(prisma).not.toBe(old);
  expect(old.$disconnect).toHaveBeenCalledOnce();
});
