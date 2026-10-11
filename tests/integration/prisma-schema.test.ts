import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('Prisma Schema and Database Models', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should find seeded admin user', async () => {
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });
    expect(admin).toBeDefined();
    expect(admin?.role).toBe('ADMIN');
  });

  it('should create and retrieve a showcase item with contributor', async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) throw new Error('Admin not found');

    const item = await prisma.showcaseItem.create({
      data: {
        title: 'Thử nghiệm mô hình Transformer trên ảnh y tế',
        slug: 'transformer-anh-y-te-test',
        summary: 'Tóm tắt bài báo nghiên cứu ứng dụng Transformer',
        type: 'RESEARCH_PAPER',
        status: 'PUBLISHED',
        publishedYear: 2026,
        creatorId: admin.id,
        contributors: {
          create: [
            {
              userId: admin.id,
              role: 'ADVISOR',
              displayOrder: 1,
            },
            {
              externalName: 'TS. Nguyễn Văn A',
              externalAffiliation: 'Khoa CNTT - HCMUS',
              role: 'ADVISOR',
              displayOrder: 2,
            },
          ],
        },
      },
      include: {
        contributors: true,
      },
    });

    expect(item.id).toBeDefined();
    expect(item.contributors.length).toBe(2);

    // Clean up
    await prisma.showcaseItem.delete({ where: { id: item.id } });
  });

  it('should support isPinned and pinnedAt on showcase items', async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) throw new Error('Admin not found');

    const item = await prisma.showcaseItem.create({
      data: {
        title: 'Bài báo kiểm tra Ghim',
        slug: `test-pin-schema-${Date.now()}`,
        summary: 'Tóm tắt bài báo kiểm tra schema ghim',
        type: 'RESEARCH_PAPER',
        publishedYear: 2026,
        status: 'PUBLISHED',
        isPinned: true,
        pinnedAt: new Date(),
        creatorId: admin.id,
      },
    });

    expect((item as any).isPinned).toBe(true);
    expect((item as any).pinnedAt).not.toBeNull();

    // Clean up
    await prisma.showcaseItem.delete({ where: { id: item.id } });
  });
});
