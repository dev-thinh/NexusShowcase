import bcrypt from 'bcryptjs';
import { beforeEach, expect, it } from 'vitest';
import { prisma } from '../fixtures/database';
import { resetBulkMemberPasswords } from '@/features/identity/server/bulk-password-reset';
import type { Actor } from '@/features/identity/model/session';
let actor: Actor;
let sequence = 0;
beforeEach(async () => {
  const admin = await prisma.user.create({ data: { fullName: 'Reset admin', email: `reset-admin-${sequence++}@test.invalid`, role: 'ADMIN', status: 'ACTIVE' } });
  actor = { ...admin, status: 'ACTIVE' };
});
const createMember = () => prisma.user.create({ data: { fullName: 'Reset member', email: `reset-member-${sequence++}@test.invalid`, role: 'MEMBER', status: 'ACTIVE', passwordHash: 'old-hash', temporaryPasswordConsumed: true } });
it('atomically issues distinct temporary passwords, revokes sessions and forces a password change', async () => {
  const users = await Promise.all([createMember(), createMember()]);
  const input = { members: users.map(user => ({ id: user.id, expectedVersion: user.sessionVersion })) };
  const result = await resetBulkMemberPasswords(actor, input);
  expect(result.success).toBe(true);
  if (!result.success) throw Error(result.error);
  expect(new Set(result.data.credentials.map(row => row.temporaryPassword)).size).toBe(2);
  for (const credential of result.data.credentials) {
    const saved = await prisma.user.findUniqueOrThrow({ where: { id: credential.id } });
    expect(credential.temporaryPassword.length).toBeGreaterThanOrEqual(24);
    expect(await bcrypt.compare(credential.temporaryPassword, saved.passwordHash!)).toBe(true);
    expect(saved).toMatchObject({ sessionVersion: 2, mustChangePassword: true, temporaryPasswordConsumed: false });
    expect(credential).not.toHaveProperty('passwordHash');
  }
  expect(await resetBulkMemberPasswords(actor, input)).toMatchObject({ success: false, code: 'CONFLICT' });
});
it('rejects stale, disabled, self and administrator targets without changing any account', async () => {
  const user = await createMember();
  const input = { id: user.id, expectedVersion: 1 };
  expect(await resetBulkMemberPasswords(actor, { members: [input, { id: actor.id, expectedVersion: 1 }] })).toMatchObject({ success: false, code: 'FORBIDDEN' });
  expect(await resetBulkMemberPasswords(actor, { members: [{ ...input, expectedVersion: 99 }] })).toMatchObject({ success: false, code: 'CONFLICT' });
  await prisma.user.update({ where: { id: user.id }, data: { status: 'SUSPENDED' } });
  expect(await resetBulkMemberPasswords(actor, { members: [input] })).toMatchObject({ success: false, code: 'CONFLICT' });
  expect(await prisma.user.findUnique({ where: { id: user.id } })).toMatchObject({ passwordHash: 'old-hash', sessionVersion: 1 });
});
