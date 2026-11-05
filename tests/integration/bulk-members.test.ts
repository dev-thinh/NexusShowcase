import { beforeAll, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '../fixtures/database';
import type { Actor } from '@/features/identity/model/session';
import { previewBulkMembers, createBulkMembers } from '@/features/identity/server/bulk-member-commands';
import { previewBulkMembersAction, createBulkMembersAction } from '@/features/identity/server/bulk-member-actions';
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
it('guards every server action and accepts only bounded validated payloads', async () => {
  session.actor = null;
  for (const action of [previewBulkMembersAction, createBulkMembersAction]) expect(await action({} as any)).toMatchObject({ success: false, code: 'UNAUTHORIZED' });
  session.actor = admin;
  expect(await previewBulkMembersAction({ csv: 'x'.repeat(128 * 1024 + 1) })).toMatchObject({ success: false, code: 'VALIDATION' });
});

it('cannot create duplicate identities when two batches race', async () => {
  const input = { csv: csv('Concurrent,batch-concurrent,\n') };
  const results = await Promise.all([createBulkMembers(admin, input), createBulkMembers(admin, input)]);
  expect(results.flatMap(result => result.success ? result.data : []).filter(row => row.status === 'CREATED')).toHaveLength(1);
  expect(await prisma.user.count({ where: { email: 'batch-concurrent' } })).toBe(1);
});

it('rejects revoked administrator authority before creating accounts', async () => {
  const revoked = await prisma.user.create({ data: { email: 'revoked-csv', fullName: 'Revoked', role: 'MEMBER', status: 'ACTIVE' } });
  expect(await createBulkMembers({ ...admin, id: revoked.id }, { csv: csv('Denied,should-not-exist,\n') })).toMatchObject({ success: false, code: 'FORBIDDEN' });
  expect(await prisma.user.count({ where: { email: 'should-not-exist' } })).toBe(0);
});
