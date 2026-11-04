import { beforeEach, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '../fixtures/database';
import { createAdditionalAdmin } from '../../prisma/create-admin';
import { listAdminMembers } from '@/features/identity/server/member-queries';
import { getHomeMembers, listDirectory } from '@/features/members/server/queries';

beforeEach(async () => { await prisma.user.deleteMany(); });

it('adds a hidden admin without changing existing accounts or public member counts', async () => {
  const existing = await prisma.user.create({ data: { email: 'existing-admin', fullName: 'Existing admin', role: 'ADMIN', status: 'ACTIVE', passwordHash: 'unchanged', sessionVersion: 4 } });
  const hidden = await createAdditionalAdmin(prisma, { identifier: ' BtLam ', password: 'private-admin-password-2026', hidden: true });
  expect(hidden).toMatchObject({ email: 'btlam', role: 'ADMIN', status: 'ACTIVE', mustChangePassword: true, hiddenFromDirectory: true });
  expect(await bcrypt.compare('private-admin-password-2026', hidden.passwordHash!)).toBe(true);
  expect(await prisma.user.findUniqueOrThrow({ where: { id: existing.id } })).toEqual(existing);
  expect(await prisma.user.count({ where: { role: 'ADMIN' } })).toBe(2);
  for (const role of ['ALL', 'ADMIN'] as const) {
    for (const q of ['', 'btlam', 'existing']) {
      const result = await listAdminMembers({ q, role, page: 999 });
      expect(result.items.map(user => user.id)).toEqual(q === 'btlam' ? [] : [existing.id]);
      expect(result.total).toBe(q === 'btlam' ? 0 : 1);
      expect(result.counts).toMatchObject({ ALL: 1, ADMIN: 1 });
      expect(result.totalPages).toBe(1);
    }
  }
  for (const authenticated of [false, true]) {
    const directory = await listDirectory({ authenticated, role: 'ADMIN', page: 1, pageSize: 'all' });
    expect(directory.total).toBe(1);
    expect(directory.items.map(user => user.id)).toEqual([existing.id]);
  }
  const home = await getHomeMembers();
  expect(home.total).toBe(1);
  expect(home.members.map(user => user.id)).toEqual([existing.id]);
});

it('rejects duplicate identifiers and short passwords without modifying accounts', async () => {
  const existing = await prisma.user.create({ data: { email: 'btlam', fullName: 'Existing', role: 'MEMBER', status: 'ACTIVE', passwordHash: 'unchanged' } });
  await expect(createAdditionalAdmin(prisma, { identifier: 'BTLAM', password: 'private-admin-password-2026', hidden: true })).rejects.toMatchObject({ code: 'P2002' });
  await expect(createAdditionalAdmin(prisma, { identifier: 'new-admin', password: 'short', hidden: true })).rejects.toThrow();
  expect(await prisma.user.findMany()).toEqual([existing]);
});

it('keeps ordinary additional admins visible by default', async () => {
  const admin = await createAdditionalAdmin(prisma, { identifier: 'visible-admin', password: 'private-admin-password-2026' });
  expect(admin.hiddenFromDirectory).toBe(false);
  expect((await getHomeMembers()).members.map(user => user.id)).toEqual([admin.id]);
});
