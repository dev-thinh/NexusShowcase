# Contributor tracking implementation plan

> Execute inline using superpowers:executing-plans, with regression tests before implementation.

**Goal:** Track creator and contributor work from draft through publication without granting contributor mutation rights.
**Architecture:** Shared OR membership scope in Prisma queries and equivalent SQL; permission-aware dashboard rows.
**Tech Stack:** Next.js 16, Prisma 6, PostgreSQL, Vitest.
**Spec:** docs/superpowers/specs/2026-11-02-contributor-tracking-design.md

## Task 1: Dashboard membership and presentation

- [x] Update integration regression to include draft contributions, update review stage, counts, SQL search, guest role, no double counting and outsider exclusion.
- [x] Add UI regression ensuring a non-creator draft has no edit/withdraw/dead preview links.
- [x] Observe failure, then update submissions/server/queries.ts and components/my-posts.tsx and dashboard description.
- [x] Run targeted tests, npm run check, integration suite and production build.
- [x] Review mutation ownership checks and published profile queries; commit separately and push dev.

## Verification

740 unit tests, 108 integration tests and three production browser tests passed. Browser coverage includes 390px and 1440px contributor draft, pending and published stages. Production build, TypeScript, unused-code and architecture checks passed. Independent review found no important issues. Test template migration was applied only after verifying its dedicated database identity; runtime database was not migrated.
