import { beforeEach, expect, it } from 'vitest';
import { prisma } from '../fixtures/database';
import { revokeBulkMembers } from '@/features/identity/server/bulk-member-commands';
import { searchRevokeMembers } from '@/features/identity/server/bulk-member-queries';
import type { Actor } from '@/features/identity/model/session';
let actor: Actor;
let sequence = 0;
beforeEach(async () => {
  const user = await prisma.user.create({ data: { fullName: 'Revoke admin', email: `revoke-admin-${sequence++}@test.invalid`, role: 'ADMIN', status: 'ACTIVE' } });
  actor = { ...user, status: 'ACTIVE' };
});
const createMember = () => prisma.user.create({ data: { fullName: 'Revoke eligible', email: `revoke-core-${sequence++}@test.invalid`, role: 'CORE_MEMBER', status: 'ACTIVE' } });
it('revokes a batch, invalidates its sessions and preserves existing publications', async () => {
  const users = await Promise.all([createMember(), createMember()]);
  const post = await prisma.showcaseItem.create({ data: { creatorId: users[0].id, title: 'Retained after revoke', slug: 'retained-after-revoke', summary: 'Research', status: 'PUBLISHED' } });
  const input = { members: users.map(user => ({ id: user.id, expectedVersion: 1 })) };
  expect(await revokeBulkMembers(actor, input)).toMatchObject({ success: true });
  expect(await prisma.user.findMany({ where: { id: { in: users.map(user => user.id) } }, select: { role: true, sessionVersion: true, status: true } })).toEqual(users.map(() => ({ role: 'MEMBER', sessionVersion: 2, status: 'ACTIVE' })));
  expect(await prisma.showcaseItem.count({ where: { id: post.id } })).toBe(1);
  expect(await revokeBulkMembers(actor, input)).toMatchObject({ success: false, code: 'CONFLICT' });
});
it('rejects mixed stale or protected selections without revoking anyone', async () => {
  const users = await Promise.all([createMember(), createMember()]);
  expect(await revokeBulkMembers(actor, { members: [{ id: users[0].id, expectedVersion: 1 }, { id: users[1].id, expectedVersion: 99 }] })).toMatchObject({ success: false, code: 'CONFLICT' });
  expect(await revokeBulkMembers(actor, { members: [{ id: users[0].id, expectedVersion: 1 }, { id: actor.id, expectedVersion: 1 }] })).toMatchObject({ success: false, code: 'CONFLICT' });
  expect(await prisma.user.count({ where: { id: { in: users.map(user => user.id) }, role: 'CORE_MEMBER' } })).toBe(2);
});
it('searches only active visible team leaders and rechecks administrator authority', async () => {
  const active = await createMember();
  const hidden = await createMember();
  const disabled = await createMember();
  await prisma.user.update({ where: { id: hidden.id }, data: { hiddenFromDirectory: true } });
  await prisma.user.update({ where: { id: disabled.id }, data: { status: 'SUSPENDED' } });
  const results = await searchRevokeMembers({ query: 'Revoke eligible', page: 1 });
  expect(results.items.map(row => row.id)).toContain(active.id);
  expect(results.items.map(row => row.id)).not.toContain(hidden.id);
  expect(results.items.map(row => row.id)).not.toContain(disabled.id);
  await prisma.user.update({ where: { id: actor.id }, data: { role: 'MEMBER' } });
  expect(await revokeBulkMembers(actor, { members: [{ id: active.id, expectedVersion: 1 }] })).toMatchObject({ success: false, code: 'FORBIDDEN' });
});
