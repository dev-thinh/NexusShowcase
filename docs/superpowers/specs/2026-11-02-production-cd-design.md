# RoboticsLab production CD

## Authorized outcome

Development pushes stay on dev. Only same-repository dev PRs promote to main under GitHub rules. After all existing CI jobs pass for a main push, GitHub-hosted Actions joins Tailscale as tag:roboticslab-ci using OIDC restricted to repo:dev-thinh/NexusShowcase:environment:production plus ref=refs/heads/main. Production environment permits main only. Repository variable PRODUCTION_DEPLOY_ENABLED remains false until setup completes.

## Boundaries and interfaces

Existing production: Ubuntu24, cxnam-owned checkout /home/cxnam/Robotics/NexusShowcase, Node22.23.4, nexusshowcase.service, HTTP127.0.0.1:3100, Funnel roboticslab.tail3f6298.ts.net. Tailscale userspace container project nexusshowcase-access, server TailscaleIP100.69.69.4. Private Serve TCP2222 will forward only to host SSH127.0.0.1:22; Funnel443 stays web only. No router/firewall/Apache/Nginx/PostgreSQL host changes.

Already prepared: dedicated nexusdeploy system user, root-owned home /var/lib/nexusshowcase-deploy, private Node /opt/nexusshowcase/node, owned deployment root /srv/nexusshowcase. nexusdeploy is not in docker/sudo groups. Only sudo commands granted: start nexusshowcase-backup.service; restart nexusshowcase.service. No general shell/root/docker privilege for the deployment key.

SSH entry: forced root-owned /usr/local/libexec/nexusshowcase/ssh-deploy.sh receives exactly SSH_ORIGINAL_COMMAND='deploy <40 lowercase hex SHA> <numeric GitHub run ID>'. It sanitizes environment, then uses flock on /srv/nexusshowcase/deploy.lock to invoke fixed Node and root-owned deploy.mjs. No scp/pty/agent/port forwarding. Pin host ED25519 public key in DEPLOY_KNOWN_HOSTS; no ssh-keyscan trust-on-first-use in workflow.

Root-owned ops installed at /usr/local/libexec/nexusshowcase. Releases under /srv/nexusshowcase/releases; shared .env and .env.database.local in /srv/nexusshowcase/shared (copied without printing); shared storage under /srv/nexusshowcase/storage; current is an atomic symlink. Existing production copied as a bootstrap release before changing its unit, preserving rollback. Do not move/delete original checkout or data. No seed/reset/db push in CD.

## Deployment order

1. Validate SHA/run ID, acquire lock. Verify public GitHub Actions API evidence: exact repository, ci.yml push run on main with exact SHA, and completed successful check(ubuntu-latest), check(windows-latest), database-and-browser jobs. Recheck latest remote main equals SHA; stale requests fail closed.
2. Fetch/archive exact main commit into a fresh release. Link shared runtime env, migration env and persistent storage; write .release-sha. Build candidate only using dedicated user and systemd user scope CPU100%, MemoryMax4G, MemorySwapMax0; npm ci and Prisma generate happen inside this scope too. User manager linger is enabled only for nexusdeploy.
3. Start the existing project-only backup service and require success. Run migrate deploy using its maintenance env in a bounded user scope. Migrations must be backwards-compatible; never automatically restore production DB on rollback.
4. Probe the candidate on loopback3101 in a bounded user unit; GET /api/health must return HTTP200, status=ok, exact release SHA and successful DB connectivity. Stop the probe before promotion.
5. Atomically replace current symlink and restart only nexusshowcase.service. Require matching health on3100. On failure restore previous symlink, restart and verify previous release SHA/DB health; report deployment failure. Old bootstrap has no health endpoint, so initial rollback reports HTTP-only verification explicitly. Require fresh successful oneshot backup evidence rather than a no-op start.
6. Keep failed/candidate releases and previous production for diagnosis; no automatic destructive cleanup. Document disk monitoring and later targeted release retention. Backup retention is the existing independent14-day timer.

Health API GET /api/health: force-dynamic Node route, SELECT1 DB check, no-store; HTTP200 {status:'ok',release:process.env.NEXUS_RELEASE_SHA??null}; DB failure HTTP503 {status:'unavailable'} without raw exception/secret.

## Workflow contract

Add deploy job to existing ci.yml with needs [check,database-and-browser]. if push AND refs/heads/main AND repository var flag true. environment production URL existing Funnel. Serialize deployment, cancel-in-progress:false; a running migration must never be cancelled by a newer push. Deploy job token permissions contents:read,id-token:write. Use a full-commit-pinned tailscale/github-action v4 OIDC vars TS_CLIENT_ID/TS_AUDIENCE tags tag:roboticslab-ci. Environment secret DEPLOY_SSH_KEY; vars DEPLOY_HOST=100.69.69.4, DEPLOY_KNOWN_HOSTS='[100.69.69.4]:2222 ssh-ed25519 ...'. SSH to nexusdeploy port2222, strict pinned host checking, original command deploy SHA runID. Temporary key files mode600, removed on exit, no secrets echoed. No checkout/build/untrusted code in deployment runner. Default flag off makes bootstrap safe.

## Limits and verification

Rollback restores code/service, not schema. Additive migrations require review before merge; destructive migrations are separate maintenance work. Public GitHub API may rate-limit; deployment fails closed and existing site remains. Secrets never transferred to GitHub except dedicated deployment SSH private key. Full automated rollback restores and bootstrap switching need staged server verification, not just local unit tests.
