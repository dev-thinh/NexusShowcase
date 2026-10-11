import { describe, it, expect, beforeAll } from 'vitest';
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
          email: 'admin-test@nexus.hcmus.edu.vn',
          fullName: 'Admin Test',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });
    }

    coreUser = await prisma.user.findFirst({ where: { role: 'CORE_MEMBER' } });
    if (!coreUser) {
      coreUser = await prisma.user.create({
        data: {
          email: 'core-test@nexus.hcmus.edu.vn',
          fullName: 'Core Member Test',
          role: 'CORE_MEMBER',
          status: 'ACTIVE',
        },
      });
    }

    regularUser = await prisma.user.findFirst({ where: { role: 'MEMBER' } });
    if (!regularUser) {
      regularUser = await prisma.user.create({
        data: {
          email: 'member-test@nexus.hcmus.edu.vn',
          fullName: 'Regular Member Test',
          role: 'MEMBER',
          status: 'ACTIVE',
        },
      });
    }
  });

  it('should forbid regular member from creating showcase item', async () => {
    const result = await createShowcaseItemAction(regularUser.id, {
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

  it('should forbid admin from creating showcase item (admin reviews only)', async () => {
    const result = await createShowcaseItemAction(adminUser.id, {
      title: 'Bài nộp thử từ tài khoản Admin',
      summary: 'Admin không được đăng bài trực tiếp',
      type: 'RESEARCH_PAPER',
      publishedYear: 2026,
      contributors: [],
      links: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Tài khoản Quản trị viên chỉ có thẩm quyền kiểm duyệt bài nộp');
  });

  it('should allow core member to create showcase item with mixed contributors', async () => {
    const result = await createShowcaseItemAction(coreUser.id, {
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
    const reviewResult = await reviewShowcaseItemAction(adminUser.id, result.item!.id, {
      action: 'PUBLISH',
    });
    expect(reviewResult.success).toBe(true);
    expect(reviewResult.status).toBe('PUBLISHED');

    // Dọn dẹp
    await prisma.showcaseItem.delete({ where: { id: result.item!.id } });
  });
});
