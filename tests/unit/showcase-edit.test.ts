import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    showcaseItem: {
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    itemContributor: {
      deleteMany: vi.fn(),
    },
    itemLink: {
      deleteMany: vi.fn(),
    },
    itemAttachment: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('server-only', () => ({}));

import { updateShowcaseItemAction } from '@/actions/showcase-actions';

const VALID_ITEM_ID = 'cjr012345678901234567890';
const OWNER_USER_ID = 'cjr012345678901234567891';
const OTHER_USER_ID = 'cjr012345678901234567892';
const ADMIN_USER_ID = 'cjr012345678901234567893';

const validUpdateInput = {
  title: 'Tiêu đề nghiên cứu đã sửa',
  summary: 'Tóm tắt mới đã cập nhật',
  type: 'RESEARCH_PAPER' as const,
  publishedYear: 2026,
  contributors: [],
  links: [],
  submitForReview: true,
};

describe('Showcase Edit & Resubmit Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.$transaction.mockImplementation(async (callback: any) => {
      if (typeof callback === 'function') {
        return callback(mocks.prisma);
      }
      return Promise.all(callback);
    });
  });

  it('allows owner to edit and resubmit a REJECTED item into PENDING_REVIEW', async () => {
    mocks.auth.mockResolvedValue({ user: { id: OWNER_USER_ID, role: 'CORE_MEMBER' } });
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: OWNER_USER_ID,
      role: 'CORE_MEMBER',
      status: 'ACTIVE',
    });
    mocks.prisma.showcaseItem.findUnique.mockResolvedValue({
      id: VALID_ITEM_ID,
      slug: 'tieu-de-cu',
      creatorId: OWNER_USER_ID,
      status: 'REJECTED',
      rejectionReason: 'Cần bổ sung link tài liệu',
    });
    mocks.prisma.showcaseItem.update.mockResolvedValue({
      id: VALID_ITEM_ID,
      slug: 'tieu-de-nghien-cuu-da-sua',
      status: 'PENDING_REVIEW',
    });

    const result = await updateShowcaseItemAction(VALID_ITEM_ID, validUpdateInput);

    expect(result.success).toBe(true);
    expect(mocks.prisma.showcaseItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: VALID_ITEM_ID },
        data: expect.objectContaining({
          status: 'PENDING_REVIEW',
          rejectionReason: null,
          title: 'Tiêu đề nghiên cứu đã sửa',
        }),
      })
    );
  });

  it('forbids another user from editing someone else’s item', async () => {
    mocks.auth.mockResolvedValue({ user: { id: OTHER_USER_ID, role: 'CORE_MEMBER' } });
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: OTHER_USER_ID,
      role: 'CORE_MEMBER',
      status: 'ACTIVE',
    });
    mocks.prisma.showcaseItem.findUnique.mockResolvedValue({
      id: VALID_ITEM_ID,
      creatorId: OWNER_USER_ID,
      status: 'REJECTED',
    });

    const result = await updateShowcaseItemAction(VALID_ITEM_ID, validUpdateInput);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Bạn không có quyền');
    expect(mocks.prisma.showcaseItem.update).not.toHaveBeenCalled();
  });

  it('forbids non-admin owner from editing a PUBLISHED item', async () => {
    mocks.auth.mockResolvedValue({ user: { id: OWNER_USER_ID, role: 'CORE_MEMBER' } });
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: OWNER_USER_ID,
      role: 'CORE_MEMBER',
      status: 'ACTIVE',
    });
    mocks.prisma.showcaseItem.findUnique.mockResolvedValue({
      id: VALID_ITEM_ID,
      creatorId: OWNER_USER_ID,
      status: 'PUBLISHED',
    });

    const result = await updateShowcaseItemAction(VALID_ITEM_ID, validUpdateInput);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Không thể chỉnh sửa công trình đã được xuất bản');
    expect(mocks.prisma.showcaseItem.update).not.toHaveBeenCalled();
  });

  it('allows ADMIN to edit even a PUBLISHED item', async () => {
    mocks.auth.mockResolvedValue({ user: { id: ADMIN_USER_ID, role: 'ADMIN' } });
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: ADMIN_USER_ID,
      role: 'ADMIN',
      status: 'ACTIVE',
    });
    mocks.prisma.showcaseItem.findUnique.mockResolvedValue({
      id: VALID_ITEM_ID,
      creatorId: OWNER_USER_ID,
      status: 'PUBLISHED',
    });
    mocks.prisma.showcaseItem.update.mockResolvedValue({
      id: VALID_ITEM_ID,
      status: 'PUBLISHED',
    });

    const result = await updateShowcaseItemAction(VALID_ITEM_ID, validUpdateInput);

    expect(result.success).toBe(true);
    expect(mocks.prisma.showcaseItem.update).toHaveBeenCalled();
  });
});
