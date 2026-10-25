import { expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '../fixtures/database';
import { consumeRateLimit } from '@/features/identity/server/rate-limit';
import { changePassword } from '@/features/identity/server/password-command';
import { createMember } from '@/features/identity/server/member-commands';

it('atomically permits only the shared request budget under concurrent calls', async () => {
 const results = await Promise.all(Array.from({ length: 24 }, () => consumeRateLimit({ scope: 'integration', key: 'concurrent', limit: 5, windowMs: 60_000 })));
 expect(results.filter(result => result.allowed)).toHaveLength(5);
 expect(results.filter(result => !result.allowed).every(result => result.retryAfterSeconds > 0)).toBe(true);
 await prisma.rateLimitBucket.updateMany({ data: { resetAt: new Date(0) } });
 expect((await consumeRateLimit({ scope: 'integration', key: 'concurrent', limit: 5, windowMs: 60_000 })).allowed).toBe(true);
});
it('only one concurrent password change accepts the original password', async () => {
 const user = await prisma.user.create({ data: { email: 'password-race@test.invalid', fullName: 'Race', status: 'ACTIVE', role: 'MEMBER', passwordHash: await bcrypt.hash('original-password', 4) } });
 const actor = { ...user, status: 'ACTIVE' as const };
 const results = await Promise.all(['first-password', 'second-password'].map(newPassword => changePassword(actor, { currentPassword: 'original-password', newPassword })));
 expect(results.filter(result => result.success)).toHaveLength(1);
 const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
 expect(stored.sessionVersion).toBe(2);
});
it('normalizes newly created accounts and rejects a concurrent normalized duplicate', async () => {
 const admin = await prisma.user.create({ data: { email: 'identity-admin@test.invalid', fullName: 'Admin', status: 'ACTIVE', role: 'ADMIN' } });
 const actor = { ...admin, status: 'ACTIVE' as const };
 const results = await Promise.all([' MixedCase@Test.Invalid ', 'mixedcase@test.invalid'].map(email => createMember(actor, { fullName: 'Member', email })));
 expect(results.filter(result => result.success)).toHaveLength(1);
 expect(await prisma.user.count({ where: { email: 'mixedcase@test.invalid' } })).toBe(1);
 await expect(prisma.user.create({ data: { email: ' MIXEDCASE@test.invalid ', fullName: 'Duplicate' } })).rejects.toMatchObject({ code: 'P2002' });
});
it('does not create an account after administrator demotion during password hashing', async () => {
 const admin = await prisma.user.create({ data: { email: 'revoked-create@test.invalid', fullName: 'Admin', status: 'ACTIVE', role: 'ADMIN' } });
 const actor = { ...admin, status: 'ACTIVE' as const };
 let entered!: () => void;
 let resume!: () => void;
 const reachedHash = new Promise<void>(resolve => { entered = resolve; });
 const releaseHash = new Promise<void>(resolve => { resume = resolve; });
 const originalHash = bcrypt.hash.bind(bcrypt);
 const hash = vi.spyOn(bcrypt, 'hash').mockImplementationOnce((async (password: string, rounds: number) => { entered(); await releaseHash; return originalHash(password, rounds); }) as typeof bcrypt.hash);
 const creating = createMember(actor, { fullName: 'Blocked', email: 'revoked-created@test.invalid' });
 await reachedHash;
 try { await prisma.user.update({ where: { id: admin.id }, data: { role: 'MEMBER' } }); }
 finally { resume(); }
 try {
  expect(await creating).toMatchObject({ success: false, code: 'FORBIDDEN' });
  expect(await prisma.user.count({ where: { email: 'revoked-created@test.invalid' } })).toBe(0);
 } finally { hash.mockRestore(); }
});
it('allows only one account in a login alias family under concurrent creation', async () => {
 const admin = await prisma.user.create({ data: { email: 'alias-create-admin@test.invalid', fullName: 'Admin', status: 'ACTIVE', role: 'ADMIN' } });
 const actor = { ...admin, status: 'ACTIVE' as const };
 const results = await Promise.all(['alias-race', 'Alias-Race@robotics.hcmus.edu.vn', 'alias-race@nexus.hcmus.edu.vn'].map(email => createMember(actor, { fullName: 'Alias', email })));
 expect(results.filter(result => result.success)).toHaveLength(1);
 await expect(prisma.user.create({ data: { email: ' ALIAS-RACE@nexus.hcmus.edu.vn ', fullName: 'Duplicate' } })).rejects.toMatchObject({ code: 'P2002' });
});
