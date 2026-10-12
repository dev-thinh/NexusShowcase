import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createShowcaseItemAction, reviewShowcaseItemAction } from '@/actions/showcase-actions';

describe('Showcase Server Actions', () => {
  let adminUser: any;
  let coreUser: any;
  let regularUser: any;

  beforeAll(async () => {
    adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: `admin-sc-${Date.now()}@nexus.hcmus.edu.vn`,
          fullName: 'Admin Showcase Test',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });
    }

    const timestamp = Date.now();
    coreUser = await prisma.user.create({
      data: {
        email: `core-sc-${timestamp}@nexus.hcmus.edu.vn`,
        fullName: 'Core Showcase Test',
        role: 'CORE_MEMBER',
        status: 'ACTIVE',
      },
    });

    regularUser = await prisma.user.create({
      data: {
        email: `member-sc-${timestamp}@nexus.hcmus.edu.vn`,
        fullName: 'Regular Showcase Test',
        role: 'MEMBER',
        status: 'ACTIVE',
      },
    });
  });

  it('should forbid regular member from creating showcase item', async () => {
    const result = await (createShowcaseItemAction as any)(regularUser.id, {
      title: 'Bài báo trái phép của member thường',
      summary: 'Tóm tắt bài báo',
      type: 'RESEARCH_PAPER',
      publishedYear: 2026,
      contributors: [],
      links: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Chỉ Thành viên nòng cốt');
  });

  it('should allow admin to create and directly publish showcase item', async () => {
    const result = await (createShowcaseItemAction as any)(adminUser.id, {
      title: 'Công trình của Thầy Cố Vấn',
      summary: 'Bài báo do Thầy chủ nhiệm trực tiếp đăng tải',
      type: 'RESEARCH_PAPER',
      publishedYear: 2026,
      contributors: [],
      links: [],
      submitForReview: true,
    });

    expect(result.success).toBe(true);
    expect(result.item?.status).toBe('PUBLISHED');

    if (result.item) {
      await prisma.showcaseItem.delete({ where: { id: result.item.id } });
    }
  });

  it('should allow core member to create showcase item with mixed contributors', async () => {
    const result = await (createShowcaseItemAction as any)(coreUser.id, {
      title: 'Hệ thống Nhận diện Khuôn mặt CLB',
      summary: 'Dự án áp dụng FaceNet và YOLO',
      type: 'PROJECT',
      publishedYear: 2026,
      contributors: [
        {
          userId: coreUser.id,
          role: 'PROJECT_LEAD',
          displayOrder: 1,
        },
        {
          userId: regularUser.id,
          role: 'CONTRIBUTOR',
          displayOrder: 2,
        },
        {
          externalName: 'ThS. Lê Hoàng',
          externalAffiliation: 'FPT Software',
          role: 'ADVISOR',
          displayOrder: 3,
        },
      ],
      links: [
        {
          label: 'GitHub Repo',
          url: 'https://github.com/test/face-recog',
          type: 'GITHUB',
        },
      ],
      attachments: [
        {
          fileName: 'paper-manuscript.pdf',
          fileUrl: '/uploads/documents/paper-manuscript.pdf',
          fileSize: 1024000,
          mimeType: 'application/pdf',
        },
      ],
      submitForReview: true,
    });

    expect(result.success).toBe(true);
    expect(result.item?.status).toBe('PENDING_REVIEW');
    expect(result.item?.contributors.length).toBe(3);
    expect(result.item?.attachments?.length).toBe(1);
    expect(result.item?.attachments?.[0].fileName).toBe('paper-manuscript.pdf');

    // Admin duyệt bài
    const reviewResult = await (reviewShowcaseItemAction as any)(adminUser.id, result.item!.id, {
      action: 'PUBLISH',
    });
    expect(reviewResult.success).toBe(true);
    expect(reviewResult.status).toBe('PUBLISHED');

    // Dọn dẹp
    await prisma.showcaseItem.delete({ where: { id: result.item!.id } });
  });

  afterAll(async () => {
    if (coreUser?.id) {
      await prisma.user.deleteMany({ where: { id: coreUser.id } });
    }
    if (regularUser?.id) {
      await prisma.user.deleteMany({ where: { id: regularUser.id } });
    }
  });
});
