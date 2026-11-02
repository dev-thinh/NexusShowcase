# Production branch policy

Development changes are pushed to `dev`. Production promotion uses a pull request from this repository's `dev` branch into `main`. A fork branch also named `dev` does not qualify. Production CD must run only after the existing CI jobs succeed on the exact `main` commit after merge; a successful `dev` run alone is insufficient.

## What the repository enforces

`.github/workflows/main-source-policy.yml` creates the `main-source-policy` check for PRs targeting `main`. It validates both repositories and the exact source/target names. It reruns for PR edits (including retargeting) and source updates. The metadata-only `pull_request_target` job runs the trusted default-branch workflow, not a PR-supplied version of the validator. It needs no token permissions, checkout, package installation, production credentials or access to the server. Never add a PR checkout or execute PR-supplied scripts in this workflow. The repository default branch must remain `main`.

This file does not configure repository rules, block Git pushes by itself, or install CD. Those settings and deployment transport are separate. The existing CI workflow continues to run all tests/builds on pushes and PRs.

## Activate GitHub enforcement

As repository owner, open **Settings -> Rules -> Rulesets -> New branch ruleset**:

1. Name: `main-only-from-dev`; enforcement: **Active**.
2. Target exactly the `main` branch (`refs/heads/main`), not a wildcard matching `dev`.
3. Leave the bypass list empty, including administrators and deployment apps.
4. Enable **Require a pull request before merging**. For a solo maintainer, zero required approvals permits opening and merging your own PR while still requiring checks; choose a reviewer count only if another trusted reviewer is available.
5. Enable **Require status checks to pass**. Select these exact checks from **GitHub Actions**:
   - `main-source-policy`
   - `check (ubuntu-latest)`
   - `check (windows-latest)`
   - `database-and-browser`
6. Enable **Require branches to be up to date before merging**. The check names must match the actual names shown on the PR; do not use the workflow's display title in their place.
7. Enable **Block force pushes** and **Restrict deletions**.
8. Do not enable **Restrict updates** with an empty bypass list: that can block legitimate PR merges as well. The PR requirement and required checks supply the intended gate.
9. Save the ruleset. Use **Create a merge commit** for promotion of the long-lived `dev` branch; a linear-history rule would conflict with this merge method.

If Rulesets are unavailable for the repository's plan/visibility, use a classic branch protection rule for `main` with equivalent PR and check requirements, disable force pushes/deletions, and enable **Do not allow bypassing the above settings**. Some protection features depend on the GitHub plan; do not assume a warning about unenforced rules means protection is active.

GitHub docs: [rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository), [available rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets).

## First rollout and verification

Bootstrap the trusted workflow once: push it to `dev`, open a same-repository `dev -> main` PR, manually verify that source and wait for the existing CI checks before merging through GitHub. The new `pull_request_target` policy cannot run from an incoming PR until its workflow is installed on the default branch (`main`), so do not require the new check before this initial merge. Keep the PR requirement and existing CI protection enabled during bootstrap. Once installed on main, the next `dev -> main` PR runs the trusted policy check; select `main-source-policy` as required after its first run and before merging that next PR. A check normally needs a recent run before it appears in the selector. Never push `main` directly.

Verify in GitHub that a `dev -> main` PR is green for `main-source-policy`, while a disposable other-branch PR into `main` fails that check and cannot merge. Confirm the ruleset is Active with no bypass actors before treating direct pushes as blocked. Do not attempt a real production push simply to test rejection.

Repository owners can edit repository rules, and a trusted dev promotion can update the default-branch workflow. Enforcement assumes trusted maintenance of those settings and review of workflow changes. An incoming non-dev PR cannot replace the validator that runs for its own PR because the policy uses the trusted default-branch workflow.

## Normal development and deployment

1. Update and push `dev`; CI runs.
2. Open a PR with base `main`, compare `dev` in this repository.
3. Resolve conflicts and update `dev` as required; wait for all required checks.
4. Merge through GitHub. CI runs again for the merged `main` SHA.
5. The planned CD job must depend on every required CI job, use `github.event_name == 'push' && github.ref == 'refs/heads/main'`, deploy that exact SHA, and serialize production deployment. PR jobs and `dev` pushes must never deploy.
6. Bring the merge commit back into `dev` before the next promotion, for example by merging `origin/main` into `dev` and pushing `dev`. This keeps the long-lived branch aligned with strict up-to-date checks.

The current server still runs the manually deployed `dev` checkout. Switching production to immutable releases of `main`, private Tailscale deployment access, backups/migrations and health checks remains part of the CD rollout, not something this policy workflow has already performed.
