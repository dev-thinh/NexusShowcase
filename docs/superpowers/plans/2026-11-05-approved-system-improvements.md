# Approved System Improvements Implementation Plan

> **For agentic workers:** Use executing-plans for root-owned workflow work and dispatching-parallel-agents for independent domains. All work stays on dev; no worktrees or feature branches.

**Goal:** Implement the improvements approved from the 2026-11-05 system review, excluding the member-avatar/name display proposal (finding 3).

**Spec:** `docs/superpowers/reports/2026-11-05-system-review.md`. The user explicitly approved all other findings and the page-specific title convention in conversation; no further design choice is pending.

**Architecture:** Extend existing versioned mutations and security guards rather than creating competing infrastructure. Keep core author UX automatic and short. Preserve public member wall appearance. Keep application mutations isolated to explicit user actions and avoid automatic deletion of runtime assets.

## Tasks

- [x] Reliability: reproduce and fix interrupted-submit outcome handling with stable receipts/retry, compatible recovery selection, and consistent legacy READY_FOR_APPROVAL predicates. Keep editor frozen while submit outcome is uncertain; provide retry without duplicate submission. Test stale versions, replay, pending reload and legacy workflow.
- [x] UI: mobile TOC and important resources before the body, parent section highlight, page-specific metadata (including dynamic authorized article/member titles). Keep desktop layout/member avatar wall intact. Routine success feedback becomes nonblocking; retain destructive confirmations.
- [x] Accounts: admin restoration of disabled members, admin temporary-password reset with forced change and session revocation, actionable login recovery guidance. Test permissions and concurrency; never expose existing hashes or credentials in logs.
- [x] Storage/search: provenance-guarded local orphan cleanup with grace/quarantine and safe filesystem handling; surface usage to admin. Unify bounded, escaped accent-insensitive public/search behavior. No speculative performance indexes or runtime asset deletion.
- [x] Integrate: run full type/unused/architecture/unit checks, isolated integration/browser scenarios and applicable migration verification. Review final diff against all approved findings; fix concrete regressions. Record results and remaining deployment requirements.

## Review Focus

- Lost responses and retries must not duplicate submission/reset or accidentally resume writes on a submitted item.
- Existing local drafts and stale pending requests must not overwrite a newer server snapshot or hide a compatible draft.
- Metadata and active navigation must not leak private publication/member names.
- Restoring/resetting accounts must preserve ownership/history, check admin permission, and invalidate old sessions.
- Cleanup must protect references in drafts/history/galleries and refuse incomplete inventories or unsafe filesystem paths.
- Search must preserve visibility, ordering, pagination, literal wildcard escaping, and bounded input.


## Implementation decisions and validation

- User excluded member avatar/name display changes; public member markup is unchanged (only metadata added).
- Submission receipts share the existing transactional mutation table. The browser persists an uncertain request and freezes editing across retries/reload. Auth/conflict failures cannot disprove an earlier commit; only a validation failure plus a fresh owner-authorized same-version editable workflow read unlocks editing.
- Legacy READY_FOR_APPROVAL updates are supported consistently rather than rewriting unknown production data. Query and withdrawal integration tests exercise that state.
- Restoring accounts retains identity/history and increments sessionVersion. Reset uses a random temporary credential, CAS and a new temporaryPasswordConsumed boolean. Self-reset is rejected; a temporary login atomically consumes the credential, and changing the password clears the flag and revokes old sessions. New migration applied to the verified local dev and dedicated test databases.
- Local orphan cleanup remains an explicit operator action; runtime assets were not deleted. On Linux the local deletion implementation pins ancestors using O_NOFOLLOW and proc file descriptors, validates file identity, and preserves reference/quarantine/grace checks. Incomplete inventories and unknown files refuse cleanup.
- An independent whole-change reviewer found uncertain-submit unlocking and one recent-activity legacy predicate omission. Both were addressed; the submission helper has an explicit authorization/validation regression and browser session-expiry scenario.
- Full verification and browser outcomes are recorded in `../reports/2026-11-05-approved-improvements-results.md`.
