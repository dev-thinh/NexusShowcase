# Security hardening implementation plan

**Goal:** Fix follow-up audit F01–F05 and replace public member URL IDs with stable name-based slugs, as requested and clarified by the user.
**Architecture:** Preserve server authorization. Database-backed budgets/reservations and indexed asset references are authoritative across processes. Production bootstrap is non-destructive; demo seeding requires explicit disposable DB designation. Runtime DB uses a restricted role, maintenance uses separate credentials.
**Stack:** Next.js 16, Auth.js, Prisma 6, PostgreSQL 16.
**Approved scope:** User requested all audited fixes and selected names derived from fullName for public URLs. Defaults below are implementation choices; no MFA/cloud account reconfiguration is implied.

- [x] Public unique stable profile slug/backfill, all public links and redirect/invalidation paths; tests for duplicate names and A-vs-B authorization. Implemented independently by profile agent.
- [x] Shared global login budget before per-identity storage; optional explicitly trusted source limit, bounded expired-key cleanup, fail closed. Implemented independently by login agent.
- [x] Separate safe bootstrap and guarded demo seed. Rotate current demo passwords, force first change, revoke sessions; save new initial credentials in ignored mode-0600 local artifact.
- [x] Upload reservations serialized in DB: defaults 200 MiB/200 files per owner, 2 GiB/2000 globally, 2 concurrent per owner/8 globally. Unknown legacy asset byte size counted as 25 MiB. Reservations do not expire automatically to avoid unaccounted remote writes after crashes.
- [x] Indexed asset-to-item references maintained by DB triggers for live/draft/history and cascade deletes; retain final exact TS reference check and existing ACL semantics. Add avatarUrl index. No positive ACL cache that could outlive permission revocation.
- [x] Initialize a new empty disposable template schema in verified dedicated test DB; run migrations there first, full unit/integration checks and targeted HTTP/browser authorization checks.
- [x] Backup runtime before additive migrations. Rotate default PostgreSQL password; create restricted runtime role and separate migration URL; limit Docker publish to loopback and preserve volume. Reconnect and verify privilege denials and data fingerprints/counts.
- [x] Update stale thumbnail assertion to approved object-cover behavior; documentation and fresh audit status with clear residual deployment boundaries.

Validation: tests must demonstrate denial before implementation, upload races/quota/provider cleanup, hidden/private assets and immediate visibility changes, slug uniqueness/stability, expired buckets, forbidden cross-user actions. Run typecheck, complete unit/integration suites, architecture/unused checks, migration diff and runtime metadata checks. No force reset, no unreviewed remote/cloud changes, no credentials in logs.

Completed evidence: docs/security-fixes-2026-10-27.md. Independent review identified ambiguous partial-write release; regression observed failing then passing after retaining reservation before local I/O. Existing UI changes preserved. No Git commit/publish performed.

Updated user preference after rollout: canonical profile URLs reverted to IDs. Historical slug URLs are compatibility redirects to IDs; no applied migration or security safeguards were removed. Verified by 675 unit tests, 101 integration tests and focused browser lifecycle/navigation checks.
