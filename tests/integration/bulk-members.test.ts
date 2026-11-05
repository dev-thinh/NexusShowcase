import { beforeAll, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '../fixtures/database';
import type { Actor } from '@/features/identity/model/session';
import { previewBulkMembers, createBulkMembers, grantBulkMembers } from '@/features/identity/server/bulk-member-commands';
import { searchGrantMembers } from '@/features/identity/server/bulk-member-queries';
import { previewBulkMembersAction, createBulkMembersAction, grantBulkMembersAction, searchGrantMembersAction } from '@/features/identity/server/bulk-member-actions';
const session = vi.hoisted(() => ({ actor: null as Actor | null }));
vi.mock('@/features/identity/server/actor', () => ({ getActor: async () => session.actor }));
vi.mock('@/features/identity/server/invalidation', () => ({ invalidateIdentityChange: vi.fn() }));
let admin: Actor;
const csv = (data: string) => 'Họ tên,Tên đăng nhập/email,MSSV\n' + data;
beforeAll(async () => {
  const row = await prisma.user.create({ data: { email: 'bulk-admin@test.invalid', fullName: 'Admin', role: 'ADMIN', status: 'ACTIVE' } });
  admin = { id: row.id, fullName: row.fullName, role: 'ADMIN', status: 'ACTIVE', mustChangePassword: false };
});
it('previews without writes, marks stored alias duplicates and creates only valid MEMBER rows', async () => {
  await prisma.user.create({ data: { fullName: 'Hidden existing', email: 'existing@nexus.hcmus.edu.vn', hiddenFromDirectory: true, status: 'SUSPENDED' } });
  const input = { csv: csv('Nguyễn An,bulk-new,2212\n,missing-name,\nTrùng,existing,\n') };
  const preview = await previewBulkMembers(admin, input);
  expect(preview.success).toBe(true);
  if (!preview.success) throw Error(preview.error);
  expect(preview.data.map(row => row.errors.length > 0)).toEqual([false, true, true]);
  expect(await prisma.user.count({ where: { email: 'bulk-new' } })).toBe(0);
  const created = await createBulkMembers(admin, input);
  if (!created.success) throw Error(created.error);
  expect(created.data.map(row => row.status)).toEqual(['CREATED', 'SKIPPED', 'SKIPPED']);
  const user = await prisma.user.findUniqueOrThrow({ where: { email: 'bulk-new' } });
  expect(user).toMatchObject({ role: 'MEMBER', status: 'ACTIVE', mustChangePassword: true, studentId: '2212' });
  expect(created.data[0].temporaryPassword).toMatch(/^Nexus-/);
  expect(await bcrypt.compare(created.data[0].temporaryPassword!, user.passwordHash!)).toBe(true);
  expect(JSON.stringify(created)).not.toContain('passwordHash');
  expect(created.data[1]).not.toHaveProperty('temporaryPassword');
  expect((await createBulkMembers(admin, input))).toMatchObject({ success: true, data: [{ status: 'SKIPPED' }, { status: 'SKIPPED' }, { status: 'SKIPPED' }] });
});
it('revalidates a duplicate introduced after preview and ignores injected roles', async () => {
  const input = { csv: csv('Race,bulk-preview-race,\n') };
  expect(await previewBulkMembers(admin, input)).toMatchObject({ success: true, data: [{ errors: [] }] });
  await prisma.user.create({ data: { fullName: 'Other admin created', email: 'bulk-preview-race' } });
  expect(await createBulkMembers(admin, input)).toMatchObject({ success: true, data: [{ status: 'SKIPPED' }] });
  expect(await createBulkMembers(admin, { ...input, role: 'ADMIN' } as any)).toMatchObject({ success: false, code: 'VALIDATION' });
});
it('only searches eligible visible active MEMBER users and folds Vietnamese names', async () => {
  for (const data of [
    { email: 'eligible', fullName: 'Nguyễn Đặng eligible', role: 'MEMBER' as const },
    { email: 'hidden-eligible', fullName: 'Nguyễn Đặng hidden', role: 'MEMBER' as const, hiddenFromDirectory: true },
    { email: 'core-eligible', fullName: 'Nguyễn Đặng core', role: 'CORE_MEMBER' as const },
    { email: 'suspended-eligible', fullName: 'Nguyễn Đặng suspended', role: 'MEMBER' as const, status: 'SUSPENDED' as const },
    { email: 'deleted-eligible', fullName: 'Nguyễn Đặng deleted', role: 'MEMBER' as const, deletedAt: new Date() },
  ]) await prisma.user.create({ data: { status: 'ACTIVE', ...data } });
  const result = await searchGrantMembers({ query: 'nguyen dang', page: 999 });
  expect(result.items.map(member => member.email)).toEqual(['eligible']);
  expect(result).toMatchObject({ total: 1, page: 1, totalPages: 1 });
  expect(Object.keys(result.items[0]).sort()).toEqual(['email', 'fullName', 'id', 'sessionVersion']);
});
it('grants atomically, increments sessions once, rejects repeats and forged hidden/admin/disabled targets', async () => {
  const users = await Promise.all(['grant-one', 'grant-two'].map(email => prisma.user.create({ data: { email, fullName: email, role: 'MEMBER', status: 'ACTIVE' } })));
  const members = users.map(user => ({ id: user.id, expectedVersion: user.sessionVersion }));
  expect(await grantBulkMembers(admin, { members })).toMatchObject({ success: true });
  expect(await prisma.user.findMany({ where: { id: { in: users.map(user => user.id) } }, select: { role: true, sessionVersion: true } })).toEqual([{ role: 'CORE_MEMBER', sessionVersion: 2 }, { role: 'CORE_MEMBER', sessionVersion: 2 }]);
  expect(await grantBulkMembers(admin, { members })).toMatchObject({ success: false, code: 'CONFLICT' });
  for (const data of [{ hiddenFromDirectory: true }, { status: 'SUSPENDED' as const }, { deletedAt: new Date() }, { role: 'ADMIN' as const }]) {
    const allowed = await prisma.user.create({ data: { email: crypto.randomUUID(), fullName: 'Allowed', role: 'MEMBER', status: 'ACTIVE' } });
    const blocked = await prisma.user.create({ data: { email: crypto.randomUUID(), fullName: 'Blocked', role: 'MEMBER', status: 'ACTIVE', ...data } });
    expect(await grantBulkMembers(admin, { members: [allowed, blocked].map(user => ({ id: user.id, expectedVersion: user.sessionVersion })) })).toMatchObject({ success: false, code: 'CONFLICT' });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: allowed.id } })).role).toBe('MEMBER');
  }
});
it('rejects stale versions, duplicate selections, oversized batches and revoked authority', async () => {
  const target = await prisma.user.create({ data: { email: 'stale-grant', fullName: 'Stale', role: 'MEMBER', status: 'ACTIVE' } });
  const entry = { id: target.id, expectedVersion: target.sessionVersion + 1 };
  expect(await grantBulkMembers(admin, { members: [entry] })).toMatchObject({ success: false, code: 'CONFLICT' });
  expect(await grantBulkMembers(admin, { members: [entry, entry] })).toMatchObject({ success: false, code: 'VALIDATION' });
  expect(await grantBulkMembers(admin, { members: Array.from({ length: 51 }, () => entry) })).toMatchObject({ success: false, code: 'VALIDATION' });
  const revoked = await prisma.user.create({ data: { email: 'revoked-bulk', fullName: 'Revoked', role: 'MEMBER', status: 'ACTIVE' } });
  const staleActor = { ...admin, id: revoked.id };
  expect(await createBulkMembers(staleActor, { csv: csv('Denied,should-not-exist,\n') })).toMatchObject({ success: false, code: 'FORBIDDEN' });
  expect(await grantBulkMembers(staleActor, { members: [{ ...entry, expectedVersion: target.sessionVersion }] })).toMatchObject({ success: false, code: 'FORBIDDEN' });
  expect(await prisma.user.count({ where: { email: 'should-not-exist' } })).toBe(0);
});
it('guards every server action and accepts only bounded validated payloads', async () => {
  session.actor = null;
  for (const action of [previewBulkMembersAction, createBulkMembersAction, grantBulkMembersAction, searchGrantMembersAction]) expect(await action({} as any)).toMatchObject({ success: false, code: 'UNAUTHORIZED' });
  session.actor = admin;
  expect(await searchGrantMembersAction({ query: 'a'.repeat(201), page: 1 })).toMatchObject({ success: false, code: 'VALIDATION' });
  expect(await previewBulkMembersAction({ csv: 'x'.repeat(128 * 1024 + 1) })).toMatchObject({ success: false, code: 'VALIDATION' });
});

it('cannot create duplicate identities when two batches race', async () => {
  const input = { csv: csv('Concurrent,batch-concurrent,\n') };
  const results = await Promise.all([createBulkMembers(admin, input), createBulkMembers(admin, input)]);
  expect(results.flatMap(result => result.success ? result.data : []).filter(row => row.status === 'CREATED')).toHaveLength(1);
  expect(await prisma.user.count({ where: { email: 'batch-concurrent' } })).toBe(1);
});
it('only one concurrent grant commits, without incrementing sessions twice', async () => {
  const user = await prisma.user.create({ data: { email: 'concurrent-grant', fullName: 'Concurrent grant', role: 'MEMBER', status: 'ACTIVE' } });
  const input = { members: [{ id: user.id, expectedVersion: user.sessionVersion }] };
  const results = await Promise.all([grantBulkMembers(admin, input), grantBulkMembers(admin, input)]);
  expect(results.filter(result => result.success)).toHaveLength(1);
  expect(await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).toMatchObject({ role: 'CORE_MEMBER', sessionVersion: 2 });
});
