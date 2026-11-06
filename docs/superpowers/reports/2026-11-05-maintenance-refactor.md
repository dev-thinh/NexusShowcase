# Maintenance refactor — 2026-11-05

## Completed

This pass preserves the approved layouts and existing workflows. Work was performed directly on `dev`, preserving the changes already present when this task began.

### Verified dead code removed

- Six unreferenced type exports: `MemberGrantInput`, `DecisionInput`, `MediaBlock`, `PublicationDetailDto`, `PublicMemberDto`, and `AuthorItemDto`, including imports made unnecessary by their removal.
- The unread `SubmissionEditor.mode` prop and both call-site arguments.
- The never-enabled `FormSkeleton.password` branch; password changes redirect to the member profile rather than using this skeleton.
- `shared/ui/loading-content.tsx`: its separate title lookup and client hook are replaced by a shared route presentation table used by the route skeleton renderer.

The unused-code audit now checks exported types, interfaces, classes and enums as well as functions and variables. Regression coverage retains type-only imports, named re-exports and literal dynamic imports, and verifies that recursive type self-references do not count as export consumers.

### Duplication and redundant work reduced

- Route titles and skeleton layouts now come from `shared/lib/route-presentation.ts`, with static routes matched before dynamic families and a literal union preventing misspelled layout names.
- Contributor search and dashboard filtering reuse `normalizeSearchText`, preserving Vietnamese accent and casing behavior.
- Contributor search stops once its result limit is satisfied, instead of normalizing every remaining candidate. Existing negative, fractional, zero, NaN and infinite limit behavior is preserved.
- Dashboard status counts skip text normalization for an empty search and no longer construct dummy title/summary fields.
- Empty contributor selections return without a database query; nonempty selections retain their deduplication, 20-ID bound and hidden-member exclusion.
- The author dashboard, new-draft page and edit page fetch only `id`, `fullName`, `role` and `mustChangePassword` instead of the complete user record.

These are reductions in performed work and selected data; no end-user latency improvement is claimed without a before/after benchmark.

## Verification

- `npm run check`: passed, including TypeScript, unused-code gate, architecture gate and **960 unit tests**.
- `npm run test:integration`: **139 tests across 37 suites passed** against isolated test schemas.
- Production browser harness: build passed and **25 browser tests passed**, covering navigation cancellation, rapid navigation, Back/Forward, responsive skeletons, administrative navigation, contributor permissions, autosave, recovery, version conflicts and submission retries.
- `git diff --check`: passed.

The production dependency graph contains no unreachable files and no unrecognized unused exports. Two intentional audit exceptions remain: `reopenShowcaseAction` and `archiveShowcaseAction`. Although neither has a current UI caller, both implement explicit, tested lifecycle contracts, including clearing pins and enforcing author/admin state transitions. Their removal would change supported behavior rather than merely remove accidental dead code.

Independent read-only code review found no critical or important issues. Both minor findings were addressed and verified.

## Further improvements identified

1. **Aggregate storage usage in the database.** `features/assets/components/storage-usage.tsx` currently hydrates all undeleted asset records and upload reservations before computing totals. For a growing asset library, database sums/counts would bound application memory and response size. Preserve the legacy unknown-size estimate and quarantined/pending accounting in `features/assets/model/storage-usage.ts`.
2. **Avoid repeated article parsing during unrelated editor updates.** `SubmissionEditor` derives thumbnail candidates through `articleFromLegacy` on every render; `SectionEditor` parses the same content again. Share or memoize derived data with stable dependencies, then verify large articles, incomplete media input and autosave/recovery before changing this stateful code.
3. **Batch authorization of multiple referenced assets.** `features/assets/server/reference-access.ts` awaits `getAssetAccess` sequentially for each URL. A bounded batch lookup could reduce database round trips for media-heavy posts. Keep registry quarantine, ownership, private drafts and historical references authoritative; do not cache authorization across users or requests.

These are follow-up candidates supported by code inspection, not confirmed production bottlenecks. They were kept separate from this behavior-preserving cleanup because they need targeted measurements and tests of their own.

## Scope intentionally preserved

No stored assets, database rows, migrations, seed/maintenance commands, legacy URLs or historical snapshot parsers were deleted. These can be used outside the visible UI or by persisted data and cannot be classified as unused by a source-import scan alone. No packages were upgraded and no changes were deployed or committed.
