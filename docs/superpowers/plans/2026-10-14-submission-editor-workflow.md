# Submission and Editorial Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the monolithic submission form and direct-admin review flow with a concise academic submission editor, immutable submission revisions, a separate editorial draft, field-level feedback, and final admin approval.

**Architecture:** `ShowcaseItem` remains the canonical draft/public record. Every member submission creates an immutable JSON snapshot; editor changes live as typed JSON overrides until admin atomically materializes the effective publication into `ShowcaseItem`. The member editor and review workspace are continuous document-style surfaces composed from focused components, with no card-per-section layout.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Prisma 6/PostgreSQL, Zod 3, Tailwind CSS, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-14-submission-editor-workflow-design.md`

## Global Constraints

- Keep one continuous white document surface; separate sections with typography, spacing, and thin rules, not nested cards.
- Labels use sentence case; no emoji, marketplace-style microcopy, oversized radii, or decorative section icons.
- Member draft requires only a title; review submission requires title, summary, and at least one contributor.
- Members never assign the official category or public layout. EDITOR or ADMIN assigns publication metadata.
- EDITOR prepares and hands off; only ADMIN publishes, rejects, reopens, or archives.
- Preserve the immutable member submission and audit sensitive/editorial actions.
- `REVISION_REQUESTED` and `REJECTED` remain distinct.
- Do not add a form library or state-management dependency; use Zod, React state/reducer, and server actions already present.
- Preserve current public URLs and render published content from `ShowcaseItem`.
- Do not add or commit `public/uploads/thumbnails/8a17a862-d811-4be2-959f-ab1c2ee03694.png`.

---

## Phase 1: Domain and workflow foundation

### Task 1: Add editorial roles, states, and persistence models

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20261014_submission_editor_workflow/migration.sql`
- Modify: `tests/unit/prisma-schema-types.test.ts`
- Modify: `tests/integration/prisma-schema.test.ts`

**Interfaces:**
- Produces Prisma enums `Role.EDITOR`, `ItemStatus.REVISION_REQUESTED`, `ItemStatus.READY_FOR_APPROVAL`, `ItemStatus.ARCHIVED`, `ReviewAudience`, `ReviewSeverity`, and `ReviewCommentStatus`.
- Produces models `SubmissionRevision`, `EditorialDraft`, `ReviewComment`, and `AuditEvent` with relations to `ShowcaseItem` and `User`.

- [x] **Step 1: Write failing schema tests**

Assert that `schema.prisma` declares the new enum members and models, and add an integration test that creates an item with one revision, editorial draft, comment, and audit event.

```ts
expect(schema).toContain('EDITOR');
expect(schema).toContain('REVISION_REQUESTED');
expect(schema).toContain('READY_FOR_APPROVAL');
expect(schema).toContain('model SubmissionRevision');
expect(schema).toContain('model EditorialDraft');
expect(schema).toContain('model ReviewComment');
expect(schema).toContain('model AuditEvent');
```

- [x] **Step 2: Run tests and verify RED**

Run: `npx vitest run tests/unit/prisma-schema-types.test.ts tests/integration/prisma-schema.test.ts`

Expected: FAIL because the enums and models do not exist.

- [x] **Step 3: Extend the Prisma schema and migration**

Use JSON columns for immutable snapshots and sparse editorial overrides:

```prisma
model SubmissionRevision {
  id             String       @id @default(cuid())
  itemId         String
  revisionNumber Int
  snapshot       Json
  submittedById  String
  submittedAt    DateTime     @default(now())
  item           ShowcaseItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  submittedBy    User         @relation("SubmittedRevisions", fields: [submittedById], references: [id], onDelete: Restrict)
  comments       ReviewComment[]
  @@unique([itemId, revisionNumber])
  @@index([itemId, submittedAt])
  @@map("submission_revisions")
}

model EditorialDraft {
  id               String       @id @default(cuid())
  itemId           String       @unique
  assignedEditorId String?
  overrides        Json
  checklist        Json         @default("{}")
  completedAt      DateTime?
  updatedAt        DateTime     @updatedAt
  item             ShowcaseItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  assignedEditor   User?        @relation("AssignedEditorialDrafts", fields: [assignedEditorId], references: [id], onDelete: SetNull)
  @@map("editorial_drafts")
}
```

Add the review and audit records explicitly:

```prisma
enum ReviewAudience { EDITORIAL AUTHOR }
enum ReviewSeverity { REQUIRED SUGGESTION }
enum ReviewCommentStatus { OPEN RESOLVED }

model ReviewComment {
  id           String              @id @default(cuid())
  itemId       String
  revisionId   String?
  fieldKey     String
  body         String
  audience     ReviewAudience
  severity     ReviewSeverity
  status       ReviewCommentStatus @default(OPEN)
  authorId     String
  resolvedById String?
  createdAt    DateTime            @default(now())
  resolvedAt   DateTime?
  item         ShowcaseItem        @relation(fields: [itemId], references: [id], onDelete: Cascade)
  revision     SubmissionRevision? @relation(fields: [revisionId], references: [id], onDelete: SetNull)
  author       User                @relation("AuthoredReviewComments", fields: [authorId], references: [id], onDelete: Restrict)
  resolvedBy   User?               @relation("ResolvedReviewComments", fields: [resolvedById], references: [id], onDelete: SetNull)
  @@index([itemId, audience, status])
  @@map("review_comments")
}

model AuditEvent {
  id        String       @id @default(cuid())
  itemId    String
  actorId   String
  action    String
  metadata  Json         @default("{}")
  createdAt DateTime     @default(now())
  item      ShowcaseItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  actor     User         @relation("ItemAuditEvents", fields: [actorId], references: [id], onDelete: Restrict)
  @@index([itemId, createdAt])
  @@map("audit_events")
}
```

Add the named reverse relations on `User` and collections on `ShowcaseItem`. The SQL migration must preserve existing `REJECTED` values and add enum values without dropping data.

Also add member-provided classification hints to `ShowcaseItem` and make the pre-editor type safely default to `PROJECT`:

```prisma
type              ItemType @default(PROJECT)
suggestedField    String?
customProjectType String?
```

- [x] **Step 4: Generate Prisma Client and apply to the test database**

Run: `npx prisma generate`

Run against the configured safe test database: `npx prisma migrate deploy`

Expected: client generation and migration complete successfully.

- [x] **Step 5: Run tests and commit**

Run: `npx vitest run tests/unit/prisma-schema-types.test.ts tests/integration/prisma-schema.test.ts`

```bash
git add prisma/schema.prisma prisma/migrations/20261014_submission_editor_workflow tests/unit/prisma-schema-types.test.ts tests/integration/prisma-schema.test.ts
git commit -m "feat(workflow): add editorial persistence models"
```

### Task 2: Define permissions and typed workflow data

**Files:**
- Modify: `src/lib/permissions.ts`
- Create: `src/lib/submission-types.ts`
- Create: `src/lib/submission-snapshot.ts`
- Create: `tests/unit/submission-workflow.test.ts`
- Modify: `tests/unit/permissions.test.ts`

**Interfaces:**
- Produces `canUserEditPublication(user)`, `canUserPublish(user)`, and updated `canUserReview(user)`.
- Produces `SubmissionSnapshot`, `EditorialOverrides`, `EffectivePublication`, `buildSubmissionSnapshot(item)`, and `mergeEditorialOverrides(snapshot, overrides)`.

- [x] **Step 1: Write failing permission and merge tests**

Cover EDITOR access, ADMIN-only publishing, sparse override fallback, and preservation of nested contributor/resource arrays.

```ts
expect(canUserEditPublication({ role: 'EDITOR' })).toBe(true);
expect(canUserPublish({ role: 'EDITOR' })).toBe(false);
expect(canUserPublish({ role: 'ADMIN' })).toBe(true);
expect(mergeEditorialOverrides(snapshot, { title: 'Bản biên tập' }).summary)
  .toBe(snapshot.summary);
```

- [x] **Step 2: Run tests and verify RED**

Run: `npx vitest run tests/unit/permissions.test.ts tests/unit/submission-workflow.test.ts`

- [x] **Step 3: Implement typed helpers**

Define the snapshot as plain JSON-safe values, never Prisma objects:

```ts
export interface SubmissionSnapshot {
  title: string;
  summary: string;
  content: string;
  publishedYear: number;
  suggestedField: string;
  customProjectType: string;
  contributors: ContributorInput[];
  resources: SubmissionResource[];
}

export interface EditorialOverrides {
  title?: string;
  summary?: string;
  content?: string;
  thumbnailUrl?: string | null;
  type?: ItemType;
  categoryId?: string | null;
  tags?: string[];
  issuer?: string | null;
  publishedYear?: number;
  resources?: SubmissionResource[];
}
```

Use explicit property selection in `buildSubmissionSnapshot`; do not serialize a Prisma model wholesale.

- [x] **Step 4: Run tests and commit**

Run: `npx vitest run tests/unit/permissions.test.ts tests/unit/submission-workflow.test.ts`

```bash
git add src/lib/permissions.ts src/lib/submission-types.ts src/lib/submission-snapshot.ts tests/unit/permissions.test.ts tests/unit/submission-workflow.test.ts
git commit -m "feat(workflow): define editorial permissions and snapshots"
```

### Task 3: Split draft validation from submission validation

**Files:**
- Modify: `src/lib/action-schemas.ts`
- Modify: `tests/unit/action-schemas.test.ts`

**Interfaces:**
- Produces `showcaseDraftInputSchema`, `showcaseSubmissionInputSchema`, `editorialDraftInputSchema`, `reviewCommentInputSchema`, and their inferred input types.
- Draft input accepts `summary: ''`; submission input requires non-empty summary and at least one contributor.

- [x] **Step 1: Write failing validation tests**

```ts
expect(showcaseDraftInputSchema.safeParse({ ...base, title: 'Bản nháp', summary: '', contributors: [] }).success).toBe(true);
expect(showcaseSubmissionInputSchema.safeParse({ ...base, title: 'Bản gửi', summary: '', contributors: [] }).success).toBe(false);
expect(showcaseSubmissionInputSchema.safeParse({ ...base, summary: 'Tóm tắt', contributors: [author] }).success).toBe(true);
```

Also test safe HTTP URLs, maximum resource counts, `customProjectType` length 100, allowed field keys, and non-empty rejection/revision reasons.

- [x] **Step 2: Run test and verify RED**

Run: `npx vitest run tests/unit/action-schemas.test.ts`

- [x] **Step 3: Implement schemas with shared fields**

Build a shared object shape, then apply distinct refinements for draft, submission, editorial handoff, author revision, rejection, and publishing. Return flattened field errors from callers rather than the current generic `Invalid input.` response.

- [x] **Step 4: Run test and commit**

Run: `npx vitest run tests/unit/action-schemas.test.ts`

```bash
git add src/lib/action-schemas.ts tests/unit/action-schemas.test.ts
git commit -m "feat(workflow): separate draft and submission validation"
```

### Task 4: Implement state transitions and immutable revisions

**Files:**
- Modify: `src/actions/showcase-actions.ts`
- Create: `src/actions/editorial-actions.ts`
- Modify: `tests/integration/showcase-actions.test.ts`
- Modify: `tests/integration/action-authorization.test.ts`

**Interfaces:**
- Produces `saveShowcaseDraftAction(itemId: string | null, input: ShowcaseDraftInput)`.
- Produces `submitShowcaseForReviewAction(itemId: string)`.
- Produces `requestAuthorRevisionAction(input)`, `rejectShowcaseAction(input)`, `reopenShowcaseAction(itemId)`, and `archiveShowcaseAction(itemId)`.

- [x] **Step 1: Write failing transition tests**

Cover:

- CORE_MEMBER saves title-only draft.
- Submission validation creates revision 1 and moves to `PENDING_REVIEW`.
- Resubmission creates revision 2 without mutating revision 1.
- `REVISION_REQUESTED` can be edited and resubmitted.
- `REJECTED` cannot be edited until ADMIN reopens it.
- EDITOR cannot publish/reject/reopen/archive.
- ADMIN cannot publish directly from `PENDING_REVIEW`.

- [x] **Step 2: Run tests and verify RED**

Run: `npx vitest run tests/integration/showcase-actions.test.ts tests/integration/action-authorization.test.ts`

- [x] **Step 3: Implement transitions as transactions**

Submission must calculate the next revision number and create the snapshot in the same transaction as the status update. Every transition creates an `AuditEvent`. Return this result shape consistently:

```ts
type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
```

Keep compatibility wrappers for old action exports until the member form and admin review UI are migrated in later tasks.

- [x] **Step 4: Run tests and commit**

Run: `npx vitest run tests/integration/showcase-actions.test.ts tests/integration/action-authorization.test.ts`

```bash
git add src/actions/showcase-actions.ts src/actions/editorial-actions.ts tests/integration/showcase-actions.test.ts tests/integration/action-authorization.test.ts
git commit -m "feat(workflow): enforce submission state transitions"
```

---

## Phase 2: Concise member submission editor

### Task 5: Build the member editor state and field primitives

**Files:**
- Create: `src/components/submission/submission-editor.tsx`
- Create: `src/components/submission/basic-information-fields.tsx`
- Create: `src/components/submission/submission-action-bar.tsx`
- Create: `src/components/submission/use-submission-editor.ts`
- Create: `tests/unit/submission-editor.test.tsx`

**Interfaces:**
- Produces `SubmissionEditorProps` with `initialData`, `currentUser`, `clubMembers`, and `mode: 'create' | 'edit'`.
- Produces a reducer/controller exposing `state`, `updateField`, `saveDraft`, `submitForReview`, `fieldErrors`, `saveState`, and `isDirty`.

- [x] **Step 1: Write failing component tests**

Render the editor and assert a single continuous form, three section headings, sentence-case labels, title-only draft save, field-level error association, and sticky action labels. Assert absence of `panel-operational`, numbered section headings, category controls, layout terminology, and emoji options.

- [x] **Step 2: Run test and verify RED**

Run: `npx vitest run tests/unit/submission-editor.test.tsx`

- [x] **Step 3: Implement the shell and basic fields**

Use a plain `<form>` with `max-w-4xl`, `divide-y divide-slate-200`, and section padding. Inputs receive stable ids, labels use `htmlFor`, and errors use `aria-describedby`. Keep official category/type fields out of this UI; expose only optional `suggestedField` and conditional `customProjectType`.

- [x] **Step 4: Implement save state and navigation guard**

Use `beforeunload` only while dirty, with effect cleanup. The action bar displays `Chưa lưu`, `Đang lưu…`, `Đã lưu`, or `Lưu thất bại`; on mobile it returns to normal document flow instead of covering fields.

- [x] **Step 5: Run test and commit**

Run: `npx vitest run tests/unit/submission-editor.test.tsx`

```bash
git add src/components/submission tests/unit/submission-editor.test.tsx
git commit -m "feat(submission): add concise academic editor shell"
```

### Task 6: Add contributors and progressive resources

**Files:**
- Create: `src/components/submission/contributor-editor.tsx`
- Create: `src/components/submission/resource-editor.tsx`
- Create: `src/components/submission/optional-details.tsx`
- Modify: `src/components/submission/submission-editor.tsx`
- Modify: `tests/unit/submission-editor.test.tsx`
- Modify: `tests/unit/upload.test.ts`

**Interfaces:**
- `ContributorEditor` consumes and emits `ContributorInput[]`.
- `ResourceEditor` consumes and emits `SubmissionResource[]` and adapts image, PDF, and link resources to existing upload actions.

- [x] **Step 1: Write failing interaction tests**

Cover default current-user contributor, member search/add, external contributor, optional role detail, one empty-free resource list, “Thêm tài nguyên” type selection, keyboard-accessible upload, remove action labels, and the optional details disclosure.

- [x] **Step 2: Run tests and verify RED**

Run: `npx vitest run tests/unit/submission-editor.test.tsx tests/unit/upload.test.ts`

- [x] **Step 3: Implement contributors as compact rows**

Do not wrap each person in a card. Use rows separated by `border-t`, 40–44px icon controls with `aria-label`, and show advanced academic roles only after “Vai trò chi tiết” is enabled.

- [x] **Step 4: Implement progressive resources**

The add menu creates exactly one resource row of the selected type. Reuse `uploadFileAction`; expose progress/error text and never make a clickable `div` the only upload control. Keep raw Google Drive and extended Markdown fields in `OptionalDetails`.

- [x] **Step 5: Run tests and commit**

Run: `npx vitest run tests/unit/submission-editor.test.tsx tests/unit/upload.test.ts`

```bash
git add src/components/submission tests/unit/submission-editor.test.tsx tests/unit/upload.test.ts
git commit -m "feat(submission): add contributors and progressive resources"
```

### Task 7: Replace create/edit routes and retire the monolith

**Files:**
- Modify: `src/app/dashboard/items/new/page.tsx`
- Modify: `src/app/dashboard/items/[id]/edit/page.tsx`
- Delete: `src/components/item-form.tsx`
- Modify: `tests/unit/item-form.test.ts`
- Modify: `tests/unit/showcase-edit.test.ts`
- Modify: `tests/unit/form-panel-consistency.test.ts`
- Modify: `tests/unit/heading-gutter.test.ts`

**Interfaces:**
- Routes render `SubmissionEditor` and load only member-facing data.
- Existing draft records are adapted through one mapper in `submission-types.ts`.

- [x] **Step 1: Update route tests first**

Assert both routes use `SubmissionEditor`, the member form does not fetch categories, create/edit share the same document width, and pending/published/rejected edit guards follow the approved state rules.

- [x] **Step 2: Run tests and verify RED**

Run: `npx vitest run tests/unit/item-form.test.ts tests/unit/showcase-edit.test.ts tests/unit/form-panel-consistency.test.ts tests/unit/heading-gutter.test.ts`

- [x] **Step 3: Integrate routes and remove ItemForm**

Preserve navbar/footer, existing authentication, `mustChangePassword`, and ownership checks. Replace the old `max-w-5xl` panel wrapper with the continuous editor shell. Delete obsolete source assertions rather than preserving implementation-detail tests for the removed component.

- [x] **Step 4: Run member workflow tests and commit**

Run: `npx vitest run tests/unit/item-form.test.ts tests/unit/showcase-edit.test.ts tests/unit/form-panel-consistency.test.ts tests/integration/showcase-actions.test.ts`

```bash
git add src/app/dashboard/items src/components/item-form.tsx src/components/submission src/lib/submission-types.ts tests/unit tests/integration/showcase-actions.test.ts
git commit -m "refactor(submission): replace monolithic item form"
```

### Task 8: Update dashboard statuses and revision feedback

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Create: `src/components/submission/review-comments.tsx`
- Modify: `src/app/dashboard/items/[id]/edit/page.tsx`
- Create: `tests/unit/dashboard-workflow.test.ts`

**Interfaces:**
- Produces member-facing status labels for all six statuses.
- `ReviewComments` renders only `AUTHOR_REVISION` comments beside matching fields/sections.

- [x] **Step 1: Write failing dashboard tests**

Test labels/actions for DRAFT, PENDING_REVIEW, REVISION_REQUESTED, READY_FOR_APPROVAL, REJECTED, PUBLISHED, and ARCHIVED. Verify rejected items are read-only and revision-requested items show field comments.

- [x] **Step 2: Run test and verify RED**

Run: `npx vitest run tests/unit/dashboard-workflow.test.ts`

- [x] **Step 3: Implement compact status treatment**

Use text/badge status within existing rows; do not create status cards. Map comments by `fieldKey`, connect them with `aria-describedby`, and hide `EDITORIAL` comments from member routes.

- [x] **Step 4: Run tests and commit**

Run: `npx vitest run tests/unit/dashboard-workflow.test.ts tests/unit/showcase-edit.test.ts`

```bash
git add src/app/dashboard src/components/submission/review-comments.tsx tests/unit/dashboard-workflow.test.ts tests/unit/showcase-edit.test.ts
git commit -m "feat(submission): show workflow states and author feedback"
```

---

## Phase 3: Editorial workspace and final approval

### Task 9: Implement editorial assignment, overrides, comments, and handoff

**Files:**
- Modify: `src/actions/editorial-actions.ts`
- Modify: `src/lib/action-schemas.ts`
- Create: `tests/integration/editorial-actions.test.ts`

**Interfaces:**
- Produces `assignEditorAction(itemId, editorId?)`.
- Produces `saveEditorialDraftAction(itemId, overrides)`.
- Produces `addReviewCommentAction(input)` and `resolveReviewCommentAction(commentId)`.
- Produces `markReadyForApprovalAction(itemId)` and `returnToEditorAction(itemId, message)`.

- [x] **Step 1: Write failing authorization and lifecycle tests**

Test EDITOR/ADMIN editing rights, ADMIN-only return action, immutable source revision, sparse override persistence, audience visibility, required checklist/category before handoff, and audit events.

- [x] **Step 2: Run test and verify RED**

Run: `npx vitest run tests/integration/editorial-actions.test.ts`

- [x] **Step 3: Implement actions transactionally**

Use `mergeEditorialOverrides` only for previews and publication; never copy overrides into the member snapshot. Returning to editor moves `READY_FOR_APPROVAL` to `PENDING_REVIEW` and creates an `EDITORIAL` comment. Requesting author revision creates `AUTHOR_REVISION` comments and moves the item to `REVISION_REQUESTED`.

- [x] **Step 4: Run tests and commit**

Run: `npx vitest run tests/integration/editorial-actions.test.ts tests/integration/action-authorization.test.ts`

```bash
git add src/actions/editorial-actions.ts src/lib/action-schemas.ts tests/integration/editorial-actions.test.ts tests/integration/action-authorization.test.ts
git commit -m "feat(editorial): add assignment feedback and handoff actions"
```

### Task 10: Build the continuous two-column review workspace

**Files:**
- Create: `src/app/admin/reviews/[id]/page.tsx`
- Create: `src/app/admin/reviews/[id]/preview/page.tsx`
- Create: `src/components/editorial/review-workspace.tsx`
- Create: `src/components/editorial/source-revision-view.tsx`
- Create: `src/components/editorial/editorial-fields.tsx`
- Create: `src/components/editorial/review-checklist.tsx`
- Create: `src/components/editorial/field-review-comments.tsx`
- Create: `tests/unit/review-workspace.test.tsx`

**Interfaces:**
- `ReviewWorkspace` receives the item, latest revision, revision list, editorial draft, categories, comments, current actor, and preview URL.
- Child components emit typed override/comment/checklist events through callbacks owned by the workspace.

- [x] **Step 1: Write failing layout and accessibility tests**

Assert a 40/60 desktop grid with one vertical divider, mobile source/publication tabs, no card-per-field classes, original values read-only, edited markers, per-field restore, category required, compact checklist, and role-specific actions.

- [x] **Step 2: Run test and verify RED**

Run: `npx vitest run tests/unit/review-workspace.test.tsx`

- [x] **Step 3: Implement the server route**

Authorize EDITOR or ADMIN, fetch all workspace data in parallel where independent, reject missing items, and avoid exposing internal comments on public/member routes.

The preview route must render `mergeEditorialOverrides(latestRevision.snapshot, editorialDraft.overrides)` and must never be accessible to an unrelated member or unauthenticated visitor.

- [x] **Step 4: Implement the document workspace**

Use one white grid with `lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]` and `lg:divide-x`. On small screens, use semantic tabs with keyboard navigation. Fields with overrides show “Đã biên tập” and a text action “Khôi phục bản gửi”; do not use nested panels.

- [x] **Step 5: Implement checklist and actions**

EDITOR sees save, preview, request-author-revision, and handoff. ADMIN sees return-to-editor, reject, enter-edit-mode, preview, and publish. Admin edit mode must require an explicit activation and a reason when the item is already published.

- [x] **Step 6: Run tests and commit**

Run: `npx vitest run tests/unit/review-workspace.test.tsx tests/unit/admin-reviews.test.ts`

```bash
git add src/app/admin/reviews/[id] src/components/editorial tests/unit/review-workspace.test.tsx tests/unit/admin-reviews.test.ts
git commit -m "feat(editorial): add academic review workspace"
```

### Task 11: Replace direct review buttons with editorial queues

**Files:**
- Modify: `src/app/admin/reviews/page.tsx`
- Delete: `src/components/admin-review-button.tsx`
- Modify: `src/components/navbar-nav.tsx`
- Modify: `src/app/admin/members/page.tsx`
- Modify: `src/components/admin-create-member-modal.tsx`
- Modify: `src/components/admin-role-toggle.tsx`
- Modify: `tests/unit/admin-reviews.test.ts`
- Modify: `tests/unit/navbar-nav.test.ts`
- Modify: `tests/integration/admin-create-member.test.ts`

**Interfaces:**
- Review queue supports `PENDING_REVIEW` and `READY_FOR_APPROVAL` filters.
- Role controls include EDITOR; editor navigation exposes the review queue but not member administration or final publishing controls.

- [x] **Step 1: Write failing queue and role tests**

Assert no direct publish/reject button on queue rows, correct queues per role, links to `/admin/reviews/[id]`, and safe assignment of EDITOR through admin member management.

- [x] **Step 2: Run tests and verify RED**

Run: `npx vitest run tests/unit/admin-reviews.test.ts tests/unit/navbar-nav.test.ts tests/integration/admin-create-member.test.ts`

- [x] **Step 3: Implement queues and navigation**

Keep queue rows compact and separated by rules, not cards. Editors see assigned/unassigned pending work and their internal feedback. Admins see both pending work and ready-for-approval work. Delete `AdminReviewButton` after all imports are removed.

- [x] **Step 4: Run tests and commit**

Run: `npx vitest run tests/unit/admin-reviews.test.ts tests/unit/navbar-nav.test.ts tests/integration/admin-create-member.test.ts`

```bash
git add src/app/admin src/components/admin-review-button.tsx src/components/navbar-nav.tsx src/components/admin-create-member-modal.tsx src/components/admin-role-toggle.tsx tests
git commit -m "refactor(editorial): route reviews through editor queues"
```

### Task 12: Materialize publication and preserve the audit trail

**Files:**
- Modify: `src/actions/editorial-actions.ts`
- Modify: `src/actions/showcase-actions.ts`
- Modify: `src/app/showcase/[slug]/page.tsx`
- Modify: `tests/integration/editorial-actions.test.ts`
- Modify: `tests/integration/public-data-boundary.test.ts`
- Modify: `tests/unit/showcase-detail.test.ts`

**Interfaces:**
- Produces `publishEditorialDraftAction(itemId, checklist)` restricted to ADMIN.
- Produces `getEffectivePublication(snapshot, editorialDraft)` for preview only; public routes continue reading materialized `ShowcaseItem` fields.

- [x] **Step 1: Write failing publication tests**

Test that publication is rejected outside `READY_FOR_APPROVAL`, without category, with open required comments, or by EDITOR. Verify a successful transaction applies overrides, preserves source revision/editorial draft, sets `publishedAt`, records editor/approver identities, and creates an audit event.

- [x] **Step 2: Run tests and verify RED**

Run: `npx vitest run tests/integration/editorial-actions.test.ts tests/integration/public-data-boundary.test.ts`

- [x] **Step 3: Implement atomic publication**

Within one Prisma transaction: load the logical workflow state, validate checklist/open comments/category, merge the latest snapshot and overrides, conditionally update only a `READY_FOR_APPROVAL` item, set `PUBLISHED`, preserve editorial records, and create `AuditEvent`. Revalidate `/`, `/dashboard`, `/admin`, `/admin/reviews`, and `/showcase/[slug]` after success.

- [x] **Step 4: Run tests and commit**

Run: `npx vitest run tests/integration/editorial-actions.test.ts tests/integration/public-data-boundary.test.ts tests/unit/showcase-detail.test.ts`

```bash
git add src/actions/editorial-actions.ts src/actions/showcase-actions.ts src/app/showcase/[slug]/page.tsx tests/integration tests/unit/showcase-detail.test.ts
git commit -m "feat(editorial): publish approved editorial drafts"
```

### Task 13: Complete migration coverage and end-to-end verification

**Files:**
- Modify: `tests/e2e/workflow.test.ts`
- Modify: `README.md`
- Modify: `.env.example` only if a new environment value is genuinely required

**Interfaces:**
- Verifies the complete CORE_MEMBER → EDITOR → ADMIN workflow and backwards compatibility for existing records.

- [x] **Step 1: Add end-to-end workflow coverage**

Cover draft save, member submission, editor assignment/editing, author revision, resubmission, ready-for-approval, admin return-to-editor, final publish, rejection, reopen, and archive. Verify the public page uses edited copy while revision history retains original copy.

- [x] **Step 2: Run focused E2E/integration suites**

Run: `npx vitest run tests/e2e/workflow.test.ts tests/integration/showcase-actions.test.ts tests/integration/editorial-actions.test.ts tests/integration/action-authorization.test.ts`

Expected: all pass with no leaked records after cleanup.

- [x] **Step 3: Document roles and workflow**

Update README role descriptions, the submission/review state diagram, safe migration commands, and the requirement that only ADMIN can publish.

- [x] **Step 4: Run complete verification**

Run sequentially:

```bash
npm run test:unit
npm run test:integration
npx vitest run tests/e2e/workflow.test.ts
npx tsc --noEmit
npm run build
git diff --check
```

Expected: every command exits 0. Inspect `git status --short` and confirm the user-owned thumbnail remains untracked and unstaged.

- [x] **Step 5: Commit final verification/docs changes**

```bash
git add README.md tests/e2e/workflow.test.ts
git commit -m "test(workflow): cover submission through publication"
```
