# Refactor verification — 2026-10-21

Subsequent user request changed immediate-navigation presentation and viewport-deferred home loading. This report records the original15-task handoff; see the [followup verification](2026-10-21-navigation-viewport-followup.md) for the newer behavior and check counts.

Status:15/15 planned implementation/delivery tasks completed inline. Final local functional gates pass;88 benchmark observations and their regressions are reported explicitly below. This does not certify uniform performance improvement or production rollout readiness.

| Requirement | Task | Verification | Latest evidence |
| --- | --- | --- | --- |
| Dedicated DB identity/owned cleanup | F1 | guard unit + real schema fixtures |20 guard cases; isolated integration |
| Authoritative actor, password/revocation policy | F2/F5 | auth/unit/integration |380 full unit;57 full integration |
| Public visibility/minimal DTO | F3/P2 | privacy/ranking/portfolio integration |guest PRIVATE metadata excluded; zero-public members retained |
| Versioned drafts/no lost local edits | F4/M2 | editor unit + concurrent DB writes |stale and concurrent saves rejected; latest local edits retained |
| Atomic pin/role/review | F5/M2/V3 | PostgreSQL races/rollback |last Admin disable race repaired; legacy snapshots publish without history mutation |
| Module ownership/client boundary | M1/M2 | check:architecture |0 violations |
| Proven unused code removal | M3/P2/P3 | check:unused + deletion manifest |0 unreachable/unknown dynamic;2 documented lifecycle exceptions |
| Persistent shell/latest navigation | P1 | production browser delayed/rapid/history/new-tab |final14/14 browser passed; delayed feedback below200ms, last destination/history/native modified clicks preserved |
| Bounded lists/contributor paging | P2 | query capture + SQL integration/browser |search/page/return/filter/selected-name journeys |
| Presentation/observer/IME/upload | P3/V3 | computed-style browser/unit |final14/14 browser includes IME, exact-byte PDF upload/download, computed styles/reduced motion at390/768/1440 |
| Fresh/legacy DB setup | V1 | db:verify-upgrade |both schema diffs empty;8 fixture invariants |
| Seed20 idempotency | V1 | real seed integration |two runs,20 PUBLIC mocks; existing PRIVATE item untouched |
| Commands/CI/dependency patches | V2 | npm ci, check, build, integration/browser |npm ci0; Next15.5.28/React19.3.1/PostCSS8.5.31; remote CI unverified |
| Fresh final checks and review | V3 | check/integration/build/browser/benchmark |380 unit,57 integration,14 browser; production build and upgrade verifier pass;88/88 final observations; cleanup all zero |

Fresh independent whole-branch review found no Critical and two Important issues. Both were reproduced RED and repaired inline: stale Admin/target disable race (transaction + conditional update) and persisted legacy tags/issuer compatibility (explicit projection, strict external inputs retained). Related integration suites and full check/integration pass. One Minor preventive architecture-gate rule remains deferred; inspected infrastructure currently complies.

Final browser stress also reproduced an intermittent committed approval with a303 RSC redirect while the old page remained pending (9/10 passed). The form-action experiment did not resolve it and was discarded. Decisions now use a bounded, same-origin JSON endpoint with authoritative authentication/validation and post-commit invalidation; successful responses trigger a fresh document navigation to the review queue. Errors keep the current input, duplicate decisions are guarded, and completion after unmount does not navigate. Seven endpoint unit cases,10/10 repeated approval journeys (first publication and approved update), and the full14/14 browser gate passed with unchanged timeouts and zero retries. Ordinary site navigation retains the persistent shell. This late transport fix was verified inline after the independent review, not separately approved by that reviewer.

Final command evidence in the retained local task workspace:

| Command | Result | Log |
| --- | --- | --- |
| `npm run check` | exit0;73 files,380 unit tests; typecheck/unused/architecture pass | `v3-http-check.log` |
| `npm run build` | exit0; production build | `v3-http-build.log` |
| `npm run test:integration` | exit0;16 files,57 tests | `v3-http-integration.log` |
| `npm run db:verify-upgrade` | exit0; fresh and legacy paths, fixture invariants | `v3-http-upgrade.log` |
| `npm run test:e2e` with Edge and presentation comparison | exit0;14/14, zero retries | `v3-http-browser.log` |
| `npm run test:e2e -- --grep 'admin directly approves' --repeat-each=10` | exit0;10/10 repeated journeys | `v3-review-http10.log` |

These local checks ran on Windows/Node24, not the remote Node22 CI matrix. The workspace is retained because no commit history exists for these changes; it contains immutable before/after snapshots and sanitized logs, excluding environment files.

`npm run bench:navigation` exited0:20/1000 items,100 members, ten warm observations per route plus cold-browser samples,88/88 visible outcomes. Environment and metric definitions match the baseline; framework patch versions differ intentionally. Final home1000 median627.1→347.8ms (-44.5%), p95633.9→379.5ms (-40.1%); pending p95 across all route/dataset groups is at most8.4ms. Cached routes show increases: median up to30.2ms and p95 up to80.2ms. Consequently the plan's aspirational uniform no-regression comparison is **not established**, and these increases are not labeled proven noise. The task closes with the measured limitation rather than a fabricated all-routes improvement or speculative policy/cache changes. See [all final measurements](refactor-final-performance.md), alongside the earlier matched-software [P3 comparison](refactor-performance.md).

Cleanup verification after all harnesses:0 generated test/upgrade schemas,0 users/items in the test template,0 harness directories. Three leftover empty UUID test schemas were removed only after dedicated-DB identity, empty-table, no-other-connection and external-reference checks. No application data was changed. Original20 mock slugs are preserved; architecture map records97 moves and24 explicit deleted paths. The redirect test replacement is separately explained in the deletion manifest.

Original user changes remain represented in moved feature files;20-post mock script remains, with real idempotency coverage. No compatibility aliases, source backups or unreachable runtime files are retained. See [deletion/retention manifest](refactor-deletions.md), [architecture](../../architecture.md), [walkthrough](2026-10-21-refactor-walkthrough.md) and [performance](refactor-performance.md).

The complete ordered [execution rulings and deferred minor](refactor-rulings.md) are preserved for review, including the cost of retaining uncommitted snapshots and the measured performance limitation.

Limits:16 dependency advisories remain and need major tool/dependency work; uncertain16 uploads and original logo remain because provenance is incomplete; PRIVATE asset URL access and identifier casing migration are excluded decisions; runtime DB is unmanaged and requires deliberate reconciliation before rollout. Remote GitHub CI/Node22 jobs have not run in this local Node24 Windows session. No runtime DB deploy/reset/resolve, asset deletion, push, merge or deployment occurred. No commits were created because existing Git author identity was absent; per-task snapshots remain available locally.
