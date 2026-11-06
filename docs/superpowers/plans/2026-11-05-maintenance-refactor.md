# Maintenance refactor implementation plan

**Goal:** Remove verified dead code, reduce duplication and unnecessary work, and document further improvements without changing the approved UI or workflows.

**Architecture:** Keep the existing feature boundaries. Centralize route presentation and Vietnamese text normalization; make the existing unused-code audit cover type declarations. Optimize only queries and computations with measurable redundant work.

**Tech stack:** Next.js 16.4.3, React 19, Prisma 6, TypeScript, Vitest, Playwright.

**Spec:** User request in this session: refactor, remove code that is never used, optimize, and review opportunities for improvement.

## Constraints

- Work directly on `dev`; preserve changes already present at task start.
- Preserve UI, navigation, drafts, permissions, legacy-data compatibility, and existing lifecycle contracts.
- Do not delete stored files, database data, migrations, or operational scripts based solely on static analysis.
- No dependency upgrades or production deployment.

## Tasks

- [x] Extend `scripts/audit-unused.mjs` to identify unused exported types; test type-only imports and re-exports. Remove the six verified unreferenced types, the unused editor `mode` prop, and the unused password skeleton branch.
- [x] Centralize route layout/title matching in `src/shared/lib/route-presentation.ts`; use existing route skeleton and navigation tests to preserve all route behavior.
- [x] Reuse `normalizeSearchText` in contributor search and dashboard filtering; stop scanning candidate members once the requested limit is reached. Verify Vietnamese names, selected users, limits and filters.
- [x] Skip contributor hydration for an empty selection; select only the required user fields on submission pages. Add focused query tests.
- [x] Run the full check suite, database integration tests and relevant browser workflows. Review the final diff and record evidence and remaining opportunities in a maintenance report.

## Review focus

- Type-only imports and dynamic Next.js entrypoints must remain reachable in the audit.
- Same-page navigation cancellation must continue to release loading skeletons.
- Search must preserve accented Vietnamese and existing limit behavior.
- Optimizations must not weaken authentication or expose private user fields.
- Deferred UI and drafts must retain recovery, permissions and version checks.

## Initial findings

- Production graph has no unreachable source files; it explicitly retains two tested administrative lifecycle actions without a current UI caller.
- Six exported types have no references in source, scripts, Prisma helpers, or tests.
- `SubmissionEditor.mode` is supplied but never read; `FormSkeleton.password` is never enabled.
- Search normalization and route presentation have duplicate implementations.
- Empty selected-contributor hydration still performs a database query; submission pages fetch complete user records although they need four fields.

## Review and completion

Independent read-only review found no critical or important issues. Its two minor findings were addressed: recursive type self-references no longer hide an unused export, and route skeleton layout names are constrained to a literal union. Regression tests cover the audit case. All planned tasks were completed without changing UI or supported lifecycle actions.
