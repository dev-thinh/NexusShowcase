# Deletion manifest

M3 uses the route/config/npm import graph, symbol references, `rg` and strict TypeScript unused diagnostics. `scripts/architecture-map.json` contains every deleted path; snapshots preserve the pre-task evidence locally. Deletions are actual filesystem removals, without compatibility wrappers.

| Candidate | Evidence and replacement | Result |
| --- | --- | --- |
| contact-form, featured-filmstrip, visibility-toggle-button, optional-details | No reachable runtime consumer. Contact page is static; live article controls use CardAdminControls; section editor owns content. | deleted |
| six editorial UI files, editorial action stubs, legacy-input schema | No route uses retired Editor workflow. Direct Admin decision command and version-zero snapshot adapter preserve existing history. Archive/reopen moved to publications first. | deleted |
| home-section-filters, nav-categories, resource-presentation | No reachable imports; active home/navigation/resource components own current behavior. | deleted |
| retired showcase create/update/review stubs and their input/types | No active callers; save/submit/versioned direct decision are the live mutations. | deleted |
| RoleBadge, unused permission helpers, requireActor, toPublicUser, local setRole | Symbol audit found only declaration/tests. Active getActor/selectors/cards retain behavior and privacy tests. | deleted |
| updateBulkPostsAction, combined bulk input/action constants | UI calls explicit saveBulkPostStatesAction. Integration capacity/replacement/concurrency cases now exercise that live adapter. | deleted |
| eight obsolete test files and assertions for removed subtrees | Replaced by direct review, publication-state, input-validation, visibility, CSS and browser regressions; no fake Editor workflow retained. | deleted |
| clsx, tailwind-merge | No imports in runtime/config/scripts; removed with npm, lockfile updated by npm. | removed direct dependencies |
| migrations, persisted enums/tables, EditorialOverrides adapter | Existing persisted data/history compatibility; import reachability does not determine schema deletion. | retained |
| root logo.svg | Different SHA256 from public/logo.svg; provenance differs and it may be original artwork. Public logo remains actively referenced. | retained |
| 16 uploaded assets | Read-only scan completed all six DB sources, but templated local source paths remain unresolved. Unreferenced output is provisional; no asset deletion without complete provenance. | retained |
| archive/reopen commands/actions | Explicitly retained administrative lifecycle contract in approved spec, with real DB invariants/regressions. Graph reports two exports with no current UI import; preserved intentionally. | retained contract |
| normalize-content-types and seed-categories | Maintenance purpose; exposed as explicit npm commands and documented. Never run automatically during audit. | retained |
| normalizeMemberPage / paginateMembers | P2 replaced unbounded array slicing and permissive parseInt with shared pageBounds plus bounded DB queries. | deleted symbols |
| home-hero__pulse-wave / home-hero-ripple | No rendered consumer; HomeHero regression confirms absent markup. Removed selector, reduced-motion entry and keyframes in P3. | deleted CSS |
| duplicate hero rules | Merged logo transform-style and title-line/accent rules; removed earlier overridden grid animations. Computed styles match at390/768/1440. | consolidated CSS |
| review-redirect.test.ts | The RSC redirect contract was replaced by the JSON decision endpoint. review-request.test.ts covers committed success, invalidation order, conflicts, authentication, strict input, origin, content type and streamed body limits; browser tests cover all three decisions. | replaced test contract |

`npm run audit:unused` reports unreachable source and unused value exports. It does not auto-delete. Computed imports are warnings. `npm run audit:assets` only SELECTs allowlisted asset fields from live/draft/revision/editorial/avatar sources and scans code/config; it does not delete or mutate DB. An incomplete source makes its unreferenced list provisional. Test fixtures prove history-only assets survive.

Dependency advisory output discovered during npm removal is preserved in the local task workspace for V2's compatible-patch review; no forced major upgrade was applied.
