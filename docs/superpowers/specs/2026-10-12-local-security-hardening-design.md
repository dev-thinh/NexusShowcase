# Local Security Hardening Design

## Scope

Harden the existing local-first NexusShowcase application without adding production deployment infrastructure. Preserve the current Next.js, NextAuth, Prisma, PostgreSQL, and local upload architecture.

## Goals

- Make authenticated identity server-derived for every privileged mutation.
- Prevent password hashes and private user fields from crossing public client boundaries.
- Remove public/default credentials and make local bootstrap and account provisioning safe.
- Validate all mutation inputs and reject unsafe URLs and uploads.
- Prevent account deletion from deleting showcase content.
- Ensure tests cannot silently use the normal development database.
- Refresh role and status from the database so suspension and demotion take effect.
- Complete the rejected-item edit and resubmit workflow.
- Upgrade vulnerable dependencies when compatible with the current application.

## Explicit Non-goals

- CI/CD, production containers, reverse proxies, TLS, cloud secret managers, health endpoints, metrics, tracing, or alerting.
- S3/object storage or multi-instance upload synchronization.
- Production backup, restore, and deployment runbooks.
- Complex deployment migration automation. Schema changes remain usable through the existing local Prisma workflow.

## Architecture

### Authentication and authorization

Every Server Action calls `auth()` internally and treats the session user ID as the only actor identity. A shared server-only helper loads the current database user, requires `ACTIVE`, and checks the required role. Client components no longer receive or submit actor IDs.

The JWT callback refreshes role, status, and session version from the database. Privileged pages continue to load the current user from the database where authorization matters. Password or role/status changes increment a session version so old sessions become invalid.

### Public data boundaries

Prisma queries use explicit `select` clauses for contributor and profile data. Client components receive minimal DTOs rather than raw Prisma records. Public pages never serialize password hashes, email addresses, student IDs, or other private account fields unless explicitly intended.

### Account lifecycle

The destructive seed is replaced with an idempotent local bootstrap. Admin credentials come from required environment variables and are never printed. Destructive fixture reset requires an explicit opt-in environment flag.

New accounts receive a unique temporary credential or activation token and a `mustChangePassword` flag. A signed-in user can change their password after confirming the current or temporary credential. Until completed, protected application flows redirect to the password-change page.

Account removal is a soft-delete/suspension operation. Showcase records and contributor history remain intact.

### Mutation validation

Each Server Action parses unknown input through a Zod schema. Schemas enforce string lengths, enum values, year ranges, collection limits, CUID identifiers, and safe URL protocols. Server code does not trust TypeScript interfaces as runtime validation.

Contributor attribution remains an admin/core-member workflow for now; collaborator consent is outside this local hardening scope.

### Upload safety

Uploads remain under local `public/uploads`, but the server validates file signatures, derives the output extension from verified content, ignores the submitted filename extension, rejects scriptable formats, and records only server-issued upload metadata. Local size limits remain in place.

### Rejected item workflow

Owners can edit their own draft or rejected items and resubmit them. Admins may edit/review any item. Updates run in a transaction, replace nested links/contributors/attachments safely, and never let ordinary users modify published records.

### Test isolation

Tests require `TEST_DATABASE_URL` and refuse to start if it is absent, equal to `DATABASE_URL`, or does not identify a test database. Integration tests use the test URL before Prisma is imported. Security regression tests cover actor-ID substitution, public serialization, unsafe URLs, upload signature validation, stale sessions, and deletion preservation.

## Error handling

Expected authorization and validation failures return stable user-facing errors. Unexpected database/filesystem failures are logged without secrets and return generic messages. Client mutation handlers use `try/finally` so pending state always resets.

## Compatibility

Existing local UI and visual changes are preserved. Client component props change only where actor IDs or raw database records are removed. The local PostgreSQL and filesystem workflow remains available.

## Verification

- Focused tests are written first and observed failing before implementation.
- Full `npm test`, `npx tsc --noEmit`, and `npm run build` must pass.
- `npm audit --omit=dev` is rerun; unresolved advisories are reported rather than hidden.
- No existing unrelated worktree changes are reverted or reformatted.
