import { expect, it, vi } from 'vitest';
import { createMember } from '@/features/identity/server/member-commands';
const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), create: vi.fn(), query: vi.fn(), transaction: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/server/db/prisma', () => ({ prisma: { $transaction: mocks.transaction, $queryRaw: mocks.query, user: { findUnique: mocks.findUnique, create: mocks.create } } }));
it('rejects an administrator snapshot after current rights were revoked', async () => {
 mocks.query.mockResolvedValue([]);
 mocks.create.mockResolvedValue({ id: 'new', fullName: 'Member', role: 'MEMBER', status: 'ACTIVE' });
 mocks.findUnique.mockResolvedValue({ role: 'MEMBER', status: 'ACTIVE' });
 mocks.transaction.mockImplementation(callback => callback({ user: { findUnique: mocks.findUnique, create: mocks.create }, $queryRaw: mocks.query }));
 const result = await createMember({ id: 'admin', role: 'ADMIN', status: 'ACTIVE', fullName: 'Admin', mustChangePassword: false }, { fullName: 'Member', email: 'member' });
 expect(result).toMatchObject({ success: false, code: 'FORBIDDEN' });
 expect(mocks.create).not.toHaveBeenCalled();
});
