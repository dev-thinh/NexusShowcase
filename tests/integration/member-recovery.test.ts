import bcrypt from 'bcryptjs';
import type { NextAuthConfig } from 'next-auth';
import type { CredentialsConfig } from 'next-auth/providers/credentials';
import { beforeEach, expect, it, vi } from 'vitest';
import { prisma } from '../fixtures/database';
import { restoreMember, resetMemberPassword } from '@/features/identity/server/member-commands';
import { changePassword } from '@/features/identity/server/password-command';
import { listAdminMembers } from '@/features/identity/server/member-queries';
const authConfig = vi.hoisted(() => ({ value: null as NextAuthConfig | null }));
vi.mock('next-auth', () => ({ CredentialsSignin: class extends Error {}, default: (config: NextAuthConfig) => { authConfig.value = config; return {}; } }));
await import('@/features/identity/server/auth');
beforeEach(async () => { await prisma.user.deleteMany(); });
async function accounts() {
 const admin = await prisma.user.create({ data: { fullName: 'Recovery Admin', email: 'recovery-admin@test.invalid', role: 'ADMIN', status: 'ACTIVE' } });
 const user = await prisma.user.create({ data: { fullName: 'Nguyễn Recovery', email: 'recovery-member@test.invalid', role: 'MEMBER', status: 'ACTIVE', passwordHash: await bcrypt.hash('old-password-long', 4) } });
 return { actor: { id: admin.id, fullName: admin.fullName, role: 'ADMIN' as const, status: 'ACTIVE' as const, mustChangePassword: false }, user };
}
it('preserves identity on restoration, revokes old sessions and retains consumed credentials', async () => {
 const { actor, user } = await accounts();
 await prisma.user.update({ where: { id: user.id }, data: { status: 'SUSPENDED', deletedAt: new Date(), temporaryPasswordConsumed: true } });
 const disabled = await listAdminMembers({ q: 'NGUYEN', role: 'MEMBER', status: 'DISABLED', page: 1 });
 expect(disabled.items.map(item => item.id)).toEqual([user.id]);
 expect(await restoreMember(actor, { targetUserId: user.id, expectedVersion: 1 })).toMatchObject({ success: true });
 expect(await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).toMatchObject({ status: 'ACTIVE', deletedAt: null, sessionVersion: 2, temporaryPasswordConsumed: true, passwordHash: user.passwordHash });
 expect((await listAdminMembers({ q: 'NGUYEN', role: 'MEMBER', status: 'DISABLED', page: 1 })).items).toHaveLength(0);
});
it('permits one temporary login under concurrency, blocks replay, then changes to a reusable password', async () => {
 const { actor, user } = await accounts();
 const result = await resetMemberPassword(actor, { targetUserId: user.id, expectedVersion: 1 });
 expect(result.success).toBe(true);
 if (!result.success || !result.data.temporaryPassword) throw Error('Expected temporary password');
 const provider = authConfig.value!.providers[0] as CredentialsConfig & { options: Partial<CredentialsConfig> };
 const login = (password: string) => provider.options.authorize!({ email: user.email, password }, new Request('http://localhost'));
 const sessions = await Promise.all([login(result.data.temporaryPassword), login(result.data.temporaryPassword)]);
 expect(sessions.filter(Boolean)).toHaveLength(1);
 expect(sessions.find(Boolean)).toMatchObject({ mustChangePassword: true, sessionVersion: 3 });
 expect(await login(result.data.temporaryPassword)).toBeNull();
 expect(await login('old-password-long')).toBeNull();
 const changed = await changePassword({ id: user.id, fullName: user.fullName, role: 'MEMBER', status: 'ACTIVE', mustChangePassword: true }, { currentPassword: result.data.temporaryPassword, newPassword: 'New-password-long-123!' });
 expect(changed.success).toBe(true);
 expect(await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).toMatchObject({ temporaryPasswordConsumed: false, mustChangePassword: false, sessionVersion: 4 });
 expect(await login('New-password-long-123!')).toMatchObject({ mustChangePassword: false, sessionVersion: 4 });
 expect(await login('New-password-long-123!')).toMatchObject({ mustChangePassword: false, sessionVersion: 4 });
});
it('rejects concurrent reset replay and a demoted administrator', async () => {
 const { actor, user } = await accounts();
 const results = await Promise.all([resetMemberPassword(actor, { targetUserId: user.id, expectedVersion: 1 }), resetMemberPassword(actor, { targetUserId: user.id, expectedVersion: 1 })]);
 expect(results.filter(result => result.success)).toHaveLength(1);
 expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).sessionVersion).toBe(2);
 await prisma.user.update({ where: { id: actor.id }, data: { role: 'MEMBER' } });
 expect(await resetMemberPassword(actor, { targetUserId: user.id, expectedVersion: 2 })).toMatchObject({ success: false, code: 'FORBIDDEN' });
});
