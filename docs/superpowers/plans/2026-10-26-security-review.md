# Security review and remediation plan

**Goal:** Fix demonstrable security defects while preserving the existing application and verifying every affected trust boundary.

**Scope:** Source and dependency review of authentication, object authorization, public data selection, file storage/delivery, rendering, mutation APIs and configuration. This is not an assertion that production infrastructure or the application is free of all vulnerabilities.

**Architecture:** Keep the current Next.js/Auth.js/Prisma architecture. Enforce authorization on the server independently of route identifiers. Reuse shared asset ACLs before accepting new file references. Validate unsafe HTTP mutations before body parsing and enforce byte limits while streaming.

**References:** Bundled Next.js data-security and Playwright guides; OWASP IDOR and CSRF prevention cheat sheets.

## Tasks

- [x] Inventory routes, Server Actions, session validation, public DTOs, upload/download paths and dependencies; independently review identity, assets and content.
- [x] Asset references: reproduce private-file reference laundering; check existing access before persisting draft references, including encoded URLs; reject existing self-grants for registered assets; verify owned/public reuse remains functional.
- [x] Identity: add per-account password-change throttling; enforce a 15-character minimum and bcrypt's 72-byte limit for new credentials; unify equivalent institutional login aliases' throttle buckets without rejecting historical credentials.
- [x] HTTP mutations: regression tests for upload CSRF, missing/foreign origins, mismatched schemes and oversized streaming gallery payloads; implement shared origin and bounded JSON helpers for upload/galleries; retain the existing bounded review handler.
- [x] Apply upload throttling at the callable Server Action boundary as well as before API body parsing; remove unnecessary production CSP unsafe-eval.
- [x] Verify with repository checks (647 unit tests), complete integration (84) and E2E (60) suites, production build, migration verification and dependency audit. Findings and deployment limits recorded in `docs/security-review-2026-10-26.md`.

## Constraints

- Public opaque profile IDs are not credentials; do not rename routes as a substitute for access control.
- Do not run destructive tests against the runtime database or disclose credentials.
- Preserve public profiles, authorized file reuse, native browser behavior and current success dialogs.
- Do not increase timeouts to disguise regressions or remove security checks to pass tests.
- Findings require a concrete attack scenario, code location and regression evidence. Severity depends on the attacker's prerequisites.
- Keep operational requirements explicit: HTTPS, protected storage/provider settings, reverse proxy request limits and secrets remain deployment responsibilities.
