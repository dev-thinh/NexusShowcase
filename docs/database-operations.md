# Database operations

Owner: repository maintainers. Commands require an explicitly configured PostgreSQL database. Never run reset, resolve or migration rollout against an existing installation as part of a refactor check.

## Fresh installation

Run `npm ci`, `npx prisma generate`, configure `.env`, then `npm run db:migrate`. The chain starts with `20261001_initial_baseline`, generated from the pre-editorial schema preserved in `tests/fixtures/schema-before-editorial.prisma`. It is the current schema minus the three incremental migrations, checked against historical commit `bbd53af^` and their SQL. The legacy tag catalog is included because the last migration removes it. `migration_lock.toml` fixes the PostgreSQL provider.

Run `npm run db:seed` with a private `BOOTSTRAP_ADMIN_PASSWORD`. It creates only the first admin and leaves existing rows alone. `npm run db:seed:mock` adds20 fictional PUBLIC posts idempotently, preserving existing posts. `RESET_DATABASE` defaults false; setting it true explicitly deletes application data and is only for a disposable local installation. CI never enables it.

## Existing unmanaged schema

First back up the database and run the read-only `npm run db:inventory`. Compare the real schema with the migration stages using `prisma migrate diff`; determine exactly which stages are already present. A maintainer can then record only the verified applied migrations with `prisma migrate resolve --applied ...` under a separate approved rollout. Do not blindly mark the initial baseline applied to a partially matching schema, and do not run deploy until the complete diff/history review is accepted. This refactor does not resolve or deploy migrations on the runtime database.

## Existing managed installation

Preserve applied SQL/checksums. Review `_prisma_migrations`, backups and schema diff before rollout. A baseline introduced before existing incremental history needs a deliberate history reconciliation; this repository does not automate it. `npm run db:migrate` is the explicit rollout command after that review. LF/CRLF checkout differences are recorded separately; no existing migration SQL was edited to change its checksum.

## Isolated verification

`docker compose -f docker-compose.test.yml up -d` provides an ephemeral PostgreSQL16 test service on localhost5435. Configure the alternative `TEST_DATABASE_URL` from `.env.example`; its database identity must differ from `DATABASE_URL` and its name must include a `test` segment. `npm run db:verify-upgrade` verifies catalog identity, creates two generated empty schemas, tests the fresh and legacy chains, compares both against the current schema and checks live/draft/revision/editorial/audit/cascade invariants. It cleans up only its owned schemas. It never resets the database.

The verifier records migration application history only in its disposable schemas. Its baseline-then-editorial fixtures model an upgrade with an EDITOR, legacy READY_FOR_APPROVAL item, immutable revision, overrides and audit/comment history. Outputs contain hashes and booleans, no connection strings or raw identifiers. See [verification](superpowers/reports/database-verification.md).

To initialize a newly created empty test database template for integration/browser fixtures, point `DATABASE_URL` explicitly at that dedicated test database and run `prisma migrate deploy`. Never point the command at the runtime URL. Existing application or test databases require a schema/history review first; do not use a force reset. Integration tests then clone each suite into its own UUID schema.

`npm run db:inventory` performs SELECTs only against the configured runtime database. It reports migration history, hashes of normalized collision groups and asset-reference completeness. It does not normalize account casing, change roles, delete assets or print raw emails. Local PRIVATE asset access policy remains a separate unresolved product/security decision; local upload storage must persist across deployments and asset removal requires complete live/draft/history/source provenance.
