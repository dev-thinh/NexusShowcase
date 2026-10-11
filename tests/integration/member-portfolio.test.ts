import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('Member Automatic Portfolio', () => {
  it('should find items where member is tagged as contributor', async () => {
    // Tạo test user và test item
    const testMember = await prisma.user.create({
      data: {
        email: `portfolio-member-${Date.now()}@student.hcmus.edu.vn`,
        fullName: 'Nguyễn Thử Nghiệm Portfolio',
        role: 'MEMBER',
        status: 'ACTIVE',
      },
    });

    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) throw new Error('Admin not found in DB');

    const testItem = await prisma.showcaseItem.create({
      data: {
        title: 'Mô Hình Phân Đoạn Ảnh ViMed-Seg Test',
        slug: `vimed-seg-portfolio-test-${Date.now()}`,
        summary: 'Tóm tắt bài báo thử nghiệm portfolio',
        type: 'RESEARCH_PAPER',
        status: 'PUBLISHED',
        publishedYear: 2026,
        creatorId: admin.id,
        contributors: {
          create: [
            {
              userId: testMember.id,
              role: 'CO_AUTHOR',
              displayOrder: 1,
            },
          ],
        },
      },
    });

    const contributions = await prisma.itemContributor.findMany({
      where: {
        userId: testMember.id,
        item: { status: 'PUBLISHED' },
      },
      include: {
        item: true,
      },
    });

    expect(contributions.length).toBeGreaterThan(0);
    expect(contributions[0].item.title).toContain('ViMed-Seg');

    // Clean up
    await prisma.showcaseItem.delete({ where: { id: testItem.id } });
    await prisma.user.delete({ where: { id: testMember.id } });
  });
});
