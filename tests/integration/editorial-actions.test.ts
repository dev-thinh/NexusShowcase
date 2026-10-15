import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  assignEditorAction,
  saveEditorialDraftAction,
  addReviewCommentAction,
  resolveReviewCommentAction,
  markReadyForApprovalAction,
  returnToEditorAction,
  publishEditorialDraftAction,
} from '@/actions/editorial-actions';

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

describe('Editorial Actions Integration', () => {
  let adminUser: any;
  let editorUser: any;
  let authorUser: any;
  let testCategory: any;
  let testItem: any;
  let testRevision: any;

  beforeAll(async () => {
    const ts = Date.now();
    adminUser = await prisma.user.create({
      data: {
        email: `admin-editorial-${ts}@nexus.test`,
        fullName: 'Admin Editorial',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    editorUser = await prisma.user.create({
      data: {
        email: `editor-editorial-${ts}@nexus.test`,
        fullName: 'Editor Editorial',
        role: 'EDITOR',
        status: 'ACTIVE',
      },
    });

    authorUser = await prisma.user.create({
      data: {
        email: `author-editorial-${ts}@nexus.test`,
        fullName: 'Author Editorial',
        role: 'CORE_MEMBER',
        status: 'ACTIVE',
      },
    });

    testCategory = await prisma.category.create({
      data: {
        name: `Editorial Cat ${ts}`,
        slug: `editorial-cat-${ts}`,
      },
    });

    testItem = await prisma.showcaseItem.create({
      data: {
        title: 'Original Author Title',
        slug: `editorial-test-slug-${ts}`,
        summary: 'Original author summary that is complete.',
        content: 'Original author full content.',
        status: 'PENDING_REVIEW',
        type: 'PROJECT',
        creatorId: authorUser.id,
      },
    });

    testRevision = await prisma.submissionRevision.create({
      data: {
        itemId: testItem.id,
        revisionNumber: 1,
        submittedById: authorUser.id,
        snapshot: {
          title: 'Original Author Title',
          summary: 'Original author summary that is complete.',
          content: 'Original author full content.',
          contributors: [],
          resources: [],
        },
      },
    });
  });

  afterAll(async () => {
    if (authorUser) {
      await prisma.showcaseItem.deleteMany({ where: { creatorId: authorUser.id } });
    }
    if (testCategory) {
      await prisma.category.deleteMany({ where: { id: testCategory.id } });
    }
    await prisma.user.deleteMany({
      where: {
        id: { in: [adminUser?.id, editorUser?.id, authorUser?.id].filter(Boolean) },
      },
    });
  });

  it('rejects unauthorized users from assigning editors and allows EDITOR to self-assign', async () => {
    currentUserMock.actor = authorUser;
    const authorRes = await assignEditorAction(testItem.id, editorUser.id);
    expect(authorRes.success).toBe(false);

    currentUserMock.actor = editorUser;
    const editorRes = await assignEditorAction(testItem.id, editorUser.id);
    expect(editorRes.success).toBe(true);

    const draft = await prisma.editorialDraft.findUnique({
      where: { itemId: testItem.id },
    });
    expect(draft?.assignedEditorId).toBe(editorUser.id);

    const audit = await prisma.auditEvent.findFirst({
      where: { itemId: testItem.id, action: 'EDITOR_ASSIGNED' },
    });
    expect(audit).not.toBeNull();
  });

  it('allows EDITOR to save sparse overrides without mutating original submission snapshot', async () => {
    currentUserMock.actor = editorUser;
    const overrides = {
      title: 'Edited Title By Editor',
      summary: 'Enhanced summary by editor team.',
    };

    const saveRes = await saveEditorialDraftAction(testItem.id, overrides);
    expect(saveRes.success).toBe(true);

    const draft = await prisma.editorialDraft.findUnique({
      where: { itemId: testItem.id },
    });
    expect((draft?.overrides as any)?.title).toBe('Edited Title By Editor');

    // Immutable check: snapshot remains original
    const rev = await prisma.submissionRevision.findUnique({
      where: { itemId_revisionNumber: { itemId: testItem.id, revisionNumber: 1 } },
    });
    expect((rev?.snapshot as any)?.title).toBe('Original Author Title');
  });

  it('supports creating and resolving review comments with audience separation', async () => {
    currentUserMock.actor = editorUser;

    const commentRes = await addReviewCommentAction({
      itemId: testItem.id,
      revisionId: testRevision.id,
      fieldKey: 'content',
      body: 'Check the methodology section formatting.',
      audience: 'EDITORIAL',
      severity: 'REQUIRED',
    });
    expect(commentRes.success).toBe(true);
    const commentId = (commentRes as any).data?.id;
    expect(commentId).toBeDefined();

    const createdComment = await prisma.reviewComment.findUnique({
      where: { id: commentId },
    });
    expect(createdComment?.status).toBe('OPEN');
    expect(createdComment?.audience).toBe('EDITORIAL');

    const resolveRes = await resolveReviewCommentAction(commentId);
    expect(resolveRes.success).toBe(true);

    const resolved = await prisma.reviewComment.findUnique({
      where: { id: commentId },
    });
    expect(resolved?.status).toBe('RESOLVED');
    expect(resolved?.resolvedById).toBe(editorUser.id);
  });

  it('requires checklist and category before marking ready for approval', async () => {
    currentUserMock.actor = editorUser;

    // Fails with incomplete checklist
    const incompleteHandoff = await markReadyForApprovalAction({
      itemId: testItem.id,
      categoryId: testCategory.id,
      checklist: { copyEdited: true, mediaChecked: false, metadataChecked: true } as any,
    });
    expect(incompleteHandoff.success).toBe(false);

    // Succeeds when complete
    const validHandoff = await markReadyForApprovalAction({
      itemId: testItem.id,
      categoryId: testCategory.id,
      checklist: { copyEdited: true, mediaChecked: true, metadataChecked: true },
    });
    expect(validHandoff.success).toBe(true);

    const updatedItem = await prisma.showcaseItem.findUnique({
      where: { id: testItem.id },
    });
    expect(updatedItem?.status).toBe('READY_FOR_APPROVAL');
  });

  it('restricts returnToEditorAction to ADMIN and moves status back to PENDING_REVIEW', async () => {
    // EDITOR cannot return to editor
    currentUserMock.actor = editorUser;
    const editorReturn = await returnToEditorAction(testItem.id, 'Needs more polishing');
    expect(editorReturn.success).toBe(false);

    // ADMIN can return to editor
    currentUserMock.actor = adminUser;
    const adminReturn = await returnToEditorAction(testItem.id, 'Please revise the abstract phrasing.');
    expect(adminReturn.success).toBe(true);

    const returnedItem = await prisma.showcaseItem.findUnique({
      where: { id: testItem.id },
    });
    expect(returnedItem?.status).toBe('PENDING_REVIEW');

    const returnComment = await prisma.reviewComment.findFirst({
      where: {
        itemId: testItem.id,
        audience: 'EDITORIAL',
        body: 'Please revise the abstract phrasing.',
      },
    });
    expect(returnComment).not.toBeNull();
    if (returnComment) {
      await prisma.reviewComment.update({
        where: { id: returnComment.id },
        data: { status: 'RESOLVED', resolvedById: editorUser.id, resolvedAt: new Date() },
      });
    }
  });

  it('restricts publishEditorialDraftAction to ADMIN and materializes effective publication atomically', async () => {
    // Mark ready for approval first
    currentUserMock.actor = editorUser;
    await markReadyForApprovalAction({
      itemId: testItem.id,
      categoryId: testCategory.id,
      checklist: { copyEdited: true, mediaChecked: true, metadataChecked: true },
    });

    // Save editor overrides to be materialized
    await saveEditorialDraftAction(testItem.id, {
      title: 'Materialized Final Publication Title',
      summary: 'Polished academic summary for public display.',
    });

    // EDITOR cannot publish
    currentUserMock.actor = editorUser;
    const editorPublish = await publishEditorialDraftAction({
      itemId: testItem.id,
      checklist: { copyEdited: true, mediaChecked: true, metadataChecked: true },
    });
    expect(editorPublish.success).toBe(false);

    // ADMIN publishes
    currentUserMock.actor = adminUser;
    const adminPublish = await publishEditorialDraftAction({
      itemId: testItem.id,
      checklist: { copyEdited: true, mediaChecked: true, metadataChecked: true },
    });
    expect(adminPublish.success).toBe(true);

    // Verify materialized fields in ShowcaseItem
    const published = await prisma.showcaseItem.findUnique({
      where: { id: testItem.id },
    });
    expect(published?.status).toBe('PUBLISHED');
    expect(published?.title).toBe('Materialized Final Publication Title');
    expect(published?.summary).toBe('Polished academic summary for public display.');
    expect(published?.publishedAt).not.toBeNull();

    // Verify source snapshot and editorial draft records preserved
    const rev = await prisma.submissionRevision.findUnique({
      where: { itemId_revisionNumber: { itemId: testItem.id, revisionNumber: 1 } },
    });
    expect((rev?.snapshot as any)?.title).toBe('Original Author Title');

    const draft = await prisma.editorialDraft.findUnique({
      where: { itemId: testItem.id },
    });
    expect(draft).not.toBeNull();

    // Verify audit event
    const audit = await prisma.auditEvent.findFirst({
      where: { itemId: testItem.id, action: 'PUBLISHED' },
    });
    expect(audit).not.toBeNull();
  });

  it('rejects publication when not READY_FOR_APPROVAL, without category, or with open required comments', async () => {
    const unapprovedItem = await prisma.showcaseItem.create({
      data: {
        title: 'Unapproved Item',
        slug: `unapproved-${Date.now()}`,
        summary: 'Summary',
        status: 'PENDING_REVIEW',
        creatorId: authorUser.id,
      },
    });

    currentUserMock.actor = adminUser;
    // 1. Rejects if not READY_FOR_APPROVAL
    const resNotReady = await publishEditorialDraftAction({
      itemId: unapprovedItem.id,
      checklist: { copyEdited: true, mediaChecked: true, metadataChecked: true },
    });
    expect(resNotReady.success).toBe(false);

    // Update to READY_FOR_APPROVAL but without category
    await prisma.showcaseItem.update({
      where: { id: unapprovedItem.id },
      data: { status: 'READY_FOR_APPROVAL', categoryId: null },
    });
    // 2. Rejects if without category
    const resNoCat = await publishEditorialDraftAction({
      itemId: unapprovedItem.id,
      checklist: { copyEdited: true, mediaChecked: true, metadataChecked: true },
    });
    expect(resNoCat.success).toBe(false);

    // Update with category, but add an open REQUIRED comment
    await prisma.showcaseItem.update({
      where: { id: unapprovedItem.id },
      data: { categoryId: testCategory.id },
    });
    await prisma.submissionRevision.create({
      data: {
        itemId: unapprovedItem.id,
        revisionNumber: 1,
        submittedById: authorUser.id,
        snapshot: {
          title: 'Unapproved Item',
          summary: 'Summary',
          content: '',
          publishedYear: new Date().getFullYear(),
          suggestedField: '',
          customProjectType: '',
          contributors: [],
          resources: [],
        },
      },
    });
    const comment = await prisma.reviewComment.create({
      data: {
        itemId: unapprovedItem.id,
        fieldKey: 'content',
        body: 'Must fix this formula.',
        audience: 'EDITORIAL',
        severity: 'REQUIRED',
        status: 'OPEN',
        authorId: adminUser.id,
      },
    });
    // 3. Rejects if open required comment exists
    const resOpenComment = await publishEditorialDraftAction({
      itemId: unapprovedItem.id,
      checklist: { copyEdited: true, mediaChecked: true, metadataChecked: true },
    });
    expect(resOpenComment.success).toBe(false);

    // Resolve comment -> now should succeed
    await prisma.reviewComment.update({
      where: { id: comment.id },
      data: { status: 'RESOLVED', resolvedById: adminUser.id, resolvedAt: new Date() },
    });
    const resSuccess = await publishEditorialDraftAction({
      itemId: unapprovedItem.id,
      checklist: { copyEdited: true, mediaChecked: true, metadataChecked: true },
    });
    expect(resSuccess.success).toBe(true);

    // Clean up
    await prisma.showcaseItem.delete({ where: { id: unapprovedItem.id } });
  });
});
