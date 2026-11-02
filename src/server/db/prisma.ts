import { recordQueryDuration } from '@/server/observability/timing';
import { Prisma, PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaSchema?: string };
const schemaSignature = JSON.stringify(Prisma.dmmf.datamodel.models);

function createPrisma() {
  const client = new PrismaClient({
    log: process.env.PERF_METRICS === '1'
      ? [{ emit: 'event', level: 'query' }, { emit: 'stdout', level: 'error' }]
      : process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  if (process.env.PERF_METRICS === '1') client.$on('query', event => recordQueryDuration(event.duration));
  return client;
}

// Fast Refresh must not reuse an instance generated for a previous schema.
const cached = globalForPrisma.prisma;
export const prisma = cached && globalForPrisma.prismaSchema === schemaSignature ? cached : createPrisma();
if (cached && cached !== prisma) void cached.$disconnect().catch(() => undefined);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchema = schemaSignature;
}
