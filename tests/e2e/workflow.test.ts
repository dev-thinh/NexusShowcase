import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { saveShowcaseDraftAction, submitShowcaseForReviewAction } from '@/actions/showcase-actions';
import {
  archiveShowcaseAction,
  assignEditorAction,
  markReadyForApprovalAction,
  publishEditorialDraftAction,
  rejectShowcaseAction,
  reopenShowcaseAction,
  requestAuthorRevisionAction,
  resolveReviewCommentAction,
  returnToEditorAction,
  saveEditorialDraftAction,
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

const completeDraft = (title: string, summary: string, userId: string) => ({
  title,
  summary,
  content: 'Detailed academic content.',
  publishedYear: 2026,
  suggestedField: 'Computer Science',
  customProjectType: '',
  contributors: [
    {
      userId,
      role: 'PROJECT_LEAD' as const,
      displayOrder: 0,
    },
  ],
  resources: [],
});

describe('submission through publication workflow', () => {
  let admin: any;
  let editor: any;
  let author: any;
  let category: any;

  beforeAll(async () => {
    const suffix = Date.now();
    admin = await prisma.user.create({
      data: { email: `workflow-admin-${suffix}@nexus.test`, fullName: 'Workflow Admin', role: 'ADMIN' },
    });
    editor = await prisma.user.create({
      data: { email: `workflow-editor-${suffix}@nexus.test`, fullName: 'Workflow Editor', role: 'EDITOR' },
    });
    author = await prisma.user.create({
      data: { email: `workflow-author-${suffix}@nexus.test`, fullName: 'Workflow Author', role: 'CORE_MEMBER' },
    });
    category = await prisma.category.create({
      data: { name: `Workflow ${suffix}`, slug: `workflow-${suffix}` },
    });
  });

  afterAll(async () => {
    if (author) await prisma.showcaseItem.deleteMany({ where: { creatorId: author.id } });
    if (category) await prisma.category.deleteMany({ where: { id: category.id } });
    await prisma.user.deleteMany({
      where: { id: { in: [admin?.id, editor?.id, author?.id].filter(Boolean) } },
    });
  });

  it('preserves author revisions while editor and admin complete publication', async () => {
    currentUserMock.actor = author;
    const draft = await saveShowcaseDraftAction(
      null,
      completeDraft('Original research title', 'First immutable submission.', author.id)
    );
    expect(draft.success).toBe(true);
    if (!draft.success) return;

    expect(await submitShowcaseForReviewAction(draft.data.id)).toEqual({
      success: true,
      data: { status: 'PENDING_REVIEW', revisionNumber: 1 },
    });

    currentUserMock.actor = editor;
    expect((await assignEditorAction(draft.data.id, editor.id)).success).toBe(true);
    expect(
      (await saveEditorialDraftAction(draft.data.id, { title: 'Edited publication title' })).success
    ).toBe(true);
    expect(
      (
        await requestAuthorRevisionAction({
          itemId: draft.data.id,
          fieldKey: 'summary',
          reason: 'Clarify the results.',
        })
      ).success
    ).toBe(true);

    currentUserMock.actor = author;
    expect(
      (
        await saveShowcaseDraftAction(
          draft.data.id,
          completeDraft('Original research title', 'Second submission with clarified results.', author.id)
        )
      ).success
    ).toBe(true);
    expect(await submitShowcaseForReviewAction(draft.data.id)).toEqual({
      success: true,
      data: { status: 'PENDING_REVIEW', revisionNumber: 2 },
    });

    currentUserMock.actor = editor;
    const authorComment = await prisma.reviewComment.findFirst({
      where: { itemId: draft.data.id, audience: 'AUTHOR', status: 'OPEN' },
      select: { id: true },
    });
    expect(authorComment).not.toBeNull();
    expect((await resolveReviewCommentAction(authorComment!.id)).success).toBe(true);
    expect(
      (
        await markReadyForApprovalAction({
          itemId: draft.data.id,
          categoryId: category.id,
          checklist: { copyEdited: true, mediaChecked: true, metadataChecked: true },
        })
      ).success
    ).toBe(true);

    currentUserMock.actor = admin;
    expect((await returnToEditorAction(draft.data.id, 'Check the final abstract.')).success).toBe(true);

    const returnComment = await prisma.reviewComment.findFirst({
      where: { itemId: draft.data.id, body: 'Check the final abstract.' },
      select: { id: true },
    });
    expect(returnComment).not.toBeNull();

    currentUserMock.actor = editor;
    expect((await resolveReviewCommentAction(returnComment!.id)).success).toBe(true);
    expect(
      (
        await markReadyForApprovalAction({
          itemId: draft.data.id,
          categoryId: category.id,
          checklist: { copyEdited: true, mediaChecked: true, metadataChecked: true },
        })
      ).success
    ).toBe(true);
    expect(
      (
        await publishEditorialDraftAction({
          itemId: draft.data.id,
          checklist: { copyEdited: true, mediaChecked: true, metadataChecked: true },
          visibility: 'PRIVATE',
        })
      ).success
    ).toBe(false);

    currentUserMock.actor = admin;
    expect(
      (
        await publishEditorialDraftAction({
          itemId: draft.data.id,
          checklist: { copyEdited: true, mediaChecked: true, metadataChecked: true },
          visibility: 'PRIVATE',
        })
      ).success
    ).toBe(true);

    const published = await prisma.showcaseItem.findUnique({ where: { id: draft.data.id } });
    const revisions = await prisma.submissionRevision.findMany({
      where: { itemId: draft.data.id },
      orderBy: { revisionNumber: 'asc' },
    });
    expect(published?.title).toBe('Edited publication title');
    expect(published?.status).toBe('PUBLISHED');
    expect((revisions[0].snapshot as any).summary).toBe('First immutable submission.');
    expect((revisions[1].snapshot as any).summary).toBe('Second submission with clarified results.');

    expect((await archiveShowcaseAction(draft.data.id)).success).toBe(true);
  });

  it('keeps rejection distinct and requires an admin reopen before editing', async () => {
    currentUserMock.actor = author;
    const draft = await saveShowcaseDraftAction(
      null,
      completeDraft('Rejected workflow item', 'A complete submission for rejection.', author.id)
    );
    expect(draft.success).toBe(true);
    if (!draft.success) return;
    expect((await submitShowcaseForReviewAction(draft.data.id)).success).toBe(true);

    currentUserMock.actor = editor;
    expect((await assignEditorAction(draft.data.id, editor.id)).success).toBe(true);
    expect((await markReadyForApprovalAction({
      itemId: draft.data.id,
      categoryId: category.id,
      checklist: { copyEdited: true, mediaChecked: true, metadataChecked: true },
    })).success).toBe(true);

    currentUserMock.actor = admin;
    expect(
      (await rejectShowcaseAction({ itemId: draft.data.id, reason: 'Outside the publication scope.' })).success
    ).toBe(true);

    currentUserMock.actor = author;
    expect(
      (
        await saveShowcaseDraftAction(
          draft.data.id,
          completeDraft('Blocked edit', 'This edit must remain blocked.', author.id)
        )
      ).success
    ).toBe(false);

    currentUserMock.actor = admin;
    expect((await reopenShowcaseAction(draft.data.id)).success).toBe(true);
    currentUserMock.actor = author;
    expect(
      (
        await saveShowcaseDraftAction(
          draft.data.id,
          completeDraft('Reopened workflow item', 'Editing is available after reopen.', author.id)
        )
      ).success
    ).toBe(true);
  });
});
