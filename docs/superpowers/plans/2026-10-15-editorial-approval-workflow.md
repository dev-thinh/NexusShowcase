# Editorial Approval Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce the Author → Editor → Admin workflow, publish with an explicit internal/public choice, safely preview immutable author resources, and make the review workspace visually consistent with the author form.

**Architecture:** Keep immutable submission revisions as the source of authorship and editorial overrides as sparse publication metadata. Centralize status presentation, enforce role/state transitions in server actions, resolve contributor names without exposing IDs, and render resources through a read-only preview boundary. The review workspace composes focused source, publication, feedback, preview, and approval components using the existing panel/action tokens.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Prisma 6/PostgreSQL, Zod 3, Tailwind CSS, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-15-editorial-approval-workflow-design.md`

## Global Constraints

- Never render raw `ItemStatus` enum values in user-facing UI.
- Only the assigned Editor may edit/handoff/request author revision during `PENDING_REVIEW`.
- Admin approval controls are read-only and available only during `READY_FOR_APPROVAL`.
- Admin never sends author-facing feedback directly; return to Editor instead.
- Author resources are immutable and always flow from the selected submission snapshot into publication.
- Do not print local paths, object keys, or full storage URLs in resource cards.
- Publication writes `status` and `visibility` atomically; internal (`PRIVATE`) is the default.
- Reuse `panel-detail`, `panel-nested`, `action-primary-detail`, `action-secondary-detail`, and the author form's spacing/radius/control hierarchy.
- Do not add a UI library or storage dependency.
- Preserve all unrelated dirty-worktree changes and every untracked file under `public/uploads/`; never stage them.

---

### Task 1: Centralize localized status presentation

**Files:**
- Create: `src/lib/item-status-presentation.ts`
- Modify: `src/components/ui/badge.tsx`
- Modify: `src/components/editorial/review-workspace.tsx`
- Modify: `src/app/showcase/[slug]/page.tsx`
- Test: `tests/unit/item-status-presentation.test.ts`
- Modify: `tests/unit/dashboard-workflow.test.ts`
- Modify: `tests/unit/review-workspace.test.tsx`

**Interfaces:**
- Produces `ITEM_STATUS_LABELS: Record<ItemStatus, string>`.
- Produces `getItemStatusLabel(status: ItemStatus): string`.
- `StatusBadge` consumes the shared labels while retaining status-specific colors/icons.

- [ ] **Step 1: Write failing behavior tests**

```ts
import { ItemStatus } from '@prisma/client';
import { getItemStatusLabel } from '@/lib/item-status-presentation';

expect(getItemStatusLabel(ItemStatus.PENDING_REVIEW)).toBe('Chờ biên tập');
expect(getItemStatusLabel(ItemStatus.REVISION_REQUESTED)).toBe('Chờ tác giả bổ sung');
expect(getItemStatusLabel(ItemStatus.REJECTED)).toBe('Không được phê duyệt');
expect(getItemStatusLabel(ItemStatus.READY_FOR_APPROVAL)).toBe('Chờ phê duyệt');
```

Add source-boundary assertions that `review-workspace.tsx` and the showcase status banner call `StatusBadge` or `getItemStatusLabel` and never render `{item.status}`.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx vitest run tests/unit/item-status-presentation.test.ts tests/unit/dashboard-workflow.test.ts tests/unit/review-workspace.test.tsx`

Expected: FAIL because the shared presentation module does not exist and the workspace renders the raw enum.

- [ ] **Step 3: Implement the shared mapping**

```ts
export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  DRAFT: 'Bản nháp',
  PENDING_REVIEW: 'Chờ biên tập',
  REVISION_REQUESTED: 'Chờ tác giả bổ sung',
  READY_FOR_APPROVAL: 'Chờ phê duyệt',
  PUBLISHED: 'Đã xuất bản',
  REJECTED: 'Không được phê duyệt',
  ARCHIVED: 'Đã lưu trữ',
};

export const getItemStatusLabel = (status: ItemStatus) => ITEM_STATUS_LABELS[status];
```

Replace duplicated label strings and raw status output with this module. Keep database/action comparisons on enum values.

- [ ] **Step 4: Run tests and commit**

Run: `npx vitest run tests/unit/item-status-presentation.test.ts tests/unit/dashboard-workflow.test.ts tests/unit/review-workspace.test.tsx`

```bash
git add src/lib/item-status-presentation.ts src/components/ui/badge.tsx src/components/editorial/review-workspace.tsx src/app/showcase/[slug]/page.tsx tests/unit/item-status-presentation.test.ts tests/unit/dashboard-workflow.test.ts tests/unit/review-workspace.test.tsx
git commit -m "refactor(workflow): centralize status presentation"
```

### Task 2: Preserve contributor names and immutable resources in snapshots

**Files:**
- Modify: `src/lib/submission-types.ts`
- Modify: `src/lib/submission-snapshot.ts`
- Modify: `src/actions/showcase-actions.ts`
- Modify: `src/lib/action-schemas.ts`
- Modify: `tests/unit/submission-workflow.test.ts`
- Modify: `tests/unit/action-schemas.test.ts`
- Modify: `tests/integration/showcase-actions.test.ts`

**Interfaces:**
- Produces `SnapshotContributor` with optional `displayName?: string | null` for legacy JSON compatibility.
- `buildSubmissionSnapshot(source)` accepts contributor `displayName` and copies it into new snapshots.
- `EditorialOverrides` and `editorialDraftInputSchema` no longer include `resources`.
- `mergeEditorialOverrides` always returns cloned `snapshot.resources`.

- [ ] **Step 1: Write failing snapshot and schema tests**

```ts
const snapshot = buildSubmissionSnapshot({
  ...source,
  contributors: [{ ...author, userId: 'user-1', displayName: 'Nguyễn An' }],
});
expect(snapshot.contributors[0]).toMatchObject({ userId: 'user-1', displayName: 'Nguyễn An' });

const merged = mergeEditorialOverrides(snapshot, { title: 'Bản biên tập' });
expect(merged.resources).toEqual(snapshot.resources);
expect(editorialDraftInputSchema.safeParse({ resources: [] }).success).toBe(false);
```

Integration coverage must submit a revision and assert its JSON contains the member's current full name.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx vitest run tests/unit/submission-workflow.test.ts tests/unit/action-schemas.test.ts tests/integration/showcase-actions.test.ts`

Expected: FAIL because contributor names are absent and resources are accepted as overrides.

- [ ] **Step 3: Implement snapshot-safe contributor data**

```ts
export type SnapshotContributor = ContributorInput & {
  displayName?: string | null;
};

export interface SubmissionSnapshot {
  // existing scalar fields
  contributors: SnapshotContributor[];
  resources: SubmissionResource[];
}
```

When submission creates a revision, query contributor users in one `findMany({ where: { id: { in: userIds } } })`, map IDs to full names, then build the snapshot. Do not mutate historical revisions.

Remove `resources` from `EditorialOverrides`, the Zod editorial shape, and override merging. Publication resources must always be a clone of `snapshot.resources`.

- [ ] **Step 4: Run tests and commit**

Run: `npx vitest run tests/unit/submission-workflow.test.ts tests/unit/action-schemas.test.ts tests/integration/showcase-actions.test.ts`

```bash
git add src/lib/submission-types.ts src/lib/submission-snapshot.ts src/actions/showcase-actions.ts src/lib/action-schemas.ts tests/unit/submission-workflow.test.ts tests/unit/action-schemas.test.ts tests/integration/showcase-actions.test.ts
git commit -m "feat(workflow): preserve contributor names and source resources"
```

### Task 3: Enforce Editor and Admin state boundaries

**Files:**
- Modify: `src/actions/editorial-actions.ts`
- Modify: `src/lib/action-schemas.ts`
- Modify: `tests/integration/editorial-actions.test.ts`
- Modify: `tests/integration/action-authorization.test.ts`

**Interfaces:**
- Produces internal guard `getAssignedEditorForAction(itemId)` or equivalent query-based authorization.
- `saveEditorialDraftAction`, `addReviewCommentAction`, `resolveReviewCommentAction`, `requestAuthorRevisionAction`, and `markReadyForApprovalAction` enforce role/status/assignment.
- `returnToEditorAction`, `rejectShowcaseAction`, and publication accept Admin only in `READY_FOR_APPROVAL`.

- [ ] **Step 1: Write failing authorization matrix tests**

Cover these literal outcomes:

```ts
expect(await asAdmin(markReadyForApprovalAction(input))).toMatchObject({ success: false });
expect(await asUnassignedEditor(saveEditorialDraftAction(itemId, overrides))).toMatchObject({ success: false });
expect(await asAdmin(requestAuthorRevisionAction(input))).toMatchObject({ success: false });
expect(await asEditor(returnToEditorAction(input))).toMatchObject({ success: false });
expect(await asAdmin(rejectShowcaseAction(pendingReviewInput))).toMatchObject({ success: false });
```

Also assert the assigned Editor succeeds in `PENDING_REVIEW`, and Admin return/reject succeeds in `READY_FOR_APPROVAL` with audit events.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx vitest run tests/integration/editorial-actions.test.ts tests/integration/action-authorization.test.ts`

- [ ] **Step 3: Implement server-side guards**

Every write loads `status` and `editorialDraft.assignedEditorId`. Editor writes require:

```ts
actor.role === 'EDITOR' &&
item.status === 'PENDING_REVIEW' &&
item.editorialDraft?.assignedEditorId === actor.id
```

Admin final actions require `actor.role === 'ADMIN' && item.status === 'READY_FOR_APPROVAL'`. Restrict `addReviewCommentAction` to the assigned Editor in editorial review. Resolve actions follow the same ownership/state boundary. Keep `assignEditorAction` available to Admin and self-assignment available to Editor as already defined.

- [ ] **Step 4: Run tests and commit**

Run: `npx vitest run tests/integration/editorial-actions.test.ts tests/integration/action-authorization.test.ts`

```bash
git add src/actions/editorial-actions.ts src/lib/action-schemas.ts tests/integration/editorial-actions.test.ts tests/integration/action-authorization.test.ts
git commit -m "fix(workflow): enforce editorial approval boundaries"
```

### Task 4: Publish atomically with internal or public visibility

**Files:**
- Modify: `src/lib/action-schemas.ts`
- Modify: `src/actions/editorial-actions.ts`
- Modify: `src/components/editorial/review-workspace.tsx`
- Modify: `tests/unit/action-schemas.test.ts`
- Modify: `tests/unit/review-workspace.test.tsx`
- Modify: `tests/integration/editorial-actions.test.ts`

**Interfaces:**
- `publishEditorialDraftInputSchema` accepts `{ itemId, checklist, visibility: 'PRIVATE' | 'PUBLIC' }`.
- `publishEditorialDraftAction` returns `{ status: 'PUBLISHED'; visibility: ItemVisibility }`.
- Approval UI defaults to `PRIVATE` and passes the explicit selection.

- [ ] **Step 1: Write failing publication tests**

```ts
expect(publishEditorialDraftInputSchema.safeParse({ itemId, checklist }).success).toBe(false);
expect(publishEditorialDraftInputSchema.parse({ itemId, checklist, visibility: 'PRIVATE' }).visibility).toBe('PRIVATE');
```

Integration tests publish two separate ready items and assert one persists `PRIVATE`, the other `PUBLIC`; both audit events include the chosen visibility. Unit tests assert the Admin UI contains the Vietnamese options `Nội bộ` and `Công khai`, with `PRIVATE` as initial state.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx vitest run tests/unit/action-schemas.test.ts tests/unit/review-workspace.test.tsx tests/integration/editorial-actions.test.ts`

- [ ] **Step 3: Implement visibility selection and persistence**

Add a compact radio group or select beside the Admin publish action. The publish transaction update includes:

```ts
data: {
  // effective publication fields
  status: 'PUBLISHED',
  visibility: parsed.data.visibility,
  publishedAt,
}
```

Record `visibility` in `PUBLISHED` audit metadata. Continue using the conditional `updateMany` on `READY_FOR_APPROVAL` to reject races.

- [ ] **Step 4: Run tests and commit**

Run: `npx vitest run tests/unit/action-schemas.test.ts tests/unit/review-workspace.test.tsx tests/integration/editorial-actions.test.ts`

```bash
git add src/lib/action-schemas.ts src/actions/editorial-actions.ts src/components/editorial/review-workspace.tsx tests/unit/action-schemas.test.ts tests/unit/review-workspace.test.tsx tests/integration/editorial-actions.test.ts
git commit -m "feat(editorial): choose publication visibility"
```

### Task 5: Resolve legacy contributor names and add safe resource preview

**Files:**
- Modify: `src/app/admin/reviews/[id]/page.tsx`
- Modify: `src/components/editorial/source-revision-view.tsx`
- Create: `src/components/editorial/resource-preview-modal.tsx`
- Create: `src/lib/resource-presentation.ts`
- Modify: `src/components/ui/modal.tsx` only if the existing API lacks the required accessible title/close behavior
- Modify: `tests/unit/review-workspace.test.tsx`
- Create: `tests/unit/resource-presentation.test.ts`

**Interfaces:**
- Produces `formatResourceMetadata(resource): { primary: string; secondary: string; preview: 'image' | 'pdf' | 'link' | 'download' }`.
- `SourceRevisionView` receives `memberNamesById: Record<string, string>` and never renders a user ID.
- `ResourcePreviewModal` consumes `{ resource: SubmissionResource | null; onClose(): void }`.
- `SourceRevisionView` receives the existing comment callbacks and renders `FieldReviewComments` with `fieldKey="resources"` beneath the immutable resource list when the assigned Editor can edit.

- [ ] **Step 1: Write failing formatter and component tests**

```ts
expect(formatResourceMetadata({ kind: 'DOCUMENT', label: 'Báo cáo', url: '/uploads/a.pdf', fileName: 'a.pdf', fileSize: 2048 }))
  .toEqual({ primary: 'Báo cáo', secondary: 'a.pdf · PDF · 2 KB', preview: 'pdf' });
expect(formatResourceMetadata({ kind: 'LINK', label: 'Mã nguồn', url: 'https://github.com/org/repo' }).secondary)
  .toBe('github.com');
```

Assert rendered source markup contains `memberNamesById[contrib.userId]`, no fallback `{contrib.userId}`, no visible `{res.url}`, a `Xem tài nguyên` button with an accessible label, and resource feedback wired to `fieldKey="resources"`.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx vitest run tests/unit/resource-presentation.test.ts tests/unit/review-workspace.test.tsx`

- [ ] **Step 3: Implement batched legacy name resolution**

In the server route, collect unique user IDs from all displayed revision snapshots, fetch active or inactive matching users once, and pass `Object.fromEntries(users.map(user => [user.id, user.fullName]))`. Source display order is:

```ts
contrib.externalName ?? contrib.displayName ?? memberNamesById[contrib.userId ?? ''] ?? 'Thành viên'
```

- [ ] **Step 4: Implement safe metadata and modal preview**

Use the actual resource URL only in media delivery attributes, never visible text. Modal behavior:

- image: `<img src={resource.url} alt={resource.label} />`;
- PDF: `<iframe src={resource.url} title={`Xem ${resource.label}`} />`;
- link: hostname plus an external `<a target="_blank" rel="noreferrer">`;
- fallback: download/open action.

Use an accessible dialog title, close button, backdrop dismissal, `Escape`, and focus restoration. Reuse the existing modal primitive when possible.

Pass comments and comment callbacks from `ReviewWorkspace` to the source view. Only the assigned Editor in `PENDING_REVIEW` receives `onAddComment`/`onResolveComment`; Admin approval receives the comments without write callbacks.

- [ ] **Step 5: Run tests and commit**

Run: `npx vitest run tests/unit/resource-presentation.test.ts tests/unit/review-workspace.test.tsx`

```bash
git add src/app/admin/reviews/[id]/page.tsx src/components/editorial/source-revision-view.tsx src/components/editorial/resource-preview-modal.tsx src/lib/resource-presentation.ts src/components/ui/modal.tsx tests/unit/review-workspace.test.tsx tests/unit/resource-presentation.test.ts
git commit -m "feat(editorial): preview immutable author resources"
```

### Task 6: Align the review workspace and role-specific controls

**Files:**
- Modify: `src/components/editorial/review-workspace.tsx`
- Modify: `src/components/editorial/editorial-fields.tsx`
- Modify: `src/components/editorial/field-review-comments.tsx`
- Modify: `src/components/editorial/review-checklist.tsx`
- Modify: `src/components/editorial/source-revision-view.tsx`
- Modify: `tests/unit/review-workspace.test.tsx`
- Modify: `tests/unit/form-panel-consistency.test.ts`

**Interfaces:**
- `ReviewWorkspace` derives `canEdit = role === 'EDITOR' && status === 'PENDING_REVIEW' && assignedEditorId === user.id`.
- `isApproval = role === 'ADMIN' && status === 'READY_FOR_APPROVAL'` drives read-only final controls.
- Field override affordance is exactly `Khôi phục bản gốc`; no edited badge remains.

- [ ] **Step 1: Write failing UI-state and consistency tests**

Assert:

```ts
expect(fields).not.toContain('Đã biên tập');
expect(fields).toContain('Khôi phục bản gốc');
expect(workspace).toContain('panel-detail');
expect(sourceView).toContain('panel-nested');
expect(workspace).toContain('action-primary-detail');
expect(workspace).toContain('action-secondary-detail');
```

Render role/status combinations and assert Editor controls exist only for assigned `PENDING_REVIEW`; Admin sees only visibility/publish/return/reject in `READY_FOR_APPROVAL`; Admin never sees `Yêu cầu bổ sung`.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx vitest run tests/unit/review-workspace.test.tsx tests/unit/form-panel-consistency.test.ts`

- [ ] **Step 3: Apply shared visual tokens**

Replace ad-hoc `rounded`, `p-6`, button color blocks, and field borders with the same hierarchy used by submission components. Keep the source/publication 40/60 grid, but wrap it in `panel-detail max-w-6xl overflow-hidden !p-0`, use responsive `p-6 sm:p-8`, and use `panel-nested` only for actual nested groups.

- [ ] **Step 4: Simplify overrides and gate controls**

Remove every `Đã biên tập` span. Use `Khôi phục bản gốc` for title, summary, content, category, type, year, tags, issuer, and thumbnail whenever the corresponding override is defined. Disable all editorial inputs/checklist/comment actions outside `canEdit`. Replace the common action bar with explicit Editor and Admin branches.

- [ ] **Step 5: Run tests and commit**

Run: `npx vitest run tests/unit/review-workspace.test.tsx tests/unit/form-panel-consistency.test.ts`

```bash
git add src/components/editorial/review-workspace.tsx src/components/editorial/editorial-fields.tsx src/components/editorial/field-review-comments.tsx src/components/editorial/review-checklist.tsx src/components/editorial/source-revision-view.tsx tests/unit/review-workspace.test.tsx tests/unit/form-panel-consistency.test.ts
git commit -m "refactor(editorial): align review workspace and permissions"
```

### Task 7: Verify the complete workflow and document it

**Files:**
- Modify: `tests/e2e/workflow.test.ts`
- Modify: `tests/integration/editorial-actions.test.ts`
- Modify: `tests/integration/public-data-boundary.test.ts`
- Modify: `README.md`

**Interfaces:**
- Verifies the final role/state matrix, immutable resources, localized statuses, and both publication visibility outcomes.

- [ ] **Step 1: Extend end-to-end coverage**

Add scenarios for:

1. Author submits a revision containing a club member and PDF.
2. Assigned Editor sees the member name, previews the PDF, edits publication fields, adds author feedback, receives a revision, and hands off.
3. Admin cannot edit or contact the author, returns the draft to Editor, then later publishes internally.
4. A second ready item publishes publicly.
5. Published resources exactly equal the selected immutable snapshot resources.
6. User-facing pages contain localized status labels and no raw enum tokens.

- [ ] **Step 2: Run focused workflow suites**

Run: `npx vitest run tests/integration/editorial-actions.test.ts tests/integration/public-data-boundary.test.ts tests/e2e/workflow.test.ts`

Expected: all pass; failures must be fixed in the owning task's code, not weakened in the scenario.

- [ ] **Step 3: Update workflow documentation**

Document the Author → Editor → Admin state diagram, assigned-editor boundary, Admin internal/public decision, immutable resource policy, and Vietnamese status labels. State that Admin returns to Editor rather than contacting the author.

- [ ] **Step 4: Run full verification**

Run sequentially:

```bash
npm run test:unit
npm run test:integration
npx vitest run tests/e2e/workflow.test.ts
npx tsc --noEmit
npm run build
git diff --check
git status --short
```

Expected: every command exits 0. Confirm all existing and newly created `public/uploads/**` files remain untracked and unstaged.

- [ ] **Step 5: Commit verification and documentation**

```bash
git add README.md tests/e2e/workflow.test.ts tests/integration/editorial-actions.test.ts tests/integration/public-data-boundary.test.ts
git commit -m "test(workflow): cover editorial approval boundaries"
```
