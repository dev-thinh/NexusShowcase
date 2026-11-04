# Conference Metadata Implementation Plan

> Implemented inline using superpowers:executing-plans. Preserve unrelated member-visibility changes.

**Goal:** Optional conference information for research papers and projects survives review and displays consistently across viewports.
**Architecture:** Validated nullable JSON on ShowcaseItem, shared domain schema, immutable submission revisions, shared banner/details components.
**Tech Stack:** Next 16 / React 19 / Prisma PostgreSQL / Zod 4 / Tailwind.
**Spec:** docs/superpowers/specs/2026-11-04-conference-metadata-design.md

## Constraints
- Conference name required when enabled; dates and up to eight ranking pairs optional.
- Conference ACCEPTED/PUBLISHED status is independent of website publication; both milestone dates remain stored, only the active date is public.
- Both publication types retain metadata across category switches.
- Creator/contributor permissions and citation output stay unchanged.
- Card body sizing excludes the optional banner. Abstract retains two lines; titles truncate to one line and footers follow content without flexible whitespace.

## Completed implementation
- [x] Add conference schema, bounded ranks, date/status validation and legacy defaults in publications/model/conference.ts.
- [x] Add nullable JSON column migration; connect draft input, snapshot mapping, review validation/application and publication selects.
- [x] Add conference fields to the editor, with status-dependent date inputs, nested field errors and state preservation.
- [x] Reuse ConferenceDetails in author preview, reviewer preview and publication detail.
- [x] Reuse ConferenceCardBanner above image/body on homepage and both category layouts; retain normal badges/admin controls/abstract underneath.
- [x] Keep banner name readable on narrow cards; group ranks, event date and active milestone at the right. Use a light-blue system palette.
- [x] Keep card bodies equally compact without equalizing total height including banners.
- [x] Align research photos and unify navigation collapse/account labels/resize behavior at1280px.
- [x] Preserve complete publication thumbnails with object-fit:contain, including wide logos.

## Validation coverage
- Unit tests: malformed dates/statuses, incomplete/duplicate/excessive rank pairs, old snapshots, both publication types, active date display and preserved abstracts.
- Integration tests: draft -> revision -> approval, private published edits, milestone changes, clearing metadata, creator absent from contributors, and unchanged legacy review flows.
- Browser tests: editor save/reload/preview, status switches preserving dates, body heights excluding banner, footer spacing, date ordering/right alignment, both publication types and thumbnails.
- Responsive matrix:320,390,640,700,768,900,1024,1100,1279,1280,1440px, including signed-in header overlap and accessible dropdown behavior.
- Final CI-equivalent verification is recorded in the completion report: full unit/integration/E2E, production build and fresh/legacy migration verification.

## Review notes
- Dates are ISO date-only strings rendered in Vietnamese order without timezone conversion; no date-based automatic status transitions.
- Fresh/legacy schema verification uses only dedicated disposable test schemas. No production/runtime migration was applied during implementation.
- Screenshot review covered research alignment, narrow conference banners, wide cards and1100px navigation.
- Reviewer found no concrete persistence, permission or responsive regressions.

## Final pre-commit verification
- npm run check:818 unit tests passed; typecheck, unused and architecture checks passed.
- npm run build:production build passed.
- npm run db:verify-upgrade:fresh and legacy schema diff empty; fixture invariants preserved.
- npm run test:integration:113 tests passed.
- npm run test:e2e:139 tests passed in the final full run.
- Corrected a duplicate-contributor test fixture and updated the expected validation color to the shared red.
- GitHub CI and deployment remain separate from local verification.
