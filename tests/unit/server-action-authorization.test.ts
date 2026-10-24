import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    showcaseItem: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/features/identity/server/auth', () => ({ auth: mocks.auth }));
vi.mock('@/server/db/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('server-only', () => ({}));

import {
createMemberAction,
deleteMemberAction,
updateUserRoleAction,
} from '@/features/identity/server/member-actions';
import { setShowcasePinAction } from '@/features/publications/server/actions';

describe('Server action authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue(null);
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: 'admin-id',
      role: 'ADMIN',
      status: 'ACTIVE',
      fullName: 'Forged Admin',
    });
    mocks.prisma.user.findFirst.mockResolvedValue(null);
    mocks.prisma.user.create.mockResolvedValue({ id: 'new-member' });
    mocks.prisma.user.update.mockResolvedValue({ id: 'member-id', role: 'CORE_MEMBER' });
    mocks.prisma.user.delete.mockResolvedValue({ id: 'member-id' });
    mocks.prisma.showcaseItem.findUnique.mockResolvedValue({
      id: 'item-id',
      slug: 'item',
      status: 'PUBLISHED',
      isPinned: false,
    });
    mocks.prisma.showcaseItem.create.mockResolvedValue({ id: 'new-item' });
    mocks.prisma.showcaseItem.update.mockResolvedValue({ id: 'item-id', slug: 'item', status: 'PUBLISHED' });
    mocks.prisma.showcaseItem.findMany.mockResolvedValue([]);
  });

  it('rejects a forged administrator ID when creating a member without a session', async () => {
    const result = await createMemberAction({
      fullName: 'New Member',
      email: 'new.member@nexus.test',
    });

    expect(result.success).toBe(false);
    expect(mocks.prisma.user.create).not.toHaveBeenCalled();
  });

  it('rejects forged administrator IDs for member role and deletion mutations', async () => {
    const roleResult = await updateUserRoleAction('member-id', 'CORE_MEMBER');
    const deleteResult = await deleteMemberAction('member-id');

    expect(roleResult.success).toBe(false);
    expect(deleteResult.success).toBe(false);
    expect(mocks.prisma.user.update).not.toHaveBeenCalled();
    expect(mocks.prisma.user.delete).not.toHaveBeenCalled();
  });

  it('rejects forged administrator IDs for review and pin mutations', async () => {
    const pinResult = await setShowcasePinAction({ itemId: 'item-id', enabled: true });

    expect(pinResult.success).toBe(false);
    expect(mocks.prisma.showcaseItem.update).not.toHaveBeenCalled();
  });

  it('returns only safe user fields after member mutations', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'admin-id' } });
    mocks.prisma.user.create.mockResolvedValue({
      id: 'member-id', fullName: 'New Member', role: 'MEMBER', status: 'ACTIVE',
      email: 'private@nexus.test', studentId: '2012345', passwordHash: 'hash',
    });
    mocks.prisma.user.update.mockResolvedValue({
      id: 'member-id', fullName: 'New Member', role: 'CORE_MEMBER', status: 'ACTIVE',
      email: 'private@nexus.test', studentId: '2012345', passwordHash: 'hash',
    });

    const created = await createMemberAction({ fullName: 'New Member', email: 'private@nexus.test' });
    const updated = await updateUserRoleAction('member-id', 'CORE_MEMBER');

    expect(JSON.stringify(created)).not.toMatch(/passwordHash|private@nexus\.test|2012345/);
    expect(JSON.stringify(updated)).not.toMatch(/passwordHash|private@nexus\.test|2012345/);
  });
});
