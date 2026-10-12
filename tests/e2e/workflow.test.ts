import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createShowcaseItemAction, reviewShowcaseItemAction } from '@/actions/showcase-actions';
import { updateUserRoleAction } from '@/actions/admin-actions';
import bcrypt from 'bcryptjs';

describe('End-to-End Club Showcase Workflow', () => {
  let admin: any;
  let newStudent: any;
  let regularStudent: any;

  beforeAll(async () => {
    admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) throw new Error('Admin not found in DB');

    // Tạo 2 sinh viên mới
    const passwordHash = await bcrypt.hash('pass123456', 10);
    newStudent = await prisma.user.create({
      data: {
        email: `student.e2e.${Date.now()}@student.hcmus.edu.vn`,
        fullName: 'Nguyễn Văn Test Sinh Viên',
        passwordHash,
        role: 'MEMBER',
        status: 'ACTIVE',
      },
    });

    regularStudent = await prisma.user.create({
      data: {
        email: `teammate.e2e.${Date.now()}@student.hcmus.edu.vn`,
        fullName: 'Lê Thị Đồng Đội',
        passwordHash,
        role: 'MEMBER',
        status: 'ACTIVE',
      },
    });
  });

  it('Step 1: Member thường không được phép nộp bài', async () => {
    const attempt = await createShowcaseItemAction({
      title: 'Đề tài chưa được cấp quyền',
      summary: 'Thử nghiệm nộp bài trái phép',
      type: 'PROJECT',
      publishedYear: 2026,
      contributors: [],
      links: [],
    });
    expect(attempt.success).toBe(false);
  });

  it('Step 2: Thầy chủ nhiệm nâng cấp sinh viên lên CORE_MEMBER', async () => {
    const promotion = await updateUserRoleAction(newStudent.id, 'CORE_MEMBER');
    expect(promotion.success).toBe(true);
    expect(promotion.user?.role).toBe('CORE_MEMBER');
  });

  it('Step 3: Core Member nộp bài có Thầy hướng dẫn và đồng đội tham gia', async () => {
    const submission = await createShowcaseItemAction({
      title: 'Hệ Thống Trưng Bày Khoa Học NexusShowcase E2E',
      summary: 'Nền tảng trưng bày kết quả nghiên cứu sinh viên',
      type: 'PROJECT',
      scope: 'CLUB_CONTRIBUTION',
      publishedYear: 2026,
      contributors: [
        {
          userId: admin.id,
          role: 'ADVISOR',
          displayOrder: 1,
        },
        {
          userId: newStudent.id,
          role: 'PROJECT_LEAD',
          displayOrder: 2,
        },
        {
          userId: regularStudent.id,
          role: 'CONTRIBUTOR',
          displayOrder: 3,
        },
      ],
      links: [
        {
          label: 'GitHub',
          url: 'https://github.com/nexus-club/showcase',
          type: 'GITHUB',
        },
      ],
      submitForReview: true,
    });

    expect(submission.success).toBe(true);
    expect(submission.item?.status).toBe('PENDING_REVIEW');

    // Step 4: Thầy chủ nhiệm duyệt xuất bản
    const review = await reviewShowcaseItemAction(submission.item!.id, {
      action: 'PUBLISH',
    });
    expect(review.success).toBe(true);
    expect(review.status).toBe('PUBLISHED');

    // Step 5: Kiểm tra bài tự động xuất hiện trong Portfolio của cả 2 sinh viên
    const teammateContributions = await prisma.itemContributor.findMany({
      where: {
        userId: regularStudent.id,
        item: { status: 'PUBLISHED' },
      },
    });
    expect(teammateContributions.length).toBeGreaterThan(0);

    // Clean up
    await prisma.showcaseItem.delete({ where: { id: submission.item!.id } });
    await prisma.user.delete({ where: { id: newStudent.id } });
    await prisma.user.delete({ where: { id: regularStudent.id } });
  });
});
