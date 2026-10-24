import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../fixtures/database';

describe('Prisma Schema and Database Models', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should find or create admin user fixture', async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'fixture-admin@nexus.test' },
      update: {},
      create: {
        email: 'fixture-admin@nexus.test',
        fullName: 'Fixture Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    expect(admin).toBeDefined();
    expect(admin.role).toBe('ADMIN');
  });

  it('should create and retrieve a showcase item with contributor', async () => {
    let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: 'fixture-admin-showcase@nexus.test',
          fullName: 'Fixture Admin Showcase',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });
    }

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

  it('persists a submission revision, editorial draft, review comment, and audit event', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const fixtureEmails = [
      `workflow-author-${suffix}@nexus.test`,
      `workflow-editor-${suffix}@nexus.test`,
    ];

    try {
      const author = await prisma.user.create({
        data: {
          email: fixtureEmails[0],
          fullName: 'Workflow Author',
          role: 'CORE_MEMBER',
          status: 'ACTIVE',
        },
      });
      const editor = await prisma.user.create({
        data: {
          email: fixtureEmails[1],
          fullName: 'Workflow Editor',
          role: 'EDITOR',
          status: 'ACTIVE',
        },
      });
      const item = await prisma.showcaseItem.create({
        data: {
          title: 'Workflow persistence fixture',
          slug: `workflow-persistence-${suffix}`,
          summary: 'A fixture for the editorial persistence workflow.',
          creatorId: author.id,
          suggestedField: 'Robotics',
          customProjectType: 'Embedded research prototype',
          revisions: {
            create: {
              revisionNumber: 1,
              snapshot: { title: 'Workflow persistence fixture' },
              submittedById: author.id,
            },
          },
          editorialDraft: {
            create: {
              assignedEditorId: editor.id,
              overrides: { title: 'Edited workflow fixture' },
            },
          },
          reviewComments: {
            create: {
              fieldKey: 'summary',
              body: 'Please clarify the research contribution.',
              audience: 'AUTHOR',
              severity: 'REQUIRED',
              authorId: editor.id,
            },
          },
          auditEvents: {
            create: {
              actorId: editor.id,
              action: 'EDITOR_ASSIGNED',
            },
          },
        },
        include: {
          revisions: true,
          editorialDraft: true,
          reviewComments: true,
          auditEvents: true,
        },
      });

      expect(item.revisions).toHaveLength(1);
      expect(item.editorialDraft?.assignedEditorId).toBe(editor.id);
      expect(item.reviewComments).toHaveLength(1);
      expect(item.auditEvents).toHaveLength(1);

      await prisma.showcaseItem.delete({ where: { id: item.id } });
    } finally {
      await prisma.user.deleteMany({ where: { email: { in: fixtureEmails } } });
    }
  });
});
