import { PrismaClient } from '@prisma/client';
import { loadEnvConfig } from '@next/env';

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--apply') || args.length > 1) throw new Error('Usage: cleanup-rate-limits.ts [--apply]');
  loadEnvConfig(process.cwd());
  const db = new PrismaClient({ log: [] });
  try {
    const where = { resetAt: { lte: new Date() } };
    const result = args.includes('--apply') ? await db.rateLimitBucket.deleteMany({ where }) : { count: await db.rateLimitBucket.count({ where }) };
    console.log(JSON.stringify({ mode: args.includes('--apply') ? 'apply' : 'dry-run', expiredBuckets: result.count }));
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error('Rate-limit maintenance failed; no account data was modified.'); process.exitCode = 1; });
