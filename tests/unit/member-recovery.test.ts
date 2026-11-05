import bcrypt from 'bcryptjs';
import { beforeEach, expect, it, vi } from 'vitest';
import { restoreMember, resetMemberPassword } from '@/features/identity/server/member-commands';
const state = vi.hoisted(() => ({ rows: new Map<string, Record<string, any>>() }));
vi.mock('server-only', () => ({}));
vi.mock('@/server/db/prisma', () => {
 const user = {
  findUnique: async ({ where }: any) => state.rows.get(where.id) ?? null,
  updateMany: async ({ where, data }: any) => {
   const row = state.rows.get(where.id);
   if (!row || Object.entries(where).some(([key, value]) => row[key] !== value)) return { count: 0 };
   for (const [key, value] of Object.entries(data)) row[key] = key === 'sessionVersion' ? row[key] + (value as any).increment : value;
   return { count: 1 };
  },
 };
 return { prisma: { $transaction: async (callback: any) => callback({ user }) } };
});
const actor = { id: 'admin', role: 'ADMIN' as const, fullName: 'Admin', status: 'ACTIVE' as const, mustChangePassword: false };
beforeEach(() => {
 state.rows.clear();
 state.rows.set('admin', { ...actor, deletedAt: null });
 state.rows.set('member', { id: 'member', fullName: 'Member', role: 'MEMBER', status: 'SUSPENDED', deletedAt: new Date(), sessionVersion: 4, passwordHash: 'old-hash', mustChangePassword: true, temporaryPasswordConsumed: true });
});
it('restores the same identity and history, revokes sessions and keeps a consumed credential spent', async () => {
 expect(await restoreMember(actor, { targetUserId: 'member', expectedVersion: 4 })).toMatchObject({ success: true });
 expect(state.rows.get('member')).toMatchObject({ id: 'member', status: 'ACTIVE', deletedAt: null, sessionVersion: 5, passwordHash: 'old-hash', temporaryPasswordConsumed: true });
});
it('resets once per observed version with a random forced-change credential and no hash in response', async () => {
 const row = state.rows.get('member')!; row.status = 'ACTIVE'; row.deletedAt = null;
 const result = await resetMemberPassword(actor, { targetUserId: 'member', expectedVersion: 4 });
 expect(result.success).toBe(true);
 if (!result.success) throw Error(result.error);
 expect(result.data.temporaryPassword!.length).toBeGreaterThanOrEqual(24);
 expect(await bcrypt.compare(result.data.temporaryPassword!, row.passwordHash)).toBe(true);
 expect(row).toMatchObject({ sessionVersion: 5, mustChangePassword: true, temporaryPasswordConsumed: false });
 expect(Object.keys(result.data)).toEqual(['temporaryPassword']);
 expect(await resetMemberPassword(actor, { targetUserId: 'member', expectedVersion: 4 })).toMatchObject({ success: false, code: 'CONFLICT' });
});
it.each(['restore', 'reset'])('rejects stale admin authority during %s', async operation => {
 state.rows.get('admin')!.role = 'MEMBER';
 const command = operation === 'restore' ? restoreMember : resetMemberPassword;
 expect(await command(actor, { targetUserId: 'member', expectedVersion: 4 })).toMatchObject({ success: false, code: 'FORBIDDEN' });
 expect(state.rows.get('member')!.sessionVersion).toBe(4);
});
it('rejects resetting the current administrator through recovery', async () => {
 expect(await resetMemberPassword(actor, { targetUserId: actor.id, expectedVersion: 1 })).toMatchObject({ success: false, code: 'FORBIDDEN' });
});
