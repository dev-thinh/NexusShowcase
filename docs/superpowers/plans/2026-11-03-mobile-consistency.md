# Mobile consistency implementation plan

**Goal:** Improve mobile usability while preserving the existing brand, homepage order, gradients, content, and desktop layout.

**Architecture:** Reuse ManagementFilters and FilterDisclosure for account and admin lists. Adjust shared pagination, actions, input typography and dialogs; keep editor-specific layout changes scoped to the submission form. Use shared membership labels (Ban chủ nhiệm, Trưởng nhóm, Thành viên) without changing persisted authorization codes or access rules.

**Tech stack:** Next.js 16, React 19, Tailwind v3, Playwright.

- [x] Audit public, account and admin pages at 320, 390, 768 and 1440px; capture narrow-screen screenshots.
- [x] Reuse shared filtering in MyPosts; preserve counts, selected state, search, reset and pagination.
- [x] Use the same centered previous/page-input/next navigation on mobile and desktop; submit with Enter/Go and retain filters.
- [x] Improve editor spacing, stack category/year on phones, and make save/submit actions readable.
- [x] Standardize mobile action targets and editable text; enlarge modal/password controls without changing desktop sizes.
- [x] Run mobile regression tests, existing browser suite, typecheck, architecture/unused checks and unit tests; inspect screenshots and resolve findings.

Validation: tests/e2e/mobile-consistency.spec.ts, public and account navigation, filters, upload/editor, modal and approval scenarios. Baseline tests must expose narrow category width and pagination wrapping before fixes. User has authorized implementation; do not commit or push without a request.

Final verification: 799 unit tests and 8 account-management integration tests passed. Typecheck, unused-code audit, architecture checks and whitespace checks passed. All 124 browser tests passed in the final full-suite run. Narrow screenshots of public, account, admin and editor pages were reviewed.

Final refinements: separate management actions from filter panels; use compact two-line member rows with a permissions disclosure; align image/card actions; share a fixed 600ms scroll-to-top animation; retain existing homepage ordering and gradients.
