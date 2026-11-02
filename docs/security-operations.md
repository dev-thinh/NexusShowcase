# Security operations — 27/10/2026

## Credentials and local PostgreSQL

Node.js 22 or later is required for the maintenance scripts. Keep three separate local files, mode 0600, all ignored by Git:

- `.env`: application runtime DATABASE_URL, AUTH_SECRET, public origin, storage configuration and upload budgets. Runtime role is a login role with no SUPERUSER, CREATEDB, CREATEROLE, schema CREATE or migration-history access.
- `.env.database.local`: copy `.env.database.example`; contains POSTGRES_ADMIN_USER/PASSWORD for local Compose and MIGRATION_DATABASE_URL for schema operations. `npm run db:migrate` reads this file explicitly. Next dev does not read it. On production keep maintenance credentials in a separate migration job, not mounted into the application.
- `.env.test.local`: copy `.env.test.example`; contains only TEST_DATABASE_URL for an actual separate test database. Vitest test config and browser/upgrade scripts load it. It must never identify the runtime database even with another schema.

`npm run db:up` explicitly passes `.env.database.local` to Compose. PostgreSQL publishes only `127.0.0.1:5434`; development Next is also bound to loopback in the current running session. Production must use a private DB network and a trusted HTTPS proxy.

Changing POSTGRES_PASSWORD on an existing Docker volume does not change its stored role password. Rotate the role using an authenticated maintenance connection first, update the private files, verify a fresh connection, then recreate the container preserving its named volume. Back up first. Never use `down -v`, reset, or drop the application schema to achieve this.

For a fresh installation, initialize PostgreSQL with a unique admin secret, apply migrations with the maintenance URL, then provision a separate runtime login matching DATABASE_URL. Through the maintenance connection, the grants are:

```sql
-- Replace the placeholder with a private random password matching DATABASE_URL.
CREATE ROLE nexus_runtime LOGIN PASSWORD '<private random runtime password>'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
GRANT CONNECT ON DATABASE nexus_showcase TO nexus_runtime;
GRANT USAGE ON SCHEMA public TO nexus_runtime;
DO $$ DECLARE item record; BEGIN
  FOR item IN SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO nexus_runtime', item.tablename);
  END LOOP;
END $$;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nexus_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nexus_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO nexus_runtime;
```

Run the default-privilege statements as the role that owns future migration-created tables. Do not grant runtime ownership of tables or schema, and do not grant runtime access to `_prisma_migrations`. There is no migration privilege in the HTTP application.

## Accounts and public URLs

`db:seed` bootstraps only the first administrator. It requires a private password of at least 15 characters and at most 72 UTF-8 bytes, creates a forced-password-change account, and never resets/promotes/enables existing identities. Concurrent bootstrap requests serialize. A suspended existing administrator is preserved for deliberate recovery rather than silently replaced.

`db:seed:demo` requires all of: ALLOW_DEMO_SEED=true, nonproduction NODE_ENV, and a disposable database name containing a `demo` segment. It is create-only for the five demo identities and does not overwrite existing passwords. Do not use this mode on a public deployment. Mock-post seeding is an explicit publishing operation and is not part of normal bootstrap.

In the current local installation, the five previously known demo credentials were rotated to private per-account temporary passwords, all five require a password change, and sessionVersion was incremented. The ignored local account-password artifact is mode 0600. Existing unrelated accounts and the 20 posts were preserved. Share temporary credentials through a private channel and remove the artifact after handoff.

Public profile URLs use `/members/<id>` following the user's updated choice. Previously shared name-slug URLs redirect to the ID URL, preserving query parameters; the slug column and applied migration are retained only for compatibility. Internal IDs are identifiers, not authorization secrets. Session ownership and roles remain authoritative on every mutation.

## Login resource budgets

All credentials attempts share a database-backed 300/minute budget before input parsing, account lookup, bcrypt or per-identity bucket creation. The canonical per-account/alias budget remains. Client forwarding headers cannot create fresh global budgets. A global budget intentionally prioritizes bounding origin workload and can reject legitimate login attempts during a flood; deploy trusted proxy/WAF limits as well for availability. No untrusted IP header is treated as an authenticated source identity.

Each limiter consumption deletes at most 100 expired OTHER buckets using the resetAt index and SKIP LOCKED; the current key is excluded so increment/reset stays atomic. The maintenance cleanup command is still available for bulk housekeeping.

## Upload budgets and ambiguous failures

Defaults, configurable through positive integer UPLOAD_* environment variables:

| Budget | Per owner | Entire installation |
| --- | --- | --- |
| Stored bytes plus pending bytes | 200 MiB | 2 GiB |
| Stored files plus pending files | 200 | 2,000 |
| Pending uploads | 2 | 8 |

Reservations serialize under one short PostgreSQL advisory transaction lock BEFORE provider I/O. Successful registrations record actual byteSize; legacy unknown sizes count as 25 MiB each. Deleted registry entries do not count. Do not set unknown historical sizes to zero or invent owners to bypass budgets.

The reservation ID for application uploads is the canonical `/uploads/...` path, so an operator can identify the exact provider/local object after a crash. Reservations are durable and do not automatically expire: a timed-out provider request or partial local write can leave an unregistered file. The reservation is released after successful registration or verified cleanup, and retained on ambiguous failures. This can intentionally block further uploads after repeated failures rather than silently exceed quota.

For recovery, inspect `upload_reservations` (id, ownerId, byteSize, createdAt), reconcile each path against registry AND actual storage, and only then delete the exact reservation after the object has been registered with its verified size/owner or confirmed absent/deleted. Check both old and current storage providers if configuration changed. Never bulk-delete pending reservations just because they are old. The audit did not delete any provider objects.

## Asset access index

`asset_item_references` is an indexed candidate map maintained by database triggers on item/live/draft/link/attachment/revision changes and deletes. Per-item advisory locks prevent concurrent child edits from losing references. The access check hydrates only candidate items and still verifies exact normalized references and CURRENT status/visibility. External URL lookalikes never grant local permission. There is no positive permission cache that can survive revocation; private history never grants guest access.

The avatar URL lookup has its own index. Tiny gallery records remain checked directly. Storage query work is now proportional to matching provenance instead of every item/history on every read; this does not replace HTTP request/concurrency limits at the proxy.

## Deployment boundaries

These code/local DB changes do not configure an unseen public deployment. Verify HTTPS, secure cookies, Host/forwarded-header handling, provider private-origin/signed-URL enforcement, quotas/billing alerts and restore procedures there. Production CSP still permits inline scripts for the existing Next.js rendering setup; a nonce/hash CSP and MFA are separate hardening work, not confirmed injection flaws repaired by this patch. Do not describe the application as immune to all vulnerabilities.
