import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  createShowcaseItemAction,
  reviewShowcaseItemAction,
  saveShowcaseDraftAction,
  submitShowcaseForReviewAction,
} from '@/actions/showcase-actions';
import { requestAuthorRevisionAction } from '@/actions/editorial-actions';

const currentUserMock = vi.hoisted(() => ({
  actor: null as {
    id: string;
    fullName: string;
    role: 'ADMIN' | 'EDITOR' | 'CORE_MEMBER' | 'MEMBER';
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
  let editorUser: any;

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
    editorUser = await prisma.user.create({
      data: {
        email: `editor-sc-${timestamp}@nexus.hcmus.edu.vn`,
        fullName: 'Editor Showcase Test',
        role: 'EDITOR',
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

  it('routes admin-created submissions through editorial review', async () => {
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
    expect(result.item?.status).toBe('PENDING_REVIEW');

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

    // Admin cannot bypass the editorial handoff.
    currentUserMock.actor = adminUser;
    const reviewResult = await reviewShowcaseItemAction(result.item!.id, {
      action: 'PUBLISH',
    });
    expect(reviewResult.success).toBe(false);

    // Dọn dẹp
    await prisma.showcaseItem.delete({ where: { id: result.item!.id } });
  });

  it('creates immutable revisions when a member submits and resubmits a draft', async () => {
    currentUserMock.actor = coreUser;
    const draft = await saveShowcaseDraftAction(null, {
      title: 'Revision workflow fixture',
      summary: '',
      contributors: [],
      resources: [],
    });
    expect(draft.success).toBe(true);
    if (!draft.success) return;

    const invalidSubmission = await submitShowcaseForReviewAction(draft.data.id);
    expect(invalidSubmission.success).toBe(false);
    expect(invalidSubmission).toHaveProperty('fieldErrors.summary');

    const saved = await saveShowcaseDraftAction(draft.data.id, {
      title: 'Revision workflow fixture',
      summary: 'First immutable submission.',
      contributors: [{ userId: coreUser.id, role: 'PROJECT_LEAD', displayOrder: 0 }],
      resources: [],
    });
    expect(saved.success).toBe(true);
    const first = await submitShowcaseForReviewAction(draft.data.id);
    expect(first).toEqual({ success: true, data: { status: 'PENDING_REVIEW', revisionNumber: 1 } });

    currentUserMock.actor = editorUser;
    const revision = await requestAuthorRevisionAction({
      itemId: draft.data.id,
      fieldKey: 'summary',
      reason: 'Please clarify the result.',
    });
    expect(revision).toEqual({ success: true, data: { status: 'REVISION_REQUESTED' } });

    currentUserMock.actor = coreUser;
    await saveShowcaseDraftAction(draft.data.id, {
      title: 'Revision workflow fixture',
      summary: 'Second immutable submission with clarified results.',
      contributors: [{ userId: coreUser.id, role: 'PROJECT_LEAD', displayOrder: 0 }],
      resources: [],
    });
    const second = await submitShowcaseForReviewAction(draft.data.id);
    expect(second).toEqual({ success: true, data: { status: 'PENDING_REVIEW', revisionNumber: 2 } });

    const revisions = await prisma.submissionRevision.findMany({
      where: { itemId: draft.data.id },
      orderBy: { revisionNumber: 'asc' },
    });
    expect(revisions).toHaveLength(2);
    expect((revisions[0].snapshot as { summary: string }).summary).toBe('First immutable submission.');
    expect((revisions[1].snapshot as { summary: string }).summary).toContain('clarified results');
    expect((revisions[0].snapshot as { contributors: Array<{ displayName?: string }> }).contributors[0].displayName)
      .toBe(coreUser.fullName);

    await prisma.showcaseItem.delete({ where: { id: draft.data.id } });
  });

  afterAll(async () => {
    if (coreUser?.id) {
      await prisma.showcaseItem.deleteMany({ where: { creatorId: coreUser.id } });
      await prisma.user.deleteMany({ where: { id: coreUser.id } });
    }
    if (regularUser?.id) {
      await prisma.user.deleteMany({ where: { id: regularUser.id } });
    }
    if (editorUser?.id) {
      await prisma.user.deleteMany({ where: { id: editorUser.id } });
    }
  });
});
