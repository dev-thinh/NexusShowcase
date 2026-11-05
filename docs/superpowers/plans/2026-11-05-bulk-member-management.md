# Bulk Member Management Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for inline implementation; fresh review at completion.

**Goal:** Ship approved CSV member creation and modal-based bulk CORE_MEMBER grants.
**Architecture:** Pure bounded CSV model, server-authorized preview/create commands reusing existing account creation, atomic versioned role grants and bounded member lookup, two client modals integrated into member management actions.
**Tech Stack:** Next.js 16, React 19, Prisma/PostgreSQL, Zod, Vitest, Playwright.
**Spec:** docs/superpowers/specs/2026-11-05-bulk-member-management-design.md

## Global Constraints

Work on dev; no migration, dependency, feature branch or worktree. CSV 128 KiB and 100 rows; grant max 50. MEMBER-only creation. Exclude hidden/disabled/non-MEMBER from selection. No plaintext credential persistence or automatic uncertain-request replay.

## Review Focus

Quoted CSV and malformed UTF-8, alias duplicates, preview/submit races, stale selection and revoked admin, credential export/loss and spreadsheet formulas.

### Task 1: CSV model
- [x] Write failing unit tests for BOM/semicolon/quoted cells, row numbers/errors, malformed/oversized/extra columns, alias collisions and safe exports.
- [x] Implement model/bulk-members.ts and model/member-csv.ts with bounded parser, schemas, preview types and export.
- [x] Verify focused unit tests.

### Task 2: Server operations
- [x] Write failing integration tests for read-only preview, valid-only creation, MEMBER enforcement, duplicate/race handling, authorization, bounded eligible search and atomic stale/hidden/disabled promotion rejection.
- [x] Implement server/bulk-member-commands.ts, bulk-member-actions.ts and bulk-member-queries.ts; reuse createMember and identity invalidation.
- [x] Verify focused integration tests and typecheck.

### Task 3: UI and validation
- [x] Add CSV import modal with template download, FilePicker, preview/result table, exact valid-count create button, export and discard guard.
- [x] Add grant modal with search/paging, retained selection, selected-name review, guarded save and clear results.
- [x] Add both actions alongside existing member creation; no main-list checkbox changes.
- [x] Add browser tests for CSV mixed validity/export, batch grants, mobile fit and retained selections.
- [x] Run npm run check and relevant integration/browser suites, fresh code review, address important findings, report results.

## Execution ledger

- Initial state: earlier requested work remains uncommitted; preserve it. Approved UI and role scope are documented above. Small commits on dev were authorized in the subsequent finalization request.

- Model: 17 unit tests passed after observing missing-module RED. Server: 8 integration tests pass, including duplicate-import and promotion races; typecheck and architecture checks pass. Browser: first 10 scenarios passed at 320/1280px.
- Ruling: generate bulk temporary passwords with a fixed alphabetic prefix and 18 random bytes so spreadsheet formula escaping never changes their exact value; ordinary CSV data remains formula-escaped.
- Review found SPA Back could drop undownloaded credentials. Added a reproducing browser assertion before implementing the navigation guard. No plaintext storage will be added.

- Final review: no outstanding Critical/Important findings after navigation guard. Minor: browsers without Navigation API use a temporary history entry; multi-entry history traversal may truncate forward entries while protecting credentials. Regression coverage includes normal Back cancellation and the first Back after result export/close.

- Completion verification: npm run check passed (171 files / 902 unit tests); full integration suite passed (36 files / 132 tests); all six bulk-member browser scenarios passed at 320/1280px. Strengthened CSV navigation assertions also passed: Back is blocked before export, and the next Back after exporting and closing reaches the original /admin route for both native Navigation API and legacy fallback. Production harness build/typecheck passed. No migrations, commits or external messages performed.

- Finalization verification before commits: npm run check (902 unit tests), npm run test:integration (132 tests), npm run db:verify-upgrade, npm run build and all 159 browser tests passed. Updated legacy browser selectors for dropdown filters/conference labels and scoped CSV browser fixture cleanup to keep shared directory counts stable. Finalization groups the complete dirty tree into eight feature-focused commits on dev; previously existing commits are preserved.
