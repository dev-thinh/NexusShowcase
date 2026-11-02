import { expect, it } from 'vitest';
import { prisma } from '../fixtures/database';

it('generates stable Vietnamese name slugs and unique collision suffixes without exposing IDs', async () => {
  const first = await prisma.user.create({ data: { email: 'slug-first@test.invalid', fullName: 'Nguyễn Đăng Khoa' } });
  const second = await prisma.user.create({ data: { email: 'slug-second@test.invalid', fullName: 'Nguyễn Đăng Khoa' } });
  expect(first).toHaveProperty('publicSlug', 'nguyen-dang-khoa');
  expect(second).toHaveProperty('publicSlug', expect.stringMatching(/^nguyen-dang-khoa-[a-f0-9]{12}$/));
  expect(second).not.toHaveProperty('publicSlug', expect.stringContaining(second.id));
  const renamed = await prisma.user.update({ where: { id: first.id }, data: { fullName: 'Changed Name' } });
  expect(renamed).toHaveProperty('publicSlug', 'nguyen-dang-khoa');
});

it('reserves directory routes and handles empty or non-Latin names safely', async () => {
  const reserved = await prisma.user.create({ data: { email: 'slug-reserved@test.invalid', fullName: 'All' } });
  const empty = await prisma.user.create({ data: { email: 'slug-empty@test.invalid', fullName: '東京' } });
  expect(reserved).toHaveProperty('publicSlug', expect.stringMatching(/^all-[a-f0-9]{12}$/));
  expect(empty).toHaveProperty('publicSlug', 'member');
});

it('serializes concurrent requests for the same name', async () => {
  const users = await Promise.all(Array.from({ length: 4 }, (_, index) => prisma.user.create({ data: { email: `slug-race-${index}@test.invalid`, fullName: 'Concurrent Name' } })));
  const slugs = users.map(user => (user as typeof user & { publicSlug: string }).publicSlug);
  expect(new Set(slugs).size).toBe(4);
  expect(slugs).toContain('concurrent-name');
});

it('keeps slugs immutable even for direct writers', async () => {
  const user = await prisma.user.create({ data: { email: 'slug-immutable@test.invalid', fullName: 'Stable Profile' } });
  const updated = await prisma.user.update({ where: { id: user.id }, data: { publicSlug: 'replacement', fullName: 'New Name' } });
  expect(updated.publicSlug).toBe('stable-profile');
});
