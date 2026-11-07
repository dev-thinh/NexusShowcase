# Production branch policy

Full CI runs only for pushes to this repository's `dev` branch. A PR from `dev` into `main` reuses the successful CI for its exact latest head SHA. After merging, main runs only promotion verification and CD; it does not repeat tests/build checks on the GitHub runner.

## What the repository enforces

`.github/workflows/main-source-policy.yml` supplies the required `main-source-policy` check. It runs with `pull_request_target`, checks out only `ops/production` at the trusted `github.workflow_sha`, disables persisted checkout credentials, and uses a read-only token. It never checks out or executes the incoming PR branch and never receives deployment credentials. Keep the repository default branch as `main`.

The check rejects forks and every source branch except same-repository `dev`. It reads current PR metadata and the latest `ci.yml` push run for the exact PR head SHA. All three jobs must finish successfully: `check (ubuntu-latest)`, `check (windows-latest)` and `database-and-browser`; skipped or missing jobs do not qualify. A previous success cannot override a newer pending or failed run. The dev head must contain current main.

Opening a PR while CI runs is supported: the gate remains in progress, polling every 15 seconds, without repeating tests. It waits up to 50 minutes. A source update cancels the previous gate and starts one for the new SHA. If CI fails, is cancelled, or the wait expires, fix/push dev or rerun CI and then rerun the PR policy workflow. A failed completed gate does not automatically reopen when a CI run is manually retried.

Main's `verify-promotion` job independently requires a merged same-repository dev PR, a normal two-parent merge commit, source ancestry including the pre-merge main commit, identical source/merge Git trees and successful dev CI. The server repeats the evidence check before deploying. API failures or unexpected evidence stop promotion/deployment.

## Required GitHub settings

For an Active ruleset targeting exactly `refs/heads/main`:

1. Require a pull request; leave the bypass list empty, including administrators/apps.
2. Require **only `main-source-policy` from GitHub Actions**. Remove the old required `check (ubuntu-latest)`, `check (windows-latest)` and `database-and-browser` entries; those remain mandatory through the policy verifier, but are no longer PR workflow jobs.
3. Require branches to be up to date before merging. This closes the window where main advances after the policy succeeds.
4. Block force pushes and branch deletion. Do not use Restrict updates with an empty bypass list.
5. Use **Create a merge commit** for dev -> main; squash/rebase promotion is deliberately rejected because the verifier binds the merge's second parent to the tested dev SHA. Do not require linear history.

Equivalent classic branch protection is supported. Repository settings are not changed by committing workflow files. Check the ruleset is actually enforced for the repository's plan/visibility.

## Roll out from the old workflow

1. Keep `PRODUCTION_DEPLOY_ENABLED=false` during this transition and preserve existing branch protection.
2. Push this change to dev and wait for the entire dev CI workflow to complete successfully. Open a same-repository dev -> main PR. The existing trusted policy on main remains in effect for this first PR; inspect source and exact CI evidence manually as well.
3. Install both updated root-owned `promotion.mjs` and `verify-ci.mjs` on the server as described in [production CD operations](production-cd.md). The old installed verifier expects main CI jobs and will reject the new CD flow.
4. Merge the initial PR through GitHub using Create a merge commit. Keep deployment disabled until the main promotion verification passes and server tools are updated.
5. Switch required checks to `main-source-policy` only, retain strict up-to-date/PR requirements and no bypass. On the next PR, verify the new trusted policy waits for dev CI and rejects an untested/stale head before enabling CD.

Never disable all protections or push main directly to bootstrap. If old required checks block the transition, retain the PR/source check and require the successful checks from the current dev head until the new policy is installed on main.

## Normal use

1. Bring main changes into dev, commit changes and push dev.
2. Open dev -> main while CI runs, or after it passes. The PR gate checks the exact head and waits when necessary.
3. Merge when `main-source-policy` succeeds. Main verifies provenance and deploys when the production flag is true. Health checks, backups, migrations and rollback stay in place.
4. Merge the resulting main merge commit back into dev before the next promotion and push dev to run CI for the new source SHA.

References: [workflow event trust](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request_target), [workflow commit context](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#github-context), [workflow runs API](https://docs.github.com/en/rest/actions/workflow-runs), [branch rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets).
