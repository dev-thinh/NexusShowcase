import { beforeEach, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '../fixtures/database';
import { bootstrapAdmin } from '../../prisma/seed-bootstrap';

beforeEach(async () => { await prisma.user.deleteMany(); });

it('creates the first administrator with a private password and mandatory password change', async () => {
 expect(await bootstrapAdmin(prisma, { BOOTSTRAP_ADMIN_EMAIL: ' FirstAdmin ', BOOTSTRAP_ADMIN_PASSWORD: 'private-bootstrap-password-2026' })).toBe('created');
 const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'firstadmin' } });
 expect(admin).toMatchObject({ role: 'ADMIN', status: 'ACTIVE', mustChangePassword: true });
 expect(await bcrypt.compare('private-bootstrap-password-2026', admin.passwordHash!)).toBe(true);
});

it('rerunning bootstrap preserves existing administrators without requiring any bootstrap password', async () => {
 const before = await prisma.user.create({ data: { email: 'existing-admin', fullName: 'Existing', role: 'ADMIN', status: 'SUSPENDED', passwordHash: 'unchanged', sessionVersion: 7 } });
 expect(await bootstrapAdmin(prisma, {})).toBe('existing');
 expect(await prisma.user.findUniqueOrThrow({ where: { id: before.id } })).toEqual(before);
});

it('does not promote or reset an existing nonadmin account', async () => {
 const before = await prisma.user.create({ data: { email: 'member', fullName: 'Member', role: 'MEMBER', status: 'ACTIVE', passwordHash: 'unchanged' } });
 await expect(bootstrapAdmin(prisma, { BOOTSTRAP_ADMIN_EMAIL: 'member', BOOTSTRAP_ADMIN_PASSWORD: 'private-bootstrap-password-2026' })).rejects.toThrow('Bootstrap identifier already belongs to an account.');
 expect(await prisma.user.findUniqueOrThrow({ where: { id: before.id } })).toEqual(before);
});

it('serializes competing first-admin bootstraps into one account', async () => {
 const results = await Promise.all(['admin-one', 'admin-two'].map(email => bootstrapAdmin(prisma, { BOOTSTRAP_ADMIN_EMAIL: email, BOOTSTRAP_ADMIN_PASSWORD: 'private-bootstrap-password-2026' })));
 expect(results.sort()).toEqual(['created', 'existing']);
 expect(await prisma.user.count({ where: { role: 'ADMIN' } })).toBe(1);
});
