# Main branch policy implementation plan

**Goal:** Accept only same-repository dev PRs into main and document settings that prevent direct pushes.
**Spec:** docs/superpowers/specs/2026-11-02-main-branch-policy-design.md
**Execution:** Inline; user explicitly requested dev/main policy. Preserve existing dirty UI files.

- [x] Add regression cases executing the actual workflow script for dev, feature/main branches, forks and absent PR metadata; observe failure before adding the workflow.
- [x] Implement a read-only, checkout-free PR metadata check including the edited event.
- [x] Document required GitHub rules, first rollout through a PR and the production CI gate.
- [x] Run targeted policy tests and repository checks; commit only this task's files on dev.
- [x] Report separately what is committed and what remains to be enabled in GitHub Settings. No GitHub API write credential is available in this session.

## Verification and rollout state

749 unit tests passed, including nine policy scenarios. TypeScript, unused and architecture gates passed. YAML parsed successfully. Reviewer found PR-controlled workflow tampering; replaced pull_request with the trusted-default-branch pull_request_target event, retained no checkout/secrets/token permissions, and observed the new trigger regression fail then pass. The repository is public with default branch main; the API currently reports main is not protected. No repository settings, production services or CD transport were changed. Only policy files are committed; unrelated dirty UI files remain untouched.
