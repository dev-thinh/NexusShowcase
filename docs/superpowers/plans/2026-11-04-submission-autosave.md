# Submission Autosave Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create drafts immediately, preserve incomplete edits through network/navigation failures, and keep one preview control at the bottom of the editor.

**Architecture:** Persist the complete author editing snapshot separately from submission projections, with versioned and idempotent mutations. A client save coordinator serializes writes and retries stable mutation envelopes; per-session browser recovery preserves unacknowledged edits. Existing authorization and publication approval remain authoritative.

**Tech Stack:** Next.js 16 App Router, React 19, Zod 4, Prisma 6/PostgreSQL, Vitest and existing Playwright harness; no new runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-11-04-submission-autosave-design.md`

## Global Constraints

- Apply to new drafts, existing drafts and published-item author updates; public content changes only after approval.
- Create via authenticated mutation, never during a GET/render. Stable creation and save mutation IDs survive retries.
- Save after 1.5 seconds idle, with a 10-second maximum while continuously typing; one in-flight save at a time.
- Preserve incomplete text without trimming or dropping it; keep payload limits, asset authorization and complete submission validation.
- Browser recovery keys include account, item and editing-session IDs. Never overwrite another tab's backup.
- Keep typing enabled during autosave; no autosave toast, focus jump or automatic error scrolling.
- Keep manual Save; show exactly one preview control, with eye icon, at the bottom.
- Read relevant `node_modules/next/dist/docs/` guides and repository instructions before product code edits. Use an isolated worktree when beginning implementation; leave existing untracked design documents intact.

## Review Focus

- A server commit whose response is lost must replay successfully without incrementing the version twice (Task 1).
- Acknowledgement of an older save must never delete a newer browser recovery snapshot (Tasks 3–4).
- Duplicated tabs and unavailable browser storage must not silently lose edits or claim local durability (Task 3).
- A submission/status change in another tab must preserve recoverable text while stopping writes (Tasks 4–5).
- Incomplete URLs, section text and conference/contributor fields must round-trip without weakening submission or file access validation (Tasks 1–2).

---

### Task 1: Preserve draft snapshots and make mutations idempotent

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20261104_submission_autosave/migration.sql`
- Modify: `src/features/submissions/model/input.ts`, `model/versioned-input.ts`, `model/draft.ts`, `server/draft-commands.ts`, `server/actions.ts`
- Create: `src/features/submissions/server/draft-mutations.ts`
- Test: `tests/unit/draft-validation.test.ts`, `tests/integration/draft-conflict.test.ts`

**Interfaces:**
- Keep `ShowcaseDraftInput` as the client editing shape; draft schema permits empty/in-progress strings with bounded lengths and arrays and does not trim user text. Complete submission schema stays strict.
- Extend `SaveDraftInput` with optional `mutationId: string` for compatibility with existing callers; the new client always supplies a UUID. Reject replay with a different payload.
- Add `createShowcaseDraftAction({ mutationId: string })`, returning the existing action-result shape with `{ id, slug, status, reviewVersion }`.
- Add a `DraftMutation` persistence record keyed by actor plus mutation ID, storing operation, payload digest, item ID and successful response; commit record and mutation in one transaction. Do not expose another actor's receipt.
- Reuse `authorDraft` for authoritative author editing snapshots on unpublished as well as published items; `getAuthorDraft` remains the backwards-compatible reader. Unpublished scalar title/summary/type projections keep dashboard lists useful; do not rebuild incomplete resource/contributor relations on autosave.

- [ ] Add failing tests: empty title and unfinished URL round-trip verbatim; malformed/oversized structures reject; submission still requires valid title/resources/contributors; unauthorized asset references reject.
- [ ] Add integration tests for replayed creation, replayed save, same mutation ID/different payload rejection, actor isolation, competing versions, and commit-then-retry with exactly one version increment.
- [ ] Run `npx vitest run tests/unit/draft-validation.test.ts` and targeted integration tests using the existing isolated database harness; confirm new cases fail for the intended reasons.
- [ ] Implement bounded draft schemas and transactional receipt persistence. Creation defaults to PRIVATE/DRAFT, empty title/summary, citation disabled and the actor as initial contributor. Never mutate from render.
- [ ] Update save to store the complete snapshot without `publicationResources` normalization; update unpublished scalar projections only. Preserve ownership/status/version checks and asset reference guards.
- [ ] Run Prisma generation, typecheck and the targeted tests; migration must apply to existing fixtures and preserve legacy drafts.

### Task 2: Submit and load the authoritative editing snapshot

**Files:**
- Modify: `src/features/submissions/server/draft-commands.ts`
- Modify: `src/app/(shell)/(account)/dashboard/items/[id]/edit/page.tsx`
- Modify as needed: `src/features/submissions/model/snapshot.ts`, `server/snapshot-relations.ts`
- Test: `tests/integration/draft-conflict.test.ts`, `tests/unit/submission-workflow.test.ts`

**Interfaces:**
- `submitDraftCommand(actor, SubmissionInput)` consumes `authorDraft` when present, falls back to existing item relations for legacy drafts, validates complete submission data and constructs the normalized immutable review snapshot.
- Edit route supplies the authoritative draft, ID and reviewVersion to `SubmissionEditor`; incomplete data is not passed through a lossy legacy resource conversion.

- [ ] Write failing cases for legacy draft fallback, incomplete authorDraft rejection on submit, valid snapshot submission, and published edits leaving live fields unchanged.
- [ ] Run the targeted tests and confirm the failures.
- [ ] Implement snapshot-first loading/submission; update valid relations/projections at submission where existing downstream code requires them. Preserve review status, immutable revisions and audit behavior.
- [ ] Run targeted workflow and conflict tests plus `npm run typecheck`.

### Task 3: Browser recovery and serialized save coordination

**Files:**
- Create: `src/features/submissions/components/draft-recovery.ts`
- Create: `src/features/submissions/components/draft-save-coordinator.ts`
- Create: `tests/unit/draft-recovery.test.ts`, `tests/unit/draft-save-coordinator.test.ts`

**Interfaces:**
- Recovery record: `{ accountId, itemId, sessionId, expectedReviewVersion, editSequence, updatedAt, data, pendingMutation? }` with a storage format version. Validate records on read.
- Recovery functions `listRecoveries(storage, accountId, itemId)`, `writeRecovery(storage, record)`, `removeRecovery(storage, record)` return explicit success/error results; conditional removal requires matching session and sequence. Each mounted editor gets a distinct session UUID, including duplicated tabs; existing records are discovered for recovery rather than overwritten.
- `DraftSaveCoordinator` accepts injected save action, timers, recovery writer and event callbacks. Exposes `update(data)`, `flush()`, `retry()`, `dispose()`; returns acknowledged ID/version/sequence from flush. Holds immutable pending payload and mutation ID across uncertain retries; newer edits wait for acknowledgement.

- [ ] Add fake-storage tests for account isolation, independent tab sessions, malformed data, quota exceptions and conditional deletion of only the acknowledged sequence.
- [ ] Add fake-timer/deferred-promise tests for 1500ms idle save, 10000ms maximum, one in-flight request, edits during save, identical mutation retry after lost response, bounded retry delays and stopping on conflict/authorization/status errors.
- [ ] Run both test files to verify failures before implementation.
- [ ] Implement recovery and coordinator without React/Next dependencies so behavior is directly testable. Persist pending mutation envelopes before sending. A manual/submit flush waits for latest edits, not only the currently pending request.
- [ ] Verify both test files pass, including dispose retaining recovery and preventing background writes after unmount.

### Task 4: Integrate autosave, recovery and editor controls

**Files:**
- Modify: `src/features/submissions/components/use-submission-editor.ts`, `submission-editor.tsx`, `submission-action-bar.tsx`
- Create: `src/features/submissions/components/draft-recovery-panel.tsx`
- Modify: `tests/unit/submission-editor.test.tsx`
- Extend: existing browser harness submission scenarios under `tests/` (locate exact owner with `rg` before editing).

**Interfaces:**
- Hook receives account ID and stable item ID plus initial draft/version; exposes save status, submission busy status, manual save/submit, recoveries and restore/discard actions.
- Recoveries block automatic writes until the user restores or discards them. Same-base recovery resumes saving; stale recovery stays blocked and offers current-server reload plus copy/export of local text, with no blind overwrite.
- `SubmissionActionBar` uses save-status text separately from submit busy state. `SubmissionEditor` locks editing for submission, not autosave; uploads keep their existing necessary restrictions.

- [ ] Add meaningful browser cases for typing while saving, offline edit/reload/recover/reconnect, storage failure, two-tab conflict and submitting while an earlier save is pending. Update existing reducer assertions where the state contract changes.
- [ ] Confirm new tests fail before integrating.
- [ ] Connect coordinator and recovery lifecycle; write browser backup on edits, handle online/offline events and keep beforeunload only when durability is uncertain. Report storage failure honestly.
- [ ] Implement inline restore/discard/copy recovery controls; do not focus/scroll on background save failures.
- [ ] Make submit validate complete data, wait for latest flush, freeze editing during its final transition and stop autosave after successful submission. Preserve recovery on failure.
- [ ] Remove the top preview button; bottom preview uses an eye icon at every viewport and switches label to Soạn thảo when active. Keep manual Save and accurate saved/offline/conflict states.
- [ ] Run targeted editor/coordinator tests and the browser cases.

### Task 5: Immediate creation, recovery access and release verification

**Files:**
- Modify: `src/app/(shell)/(account)/dashboard/items/new/page.tsx`
- Create: `src/features/submissions/components/new-draft.tsx`
- Modify: `src/features/submissions/components/my-posts.tsx`
- Modify: `src/app/(shell)/(account)/dashboard/items/[id]/edit/page.tsx`
- Modify: `src/features/submissions/server/actions.ts`
- Extend: existing integration/browser creation and author workflow tests.

**Interfaces:**
- `/dashboard/items/new` remains the existing authenticated destination. Its client entry component initiates `createShowcaseDraftAction` after an intentional visit, not prefetch/render, and replaces the route with `/dashboard/items/[id]/edit` on success. Persist a per-attempt creation mutation ID for retry; do not reuse it for a new intentional creation.
- Reuse existing list fallback title or align it to Công trình chưa có tiêu đề. Unauthorized users cannot create.
- Non-editable owner routes show a recovery-only panel so retained local records can be copied/exported/discarded; never enable edits on pending/archived items. Do not expose records to other accounts.
- Autosave does not trigger broad public/member invalidation on every write; mutation boundaries still refresh private lists and review transitions appropriately.

- [ ] Add tests for double click, lost create response, offline retry, GET/prefetch with no database write, correct default citation/contributor state, and recovery accessibility after another tab submits.
- [ ] Confirm failures, implement creation entry and non-editable recovery route, then rerun cases.
- [ ] Run `npm run check`, relevant integration tests, migration upgrade verification, and browser harness workflow scenarios. Fix regressions rather than weakening assertions.
- [ ] Review the complete diff against the approved spec, particularly asset-reference triggers for authorDraft, raw snapshot parsing and save receipt concurrency. Request an independent final code review and resolve material findings.
- [ ] Update plan checkboxes and report evidence, changed behavior and any remaining deployment requirement (including applying migration). Leave changes reviewable; do not deploy or merge without an explicit request.
