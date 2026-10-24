# Runtime architecture

Routes in `src/app` compose features and handle URL/response concerns. The persistent shell composition belongs in `app/(shell)/_components`; `(site)`, `(account)` and `(auth)` preserve public URLs while owning their layouts/access gates. Only the account region awaits session inside the header. Feature ownership:

| Module | Owns | Allowed feature dependencies |
| --- | --- | --- |
| identity | Auth, request session, actors, member accounts | none |
| assets | Upload validation and local storage | identity |
| publications | Published projections, visibility/pin state, citations, cards | identity |
| members | Public directories and member presentation | identity, publications |
| submissions | Author draft, sections, editor, submission versions | identity, assets, publications, members |
| review | Admin decisions, submitted snapshots and legacy adaptation | identity, submissions, publications |

`src/server` owns DB/configuration/observability. `src/shared` owns primitives and client-safe utilities and must never depend on a feature. Shared pagination can be used by any feature. `model` modules must remain usable without a Next request; filesystem/DB operations belong in `server`. A file with `use server` is an action adapter that clients may reference; server implementation modules must never enter the client dependency graph. Type-only imports do not create runtime dependencies.

`npm run check:architecture` inspects import/export, literal dynamic import and require edges, detects runtime cycles, checks feature direction and traces transitive client imports of server implementation. Tests cover these rules with independent fixture graphs. The checker is conservative for literal imports; computed runtime paths require manual review. `scripts/architecture-map.json` records moves, aggregate splits and later deletions; it contains no backups or source duplicates.

Actor identity comes from the server session and is checked against the current database account. Clients send desired state and observed versions, never actors. Serializable state commands own publication/role invariants; action adapters authorize and invalidate after commit. Public selectors and explicit citation mappers limit client data. Dedicated test database schemas and browser fixtures are isolated from the application database.

Feature query modules apply visibility/ownership to count and page queries, hydrate only required DTO fields and use stable ID ties. Shared pageBounds rejects partial numeric input. Public member ranking uses verified Vietnamese PostgreSQL collation; databases without it scan minimal ranking metadata and hydrate only the page. Contributor lookup is actor-protected, debounced and sequence-guarded. Session cache is request-scoped; no user-specific global cache exists.

`npm run check` runs typecheck, unused gate, architecture and unit tests without a database. The unused gate rejects unreachable files, computed-reference warnings, unknown unused exports and stale exceptions. Its only explicit exceptions are the approved archive/reopen lifecycle contracts in `scripts/unused-exceptions.json`. Asset audit remains read-only and separate: incomplete provenance forbids asset deletion.

Production browser harness provisions its own UUID schema and generated credentials, builds the app, verifies workflows and cleans up. Traces stay off for credential flows; failure traces are enabled/uploaded only for guest navigation/presentation tests. CI uploads allowlisted numeric reports and those guest traces, never harness manifests, environment files, dumps or auth state. Local upload directories require persistent storage; PRIVATE download access is an unresolved policy separate from list/metadata privacy. See database operations and performance reports for deployment limits.

Internal links share NavigationLink; the persistent shell shows a destination skeleton immediately while retaining the old route subtree hidden until commit. Native route loading boundaries then take over. Home data sections defer their server loaders until IntersectionObserver detects proximity to the viewport; auth and visibility stay server-side, with no eager section query during the home page render. Publication lists use bounded SQL skip/take, not client-side slicing of the complete result. Browser harness builds use `.next-harness` so an active `.next` dev server cannot corrupt their output. See the navigation/viewport followup report for verification and benchmark protocol changes.
