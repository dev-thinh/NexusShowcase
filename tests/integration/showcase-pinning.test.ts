import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { togglePinShowcaseItemAction } from '@/actions/showcase-actions';

describe('Showcase Pinning Action', () => {
  let adminUser: any;
  let regularUser: any;
  const createdItemIds: string[] = [];

  beforeAll(async () => {
    adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: `admin-pin-${Date.now()}@nexus.hcmus.edu.vn`,
          fullName: 'Admin Pin Test',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });
    }

    regularUser = await prisma.user.create({
      data: {
        email: `member-pin-${Date.now()}@nexus.hcmus.edu.vn`,
        fullName: 'Member Pin Test',
        role: 'MEMBER',
        status: 'ACTIVE',
      },
    });
  });

  afterAll(async () => {
    if (createdItemIds.length > 0) {
      await prisma.showcaseItem.deleteMany({
        where: { id: { in: createdItemIds } },
      });
    }
  });

  it('should forbid non-admin from pinning item', async () => {
    const item = await prisma.showcaseItem.create({
      data: {
        title: 'Bài báo test quyền',
        slug: `test-pin-perm-${Date.now()}`,
        summary: 'Tóm tắt',
        type: 'RESEARCH_PAPER',
        publishedYear: 2026,
        status: 'PUBLISHED',
        creatorId: adminUser.id,
      },
    });
    createdItemIds.push(item.id);

    const result = await togglePinShowcaseItemAction(item.id);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Chỉ Quản trị viên');
  });

  it('should toggle pin and unpin successfully by admin', async () => {
    const item = await prisma.showcaseItem.create({
      data: {
        title: 'Bài báo test toggle pin',
        slug: `test-pin-toggle-${Date.now()}`,
        summary: 'Tóm tắt',
        type: 'RESEARCH_PAPER',
        publishedYear: 2026,
        status: 'PUBLISHED',
        creatorId: adminUser.id,
      },
    });
    createdItemIds.push(item.id);

    // Pin
    const pinRes = await togglePinShowcaseItemAction(item.id);
    expect(pinRes.success).toBe(true);
    expect(pinRes.isPinned).toBe(true);

    const pinnedItem = await prisma.showcaseItem.findUnique({ where: { id: item.id } });
    expect(pinnedItem?.isPinned).toBe(true);
    expect(pinnedItem?.pinnedAt).not.toBeNull();

    // Unpin
    const unpinRes = await togglePinShowcaseItemAction(item.id);
    expect(unpinRes.success).toBe(true);
    expect(unpinRes.isPinned).toBe(false);

    const unpinnedItem = await prisma.showcaseItem.findUnique({ where: { id: item.id } });
    expect(unpinnedItem?.isPinned).toBe(false);
    expect(unpinnedItem?.pinnedAt).toBeNull();
  });

  it('should enforce FIFO eviction when pinning exceeds 10 items', async () => {
    // Reset all pinned items to ensure clean state
    await prisma.showcaseItem.updateMany({
      data: { isPinned: false, pinnedAt: null },
    });

    // Create 10 pinned items with sequential pinnedAt
    const items: any[] = [];
    const baseTime = Date.now() - 100000;
    for (let i = 0; i < 10; i++) {
      const itm = await prisma.showcaseItem.create({
        data: {
          title: `Bài báo ghim số ${i + 1}`,
          slug: `test-pin-fifo-${i}-${Date.now()}`,
          summary: `Tóm tắt số ${i + 1}`,
          type: 'RESEARCH_PAPER',
          publishedYear: 2026,
          status: 'PUBLISHED',
          isPinned: true,
          pinnedAt: new Date(baseTime + i * 1000),
          creatorId: adminUser.id,
        },
      });
      items.push(itm);
      createdItemIds.push(itm.id);
    }

    const oldestItem = items[0];

    // Create the 11th item and pin it
    const item11 = await prisma.showcaseItem.create({
      data: {
        title: 'Bài báo thứ 11 cần ghim',
        slug: `test-pin-fifo-11-${Date.now()}`,
        summary: 'Tóm tắt 11',
        type: 'RESEARCH_PAPER',
        publishedYear: 2026,
        status: 'PUBLISHED',
        isPinned: false,
        creatorId: adminUser.id,
      },
    });
    createdItemIds.push(item11.id);

    const pin11Res = await togglePinShowcaseItemAction(item11.id);
    expect(pin11Res.success).toBe(true);
    expect(pin11Res.isPinned).toBe(true);

    // Oldest item must now be unpinned
    const refreshedOldest = await prisma.showcaseItem.findUnique({ where: { id: oldestItem.id } });
    expect(refreshedOldest?.isPinned).toBe(false);

    // Total pinned items count must still be exactly 10
    const totalPinned = await prisma.showcaseItem.count({
      where: { isPinned: true, status: 'PUBLISHED' },
    });
    expect(totalPinned).toBe(10);
  });
});
