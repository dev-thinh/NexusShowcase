import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createShowcaseItemAction, reviewShowcaseItemAction } from '@/actions/showcase-actions';

describe('Showcase Server Actions', () => {
  let adminUser: any;
  let coreUser: any;
  let regularUser: any;

  beforeAll(async () => {
    adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    coreUser = await prisma.user.findFirst({ where: { role: 'CORE_MEMBER' } });
    regularUser = await prisma.user.findFirst({ where: { role: 'MEMBER' } });
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
    expect(result.error).toContain('Bạn không có quyền đăng tải bài viết');
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
      submitForReview: true,
    });

    expect(result.success).toBe(true);
    expect(result.item?.status).toBe('PENDING_REVIEW');
    expect(result.item?.contributors.length).toBe(3);

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
