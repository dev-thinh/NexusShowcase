# Local Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the confirmed local security and data-safety blockers while preserving the current local Next.js/PostgreSQL/filesystem workflow.

**Architecture:** Centralize session-derived authorization and runtime validation in server-only helpers, expose minimal public DTOs, and make account/upload/test lifecycles safe by default. Retain Prisma, NextAuth credentials, and local uploads; add only focused schema fields and pages needed for session invalidation, password change, soft deletion, and rejected-item resubmission.

**Tech Stack:** Next.js 15 App Router, React 19, NextAuth v5, Prisma 6/PostgreSQL, Zod, Vitest, TypeScript.

**Spec:** `docs/superpowers/specs/2026-10-12-local-security-hardening-design.md`

## Global Constraints

- Preserve all pre-existing unrelated UI/worktree changes.
- Do not add CI/CD, cloud storage, deployment containers, observability infrastructure, or production runbooks.
- Every privileged mutation derives the actor from `auth()`; actor IDs never come from client input.
- Public/client payloads never contain `passwordHash`, private email, or student ID.
- Tests must never silently use the normal development database.
- Use TDD: observe each focused regression test fail before implementing its fix.
- Keep the application usable with local PostgreSQL and `public/uploads`.

---

### Task 1: Session-derived authorization and public DTO boundaries

**Files:**
- Create: `src/lib/current-user.ts`
- Create: `src/lib/public-user.ts`
- Modify: `src/actions/admin-actions.ts`
- Modify: `src/actions/showcase-actions.ts`
- Modify: `src/components/admin-create-member-modal.tsx`
- Modify: `src/components/admin-delete-member-modal.tsx`
- Modify: `src/components/admin-role-toggle.tsx`
- Modify: `src/components/admin-review-button.tsx`
- Modify: `src/components/pin-toggle-button.tsx`
- Modify: `src/components/item-form.tsx`
- Modify: admin/dashboard/showcase pages that pass actor IDs
- Modify: public Prisma queries in `src/app/page.tsx`, `src/app/showcase/[slug]/page.tsx`, and `src/app/members/[id]/page.tsx`
- Test: `tests/unit/current-user.test.ts`
- Test: `tests/integration/action-authorization.test.ts`
- Test: `tests/integration/public-data-boundary.test.ts`

- [ ] Write tests proving an unauthenticated caller and an ID-substitution attempt cannot invoke create/review/pin/member mutations.
- [ ] Run focused tests and confirm they fail against the current actor-ID design.
- [ ] Implement a server-only current-user helper that loads the session user from Prisma, requires `ACTIVE`, and checks allowed roles.
- [ ] Remove actor-ID parameters from all Server Actions and update every caller.
- [ ] Replace `user: true` and raw user objects with explicit public selects/DTOs.
- [ ] Add serialization regression assertions for `passwordHash`, email, and student ID.
- [ ] Run focused tests, typecheck, and commit only Task 1 files.

### Task 2: Runtime schemas and safe local upload pipeline

**Files:**
- Create: `src/lib/action-schemas.ts`
- Create: `src/lib/file-signatures.ts`
- Modify: `src/actions/showcase-actions.ts`
- Modify: `src/actions/admin-actions.ts`
- Modify: `src/actions/upload-actions.ts`
- Modify: `src/app/api/upload/route.ts`
- Modify: `src/components/item-form.tsx` only where result typing requires it
- Test: `tests/unit/action-schemas.test.ts`
- Test: `tests/unit/upload.test.ts`

- [ ] Write failing tests for `javascript:` URLs, oversized/unbounded inputs, invalid enums/years/IDs, spoofed image MIME, spoofed PDF MIME, and attacker-controlled extensions.
- [ ] Implement Zod schemas for every admin/showcase mutation with stable validation errors.
- [ ] Validate URL protocols and reasonable field/collection limits server-side.
- [ ] Implement byte-signature checks for JPEG, PNG, WebP, and PDF; derive extensions only from verified content.
- [ ] Ensure upload errors do not expose filesystem details and the API uses stable status codes.
- [ ] Run focused tests, typecheck, and commit only Task 2 files.

### Task 3: Safe account lifecycle and live session state

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts`
- Modify: `.env.example`
- Modify: `src/lib/auth.ts`
- Modify: `src/actions/admin-actions.ts`
- Create: `src/actions/account-actions.ts`
- Create: `src/app/account/change-password/page.tsx`
- Create: `src/components/change-password-form.tsx`
- Modify: authenticated layouts/pages to enforce password change where appropriate
- Modify: member creation/deletion UI
- Test: `tests/integration/account-lifecycle.test.ts`
- Test: `tests/integration/auth.test.ts`

- [ ] Write failing tests for destructive/default seed assumptions, shared default passwords, suspended/demoted sessions, forced password change, and deletion preserving showcase records.
- [ ] Add `mustChangePassword`, `sessionVersion`, and soft-delete metadata required by the spec.
- [ ] Make seed idempotent and require environment-supplied local bootstrap credentials; destructive reset requires an explicit opt-in flag.
- [ ] Generate unique temporary credentials during member creation and return them once to the admin UI.
- [ ] Implement authenticated password change and clear `mustChangePassword` while incrementing session version.
- [ ] Refresh role/status/session version from the database in auth callbacks and invalidate stale sessions.
- [ ] Replace hard deletion with suspension/soft deletion while retaining authored content.
- [ ] Run Prisma generate/push against the local development schema only after verifying the target, then run focused tests/typecheck and commit Task 3 files.

### Task 4: Dedicated test database guard and deterministic integration tests

**Files:**
- Modify: `vitest.config.ts`
- Create: `tests/setup/database.ts`
- Modify: `.env.example`
- Modify: integration/e2e tests that depend on seed credentials or global data
- Modify: `package.json`
- Test: `tests/unit/test-database-guard.test.ts`

- [ ] Write failing unit tests for absent, equal-to-development, and non-test-shaped `TEST_DATABASE_URL` values.
- [ ] Implement a guard that assigns `DATABASE_URL=TEST_DATABASE_URL` before application modules import Prisma.
- [ ] Make integration fixtures self-contained and remove reliance on seeded admin credentials.
- [ ] Replace global updates such as clearing every pin with fixture-scoped cleanup.
- [ ] Add separate unit and integration scripts so pure unit tests remain runnable without PostgreSQL.
- [ ] Run unit tests without DB, integration tests against the validated test DB, typecheck, and commit Task 4 files.

### Task 5: Rejected-item edit and resubmit workflow

**Files:**
- Modify: `src/actions/showcase-actions.ts`
- Create: `src/app/dashboard/items/[id]/edit/page.tsx`
- Modify: `src/components/item-form.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Test: `tests/integration/showcase-edit.test.ts`

- [ ] Write failing tests proving owners can edit draft/rejected items, can resubmit rejected items, cannot edit published items, and cannot edit another owner's item; admins retain explicit edit authority.
- [ ] Implement validated transactional update/resubmit action using session-derived authorization.
- [ ] Reuse `ItemForm` in edit mode without duplicating create-form logic.
- [ ] Add dashboard edit/resubmit links for eligible statuses and user-facing error states with `try/finally` pending cleanup.
- [ ] Run focused tests, typecheck, and commit Task 5 files.

### Task 6: Dependency and browser hardening

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `next.config.ts`
- Modify: `.gitignore`
- Modify: `.env.example`
- Modify: `src/app/login/login-form.tsx`
- Modify: affected auth integration tests

- [ ] Capture the current production dependency audit and identify compatible patched versions, prioritizing NextAuth critical advisories.
- [ ] Upgrade only compatible vulnerable dependencies and regenerate the lockfile.
- [ ] Add local-compatible CSP, `nosniff`, frame, referrer, and permissions headers without breaking Next.js development or approved video embeds.
- [ ] Remove public default-credential copy and ensure `.env` is ignored going forward without deleting the user's local file.
- [ ] Run auth tests, full typecheck, full test suite with the guarded test DB, production build, and dependency audit.
- [ ] Commit only Task 6 files and record any advisory that cannot be safely resolved.

### Task 7: Whole-change verification and documentation

**Files:**
- Create or modify: `README.md`
- Modify: `.env.example`
- Modify: tests only for gaps found by final verification/review

- [ ] Document local setup, bootstrap admin, safe seed/reset, test database, password-change flow, and upload limitations.
- [ ] Verify no actor-ID mutation parameters, `user: true` public queries, default passwords, or destructive unguarded seed deletes remain.
- [ ] Run fresh Prisma validation, TypeScript, unit/integration tests, production build, and dependency audit.
- [ ] Request whole-branch code review and address all Critical/Important findings with one fix wave.
- [ ] Commit Task 7 documentation/fixes without staging unrelated pre-existing worktree changes.
