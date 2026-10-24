import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { expect, it } from 'vitest';
import { prisma } from '../fixtures/database';

async function seed(file: string) {
  const url = await prisma.$queryRaw<Array<{ schema: string }>>`SELECT current_schema() AS schema`;
  const target = new URL(process.env.TEST_DATABASE_URL!);
  target.searchParams.set('schema', url[0].schema);
  const code = await new Promise<number>((resolve, reject) => {
    const child = spawn(process.execPath, [path.resolve('node_modules/tsx/dist/cli.mjs'), file], {
      env: { ...process.env, DATABASE_URL: target.toString(), RESET_DATABASE: 'false', BOOTSTRAP_ADMIN_EMAIL: 'seed-fixture@nexus.test', BOOTSTRAP_ADMIN_PASSWORD: randomBytes(24).toString('base64url') },
      stdio: 'ignore', windowsHide: true,
    });
    child.once('error', reject); child.once('exit', value => resolve(value ?? 1));
  });
  expect(code).toBe(0);
}
it('seeds twenty mock posts idempotently and preserves existing private content', async () => {
  await seed('prisma/seed.ts');
  const admin = await prisma.user.findFirstOrThrow({ where: { role: 'ADMIN' } });
  const existing = await prisma.showcaseItem.create({ data: { creatorId: admin.id, slug: 'existing-private-seed', title: 'Keep private', summary: '', content: 'Untouched content', status: 'PUBLISHED', visibility: 'PRIVATE' } });
  await seed('prisma/seed-mock-posts.ts');
  await seed('prisma/seed.ts');
  await seed('prisma/seed-mock-posts.ts');
  expect(await prisma.showcaseItem.count({ where: { slug: { startsWith: 'mock-' }, status: 'PUBLISHED', visibility: 'PUBLIC' } })).toBe(20);
  expect(await prisma.showcaseItem.count()).toBe(21);
  expect(await prisma.showcaseItem.findUnique({ where: { id: existing.id }, select: { title: true, content: true, visibility: true } })).toEqual({ title: 'Keep private', content: 'Untouched content', visibility: 'PRIVATE' });
}, 30_000);
