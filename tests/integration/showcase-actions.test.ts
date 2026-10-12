import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createShowcaseItemAction, reviewShowcaseItemAction } from '@/actions/showcase-actions';

const currentUserMock = vi.hoisted(() => ({
  actor: null as {
    id: string;
    fullName: string;
    role: 'ADMIN' | 'CORE_MEMBER' | 'MEMBER';
    status: 'ACTIVE';
  } | null,
}));

vi.mock('@/lib/current-user', () => ({
  getCurrentUser: vi.fn(async (allowedRoles?: string[]) => {
    const actor = currentUserMock.actor;
    if (!actor || (allowedRoles && !allowedRoles.includes(actor.role))) return null;
    return actor;
  }),
}));

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
    currentUserMock.actor = regularUser;
    const result = await createShowcaseItemAction({
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
    currentUserMock.actor = adminUser;
    const result = await createShowcaseItemAction({
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
    currentUserMock.actor = coreUser;
    const result = await createShowcaseItemAction({
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
    currentUserMock.actor = adminUser;
    const reviewResult = await reviewShowcaseItemAction(result.item!.id, {
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
