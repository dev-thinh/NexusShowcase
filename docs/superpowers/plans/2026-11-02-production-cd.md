# Production CD implementation plan

> Use superpowers:subagent-driven-development for independent health/workflow tasks, plus an integrated review. Work stays on dev as explicitly requested; preserve unrelated dirty UI files.

**Goal:** Deploy main only after exact-commit CI via private Tailscale SSH, with isolated releases and code rollback.
**Spec:** docs/superpowers/specs/2026-11-02-production-cd-design.md
**Tech stack:** GitHub Actions, Tailscale OIDC, OpenSSH, Node22, systemd, Prisma/PostgreSQL16.

- [x] Task1: Health route and tests. SELECT1, exact env release, no-store and sanitized503.
- [x] Task2: Workflow job and operator guide. Needs both CI jobs, push main+flag only, OIDC, pinned SSH, concurrency and secrets. Preserve existing CI.
- [x] Task3: Root-owned deployment ops and tests. Validate CI evidence/args, serialize, bounded build/migration/probe, real atomic symlink promotion and rollback, sanitized logs. Prepare user installation/bootstrap templates.
- [x] Task4: Integrated review, checks/build, branch-scoped commit and push. Never change production from this workspace.
- [ ] Task5: Guide operator through installation, limited key, private port, bootstrap, check and enabling flag only after successful dry setup. Record server actions as pending until operator confirms.

## Evidence and rollout ledger

787 unit tests, 108 integration tests, production build, TypeScript/unused/architecture gates passed. Bash syntax and workflow YAML parsed successfully. Verified a real successful main CI run 41480305562 against the exact-SHA validator. Independent integrated review required rollback health verification and fresh successful backup evidence; added failing regressions and fixed both. Tailscale action v4 is pinned to 064b10558093f38325e838ddea35486bdc6b1d5c.

Operator has created nexusdeploy, private Node22, production GitHub environment and disabled deployment flag; Tailscale OIDC variables and restricted tag policy were reported configured. Installing SSH keys/tools/sudoers, private2222 forwarding, migrating the app unit to release symlink, controlled first deploy, rollback rehearsal and enabling the flag remain pending server actions. Runtime .env and ImageKit keys are never requested in chat or GitHub.

Ruling: keep the user-requested dev checkout and commit only CD files; unrelated dirty UI files remain untouched. No production service was changed from this workspace. Backward-compatible migrations are required; code rollback does not restore schema. Public GitHub API failure/rate-limit fails closed. Server rollout verification is required before enabling automation.
