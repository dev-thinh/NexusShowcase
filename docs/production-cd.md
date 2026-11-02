# Production deployment operations

This document describes the production CD design and installation procedure. The repository changes do not install or enable anything on the server. Keep repository variable `PRODUCTION_DEPLOY_ENABLED=false` until every staged check below succeeds. The existing manual checkout `/home/cxnam/Robotics/NexusShowcase` remains in place, with its data preserved.

Production is Ubuntu 24 with Node 22.23.4 and `nexusshowcase.service`, listening on `127.0.0.1:3100`. The public URL stays https://roboticslab.tail3f6298.ts.net. The deployment identity is the dedicated `nexusdeploy` system user; never run npm, Prisma, dependency installation, or application builds as root.

## GitHub and Tailscale configuration

Keep development on `dev`. Configure GitHub branch rules so only same-repository `dev` PRs promote to `main`, with required CI checks and no direct pushes/bypasses. The production GitHub environment must permit `main` only; configure any desired environment reviewers before enabling deployments.

The deploy job waits for both matrix `check` jobs and `database-and-browser`. Its condition requires a push to `refs/heads/main` and the repository flag exactly `true`. Deployment concurrency does not cancel a running deployment or migration for a newer push. The job has a 45-minute timeout; SSH keepalives detect an unresponsive connection after six missed 30-second intervals. A job timeout or lost SSH connection requires checking the server lock, service state, and migration status before retrying. The runner executes no repository checkout or application build.

Configure a Tailscale OIDC federated identity with subject `repo:dev-thinh/NexusShowcase:environment:production` and an additional `ref=refs/heads/main` constraint. Grant only `tag:roboticslab-ci`, with tailnet policy allowing this tag to reach the production node's private TCP port 2222. Store its client ID and audience in the `production` environment variables `TS_CLIENT_ID` and `TS_AUDIENCE`. The workflow pins the v4 action to commit `064b10558093f38325e838ddea35486bdc6b1d5c` and uses its [OIDC inputs](https://github.com/tailscale/github-action/blob/064b10558093f38325e838ddea35486bdc6b1d5c/action.yml); no OAuth secret or reusable tailnet auth key is needed.

Configure the existing userspace Tailscale container in project `nexusshowcase-access` to Serve private TCP 2222 to host SSH `127.0.0.1:22`, using its existing host-loopback connectivity. Verify this target from that container's network namespace before applying Serve. Preserve the existing web Funnel on 443. Port 2222 must not be Funnel-enabled. Do not alter router, firewall, Apache, Nginx, or host PostgreSQL configuration.

Set these production environment values:

| Type | Name | Value |
| --- | --- | --- |
| Secret | `DEPLOY_SSH_KEY` | Dedicated SSH private key for the forced deployment command |
| Variable | `DEPLOY_HOST` | `100.69.69.4` |
| Variable | `DEPLOY_KNOWN_HOSTS` | `[100.69.69.4]:2222 ssh-ed25519 <actual server host public key>` |

Read `/etc/ssh/ssh_host_ed25519_key.pub` through an already trusted server session and verify its fingerprint. Replace the placeholder with that exact key, retaining the bracketed address and port. Never populate this variable using `ssh-keyscan` from an untrusted deployment connection. Rotate this pin deliberately if the server host key changes. Keep the private key out of repository files, terminal transcripts, and application runtime env files.

## Server installation and ownership

The dedicated user, root-owned home `/var/lib/nexusshowcase-deploy`, private Node installation `/opt/nexusshowcase/node`, and owned deployment root `/srv/nexusshowcase` are already prepared. Audit their ownership before use. The user must remain outside the docker and sudo groups.

Use a separate reviewed tools checkout, such as `/home/cxnam/Robotics/NexusShowcase-cd-tools`. Keep the running checkout unchanged while installing CD tools. Install reviewed copies of that checkout's `ops/production` files under root ownership:

```sh
sudo install -d -o root -g root -m 0755 /usr/local/libexec/nexusshowcase
sudo install -o root -g root -m 0755 ops/production/ssh-deploy.sh ops/production/build.sh ops/production/start.sh /usr/local/libexec/nexusshowcase/
sudo install -o root -g root -m 0644 ops/production/verify-ci.mjs ops/production/deploy.mjs ops/production/release.mjs /usr/local/libexec/nexusshowcase/
sudo install -o root -g root -m 0440 ops/production/nexusshowcase.sudoers /etc/sudoers.d/nexusshowcase
sudo visudo -cf /etc/sudoers.d/nexusshowcase
sudo loginctl enable-linger nexusdeploy
```

Inspect the sudoers file before installation: it may allow only starting the existing project backup service and restarting `nexusshowcase.service`, with exact executable paths. No shell, wildcard systemctl commands, root npm, or Docker access belongs here. Audit the existing root `nexusshowcase-backup.service`, its ExecStart executable and parent directories: none may be writable by nexusdeploy. It must be Type=oneshot, RemainAfterExit=no, and fail on incomplete backup. CD requires a new successful invocation timestamp for each backup; its independent retention timer remains 14 days.

The deployment SSH key belongs in a root-controlled authorized-keys file. For the existing dedicated home, a typical installation is:

```sh
sudo install -d -o root -g root -m 0755 /var/lib/nexusshowcase-deploy/.ssh
sudo install -o root -g root -m 0644 /path/to/reviewed-authorized-keys /var/lib/nexusshowcase-deploy/.ssh/authorized_keys
```

The one deployment key line must have this prefix, followed by the dedicated public key:

```text
restrict,command="/usr/local/libexec/nexusshowcase/ssh-deploy.sh" ssh-ed25519 <deployment public key>
```

Verify sshd's effective AuthorizedKeysFile resolves to that root-controlled file, StrictModes remains enabled, and no alternate writable authorized-key path or unrestricted key permits deployment-key shell access. `restrict` disables PTY and agent, X11, and port forwarding. The forced entry accepts only `deploy <40 lowercase hex SHA> <numeric run ID>`, sanitizes its environment, and serializes server activity with `/srv/nexusshowcase/deploy.lock`.

Create deployment subdirectories owned by `nexusdeploy`, keeping shared secrets private:

```sh
sudo install -d -o nexusdeploy -g nexusdeploy -m 0750 /srv/nexusshowcase/releases /srv/nexusshowcase/storage
sudo install -d -o root -g nexusdeploy -m 0750 /srv/nexusshowcase/shared
sudo install -d -o nexusdeploy -g nexusdeploy -m 0700 /srv/nexusshowcase/home
```

Copy the existing runtime `.env` and migration `.env.database.local` into `shared` using a trusted local privileged session, preserving their contents without printing them. Set ownership to `root:nexusdeploy` and mode 0640; the dedicated user reads these files but cannot rewrite them. Runtime credentials should keep existing application privileges; migration credentials are maintenance-only. Copy the existing persistent local storage into `/srv/nexusshowcase/storage` while writes are quiesced, verifying paths and contents against the current app's storage configuration. Do not delete or move the original files.

## Bootstrap and staged activation

1. Save the existing systemd unit and its effective configuration (`systemctl cat nexusshowcase.service`) in a root-private backup. Record current service user, runtime paths, storage paths, and Node location. Verify `/opt/nexusshowcase/node/bin/node --version` reports the intended Node version.
2. Copy the existing production checkout, including its already working build and dependencies, into `/srv/nexusshowcase/releases/bootstrap-<original SHA>`. Preserve symlinks correctly; replace its environment and persistent-storage locations with links to the shared paths after checking the actual application paths. Do not run a root build. Record the current commit in `.release-sha` when available. Set deployment release ownership to `nexusdeploy`.
3. Create `/srv/nexusshowcase/current` pointing at that bootstrap release. Confirm the dedicated user can read required configuration and storage and run the existing build through the installed start script. The old checkout and old unit backup remain the manual recovery path.
4. Install the reviewed `ops/production/nexusshowcase.service` as `/etc/systemd/system/nexusshowcase.service`, run `systemctl daemon-reload`, and restart the app in a maintenance window. Verify loopback 3100 and the public Funnel URL. Restore the saved unit immediately if bootstrap does not run correctly. An older bootstrap build may lack `/api/health`; verify its existing pages and service state directly.
5. As `nexusdeploy`, verify the lingering user manager is available and a transient user scope enforces `CPUQuota=100%`, `MemoryMax=4G`, and `MemorySwapMax=0`. Exercise candidate install, generate, build, migration, and probe under these bounded scopes; inspect effective properties. The deployment tools use `/srv/nexusshowcase/home` as HOME and `/run/user/$(id -u nexusdeploy)` as XDG_RUNTIME_DIR; derive the UID locally. The system unit must use `User=nexusdeploy`, `WorkingDirectory=/srv/nexusshowcase/current`, and `ExecStart=/usr/local/libexec/nexusshowcase/start.sh`. The start script exports `.release-sha` as `NEXUS_RELEASE_SHA` and invokes the private Node installation.
6. With the GitHub flag still false, verify key authentication through private 2222, rejection of malformed commands, rejection of shell/PTY/forwarding requests, and pinned host-key mismatch failure. Use a controlled successful main push run to exercise the exact forced deploy command. Never fabricate successful CI evidence.
7. Verify a candidate's health reports the exact release SHA and DB connectivity on loopback 3101, probe cleanup, successful promotion to 3100, and rollback after a deliberately failed post-switch probe. Verify the initial bootstrap rollback reports restart status if it lacks a health endpoint. Perform these controlled checks in an agreed maintenance window before trusting automation.
8. Set repository `PRODUCTION_DEPLOY_ENABLED=true` only after the previous checks succeed. A later main push that passes all CI triggers deployment. Setting the flag false blocks future deployments; it does not cancel an active migration.

## Deployment behavior and recovery

The server independently checks the public GitHub API for the exact repository, `ci.yml` push run on main, SHA, run ID, and completed successful `check (ubuntu-latest)`, `check (windows-latest)`, and `database-and-browser` jobs. It verifies remote main still equals the requested SHA before fetching the exact commit. API failure or rate limiting fails closed and leaves the current release serving.

A new release links shared env and persistent storage, writes `.release-sha`, and installs/builds under the bounded dedicated-user scope. A successful existing project backup is required before `prisma migrate deploy`. CD never seeds, resets, or runs `db push`.

A candidate must return HTTP 200 from `GET /api/health` on loopback 3101 with `status=ok`, matching `release`, and a successful database query. It stops before promotion. Deployment atomically switches `current`, restarts only `nexusshowcase.service`, and checks the same health contract on 3100. Failure restores the previous symlink and restarts the old application, while reporting the deployment as failed. Rollback of a normal release must pass its previous SHA and DB health check. A bootstrap release without the endpoint is checked only for HTTP response and is explicitly reported as unverified for exact release/DB health.

Rollback restores code and service, never the database schema. Review migrations for backwards compatibility before merge; destructive changes require separate maintenance. Do not restore a database automatically to repair a code deployment. For manual rollback, disable new deployments, wait for the deployment lock to become free, select a verified previous release, atomically replace `current`, restart the application, and verify health. Use the saved original unit and preserved manual checkout if recovery requires the pre-CD layout.

Inspect `journalctl -u nexusshowcase.service` and deployment logs without printing shared env files. Preserve failed releases, the previous release, and bootstrap for diagnosis. Monitor `/srv/nexusshowcase` disk usage and available space before builds; there is no automatic release deletion. Once recovery has been verified, remove only explicitly identified unused releases during a separate targeted retention operation. Existing backup retention remains independent.
