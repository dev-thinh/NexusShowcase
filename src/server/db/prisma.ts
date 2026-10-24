import { recordQueryDuration } from '@/server/observability/timing';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrisma() {
  const client = new PrismaClient({
    log: process.env.PERF_METRICS === '1'
      ? [{ emit: 'event', level: 'query' }, { emit: 'stdout', level: 'error' }]
      : process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  if (process.env.PERF_METRICS === '1') client.$on('query', event => recordQueryDuration(event.duration));
  return client;
}

export const prisma = globalForPrisma.prisma || createPrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
