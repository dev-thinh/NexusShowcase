# Security fixes — 27/10/2026

> Updated user preference: public profile URLs now use IDs again; previous slug URLs redirect to the ID. The slug migration remains for compatibility; all F01–F05 security fixes and server-side authorization remain enabled. Slug-related rollout notes below describe the original security rollout.

This records implementation and local rollout for F01–F05 in `security-audit-2026-10-26-followup.md`, plus the user's requested name-derived public profile URLs. It does not retroactively change the audit's original observations.

## Completed

| Audit item | Implementation | New verification |
| --- | --- | --- |
| Public profile URL IDs | Unique immutable name-derived publicSlug, Vietnamese normalization, reserved-name/duplicate handling, existing-user backfill, canonical links and legacy redirects. Authorization still uses authenticated internal identity. | Concurrency/backfill/rename/route tests; live local browser legacy-to-slug navigation and public profile. |
| F01 demo credentials | Safe non-destructive first-admin bootstrap, separate guarded disposable demo seed, no production fallback password or account reset. Existing five local demo credentials rotated individually, forced change and session-version revocation. | Bootstrap races/existing-account preservation; live known-password comparison and first-login forced-change dialog. |
| F02 DB configuration | Loopback-only published DB port; default administrative password rotated; distinct runtime role has DML only, no ownership/superuser/createdb/createrole/schema create/history access. Migration and test credentials separated from runtime environment. | Fresh restricted-role connection, catalog privilege checks, Docker port inspection, additive migration deploy/diff and before/after content fingerprints. |
| F03 login resource use | Global shared 300/min budget before parsing/account work plus existing canonical account budgets; bounded indexed expiry cleanup with concurrency locks. Untrusted headers cannot split global budget. | Unit rejection/order tests; real DB cleanup, atomic counter and expiry tests. |
| F04 storage budgets | Per-owner/global byte, file and concurrency quotas; durable DB reservations before I/O; actual sizes registered, unknown legacy sizes charged conservatively. Ambiguous provider/local failures retain capacity until reconciliation. | Concurrent quota integration tests; no-I/O-on-denial tests; provider/registry cleanup and partial local-write failure regression. |
| F05 file ACL cost | Indexed asset-item candidate map maintained on item/draft/link/attachment/history writes/deletes, per-item locking, avatar index. Exact current authorization still required; no stale positive ACL cache. | Reference insertion/deletion/encoding/concurrency, foreign/private assets, immediate visibility revocation and migration upgrade tests. |

A cross-user integration test exercises A supplying B's ID to profile/avatar/password inputs and attempting B's draft, role and deletion operations. B's entire user row remains unchanged; legitimate profile/password changes apply only to A. Existing session validation and authorization tests remain in place. An identifier is not an access credential, including after URL changes.

## Local rollout

- Created and validated a mode-0600 pg_dump archive before additive migrations and credential changes.
- Applied `20261027_asset_quotas_references` and `20261027_public_profile_slugs`; Prisma schema diff reports no differences.
- Account count and exact showcase-content fingerprint unchanged; 20 posts retained.
- Five initial passwords now differ from the known demo password; all five require a password change. Password hashes were never printed.
- Private handoff artifact: `.tmp/initial-account-passwords-20261027.json`, mode 0600, ignored. Full administrative recovery credentials are in a separate ignored private artifact, not in this report.
- `.env` is mode 0600 and contains runtime credentials only. `.env.database.local` and `.env.test.local` hold maintenance/test configuration and are not loaded into Next's runtime environment.
- Recreated only the PostgreSQL service with its named volume preserved. Published port is `127.0.0.1:5434` only. Restarted the local Next development server bound to loopback.
- Initialized a fresh owned template schema in the separate configured test database; official integration/browser/upgrade commands now work without resetting any runtime data.

## Verification performed

- `npm run check`: PASS, including TypeScript, unused/architecture checks, 135 unit files / 675 tests.
- `npm run test:integration`: PASS, 29 files / 101 tests. After the final reservation ID change, the quota integration file also passed again (3 tests).
- Production preview build: PASS. A later isolated browser harness production build includes the final storage fix and reservation path metadata.
- Targeted production browser suite: PASS, 10 tests across authentication lifecycle, mutation Origin rejection, profile/member UI and breadcrumbs at desktop/mobile sizes.
- `npm run db:verify-upgrade`: PASS, fresh and legacy schemas and preserved fixture invariants.
- `npm run db:migrate`: no pending migrations; `prisma migrate diff --exit-code`: no differences.
- `npm audit --json`: zero known advisories in installed dependencies.
- Additional browser smoke on the actual local DB: known demo credentials revoked, canonical profile routing works, initial-password dialog appears, runtime role is restricted, 20 posts remain.
- Independent implementation review found a partial-local-write quota-release bug; added a failing regression, fixed it, and observed the test pass. No other Important blockers were reported in the scoped follow-up reviews.

## Boundaries and operations

See `security-operations.md` for the environment files, fresh provisioning/grants, quota defaults and safe reservation recovery. The maintenance commands require Node.js 22+.

A flood can exhaust the shared login budget and deny legitimate logins; origin workload is bounded, but edge protections are still needed for availability. No untrusted X-Forwarded-For value is used as a source identity. Application-level controls do not replace proxy body/time/concurrency limits or provider billing limits.

These changes were applied to the workspace's local installation, not to an unspecified public hosting environment. Public HTTPS/cookies/proxy trust, direct ImageKit-origin privacy, infrastructure firewall rules and backup restore policy must be verified on that deployment. Nonce/hash CSP and MFA remain separate defense-in-depth work; this patch does not claim to remediate a demonstrated XSS injection or guarantee the absence of all future vulnerabilities. Do not remove file ACLs merely to optimize delivery or treat slugs as secrets.
