# Dev CI and Main CD Implementation Plan

**Goal:** Run the complete suite only for dev pushes, require trusted PR metadata and exact dev CI evidence before promotion, and deploy main without rerunning the suite.

**Architecture:** Keep CI and CD in ci.yml with mutually exclusive branch conditions. A trusted metadata-only pull_request_target gate waits for the latest push run for the PR head SHA and checks main ancestry. Both the main promotion preflight and the installed server verifier independently validate a same-repository merged dev PR, equal source/merge Git trees, and successful dev CI. Existing backup, migrations, health probes and rollback stay in place.

**Tech stack:** GitHub Actions, GitHub REST API, Node 22, Vitest.

- [x] Add regression tests for pending CI, newest-SHA/run selection, fork rejection, stale main, failed/skipped jobs, merge provenance and tree mismatch.
- [x] Implement dev-only full checks, trusted PR gate, lightweight main preflight and server evidence validation.
- [x] Update branch protection and server rollout documentation, including trusted workflow bootstrap and old installed verifier replacement.
- [x] Run policy/deployment tests, full repository checks and workflow YAML validation; review the final diff.

Deployment activation requires GitHub ruleset configuration and installation of the updated root-owned server verifier. This workspace has no authenticated GitHub administration or production server connection; prepare exact operator steps and report that limitation.

Verification: npm run check passed (1,026 unit tests); the policy/deployment subset passed 61 scenarios. Both workflow files parse as YAML, both production modules pass node --check, and git diff --check is clean. Read-only live GitHub API inspection confirmed workflow path, job names and job head_sha fields match the verifier. An independent review found no important issues. No workflow execution, production activation or repository ruleset mutation was performed from this workspace.
