import type { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { verifyTestDatabase } from '../setup/database-guard';

export type TestUser = { id: string; email: string; password: string; role: Role };

export async function createBenchmarkFixtures(input: { prisma: PrismaClient; items: 20 | 1000; members: 100; prefix: string }): Promise<{ prefix: string; users: TestUser[] }> {
  const expected = new URL(process.env.TEST_DATABASE_URL ?? '');
  if (!/^nexus_test_[a-f0-9]{32}$/.test(input.prefix)) throw Error('Benchmark fixtures require an owned test schema.');
  expected.searchParams.set('schema', input.prefix);
  await verifyTestDatabase(input.prisma, expected.toString());
  const password = randomBytes(24).toString('base64url');
  const passwordHash = await bcrypt.hash(password, 10);
  const users: TestUser[] = [];
  for (let i = 0; i < input.members; i++) {
    const role: Role = i === 0 ? 'ADMIN' : i === 1 ? 'CORE_MEMBER' : 'MEMBER';
    const user = await input.prisma.user.create({ data: { fullName: `Benchmark Member ${String(i).padStart(3, '0')}`, email: `${input.prefix}-${i}@example.test`, role, status: 'ACTIVE', passwordHash, mustChangePassword: i === 2 } });
    users.push({ id: user.id, email: user.email, role, password });
  }
  const research = await input.prisma.category.create({ data: { name: 'Benchmark Research', slug: 'bai-bao-khoa-hoc', layoutType: 'BIBLIOGRAPHY' } });
  const robotics = await input.prisma.category.create({ data: { name: 'Benchmark Robotics', slug: 'robotics-iot' } });
  await input.prisma.showcaseItem.createMany({ data: Array.from({ length: input.items }, (_, i) => ({
    id: `${input.prefix}_item_${i}`, title: `Benchmark ${i % 2 === 0 ? 'Research' : 'Robotics'} ${String(i).padStart(4, '0')}`,
    slug: `benchmark-${i}`, summary: 'Synthetic public benchmark fixture.', content: 'Synthetic benchmark content.',
    type: i % 2 === 0 ? 'RESEARCH_PAPER' : 'PROJECT', categoryId: i % 2 === 0 ? research.id : robotics.id,
    creatorId: users[1].id, status: 'PUBLISHED', visibility: 'PUBLIC', publishedYear: 2026,
    publishedAt: new Date(Date.UTC(2026, 0, 1) - i * 1000), createdAt: new Date(Date.UTC(2026, 0, 1) - i * 1000),
    isPinned: i < 2,
  })) });
  await input.prisma.itemContributor.createMany({ data: Array.from({ length: input.items }, (_, i) => ({ itemId: `${input.prefix}_item_${i}`, userId: users[1 + i % 99].id, role: 'CONTRIBUTOR' })) });
  return { prefix: input.prefix, users };
}
