import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  prisma: {
    user: { findUnique: vi.fn() },
    showcaseItem: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('server-only', () => ({}));

import { toggleItemVisibilityAction } from '@/actions/showcase-actions';

const VALID_ITEM_ID = 'cjr012345678901234567890';
const ADMIN_ID = 'cjr012345678901234567899';
const MEMBER_ID = 'cjr012345678901234567888';

describe('toggleItemVisibilityAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated or non-admin users', async () => {
    mocks.auth.mockResolvedValue({ user: { id: MEMBER_ID, role: 'MEMBER' } });
    mocks.prisma.user.findUnique.mockResolvedValue({ id: MEMBER_ID, role: 'MEMBER', status: 'ACTIVE' });

    const result = await toggleItemVisibilityAction(VALID_ITEM_ID);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Quản trị viên');
  });

  it('toggles PRIVATE to PUBLIC successfully for admin', async () => {
    mocks.auth.mockResolvedValue({ user: { id: ADMIN_ID, role: 'ADMIN' } });
    mocks.prisma.user.findUnique.mockResolvedValue({ id: ADMIN_ID, role: 'ADMIN', status: 'ACTIVE' });
    mocks.prisma.showcaseItem.findUnique.mockResolvedValue({
      id: VALID_ITEM_ID,
      visibility: 'PRIVATE',
      slug: 'test-project',
    });
    mocks.prisma.showcaseItem.update.mockResolvedValue({
      id: VALID_ITEM_ID,
      visibility: 'PUBLIC',
      slug: 'test-project',
    });

    const result = await toggleItemVisibilityAction(VALID_ITEM_ID);
    expect(result.success).toBe(true);
    expect(result.visibility).toBe('PUBLIC');
    expect(mocks.prisma.showcaseItem.update).toHaveBeenCalledWith({
      where: { id: VALID_ITEM_ID },
      data: { visibility: 'PUBLIC' },
      select: { id: true, visibility: true, slug: true },
    });
  });

  it('toggles PUBLIC to PRIVATE successfully for admin', async () => {
    mocks.auth.mockResolvedValue({ user: { id: ADMIN_ID, role: 'ADMIN' } });
    mocks.prisma.user.findUnique.mockResolvedValue({ id: ADMIN_ID, role: 'ADMIN', status: 'ACTIVE' });
    mocks.prisma.showcaseItem.findUnique.mockResolvedValue({
      id: VALID_ITEM_ID,
      visibility: 'PUBLIC',
      slug: 'test-project',
    });
    mocks.prisma.showcaseItem.update.mockResolvedValue({
      id: VALID_ITEM_ID,
      visibility: 'PRIVATE',
      slug: 'test-project',
    });

    const result = await toggleItemVisibilityAction(VALID_ITEM_ID);
    expect(result.success).toBe(true);
    expect(result.visibility).toBe('PRIVATE');
    expect(mocks.prisma.showcaseItem.update).toHaveBeenCalledWith({
      where: { id: VALID_ITEM_ID },
      data: { visibility: 'PRIVATE' },
      select: { id: true, visibility: true, slug: true },
    });
  });
});
