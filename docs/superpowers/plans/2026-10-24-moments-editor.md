# Moments editor implementation plan

**Goal:** Implement the inline admin photo editor approved in the conversation: pencil button, stationary editing grid, Save/Cancel, then resume the public wall.

**Architecture:** Store the ordered gallery in a singleton database record with optimistic version checks. Keep the existing six images as the initial gallery. Reuse the verified image upload endpoint. Read gallery and admin permission through an uncached API. Keep edits local until Save; never delete uploaded files when cancelling because files can be referenced elsewhere.

**Tech stack:** Next.js, React, Prisma/PostgreSQL, Zod, existing asset storage.

## Tasks
- [x] Write and run failing tests for gallery validation and API authorization/version conflicts.
- [x] Add shared gallery model, database migration, read/save repository and API.
- [x] Add admin-only pencil and stationary editor with upload, captions, ordering, visibility, removal, Save/Cancel and error handling.
- [x] Connect deferred loading; support arbitrary gallery lengths and empty galleries.
- [x] Run targeted tests, typecheck, architecture check and browser interaction checks.

## Review focus
Guest/member writes must fail before database mutations. Concurrent admin saves must not silently overwrite. Hidden photos must not be returned publicly. Failed uploads/saves must retain the draft. Editor controls must remain visible on mobile and not inherit hidden animation controls.

## Execution notes
Work in place to preserve the existing uncommitted refactor and homepage changes that this feature builds upon; a clean worktree would omit them. No unrelated files will be reverted or committed.

The configured local runtime database has an unmanaged existing migration history. Applied only the new gallery table SQL directly to the local development database and verified dedicated test template; did not deploy/resolve/reset the historical migrations. Regenerated Prisma and restarted the existing development server to release its locked Windows query engine. Other installations must apply the new additive migration through their established rollout.

Production browser tests exposed an Origin/internal-host mismatch: compare Origin to the incoming Host header, with regression coverage. Next production indexes public files at startup, so added a validated dynamic thumbnail-serving route to make newly uploaded images immediately available; tested URL status and decoded image width.

Read-only code review found no critical or important issues. Verification: 436 unit tests pass, typecheck and architecture checks pass, production build succeeds. Browser coverage uses isolated generated users and gallery records, uploads real files and cleans up those files. The final empty-gallery scenario includes an explicit wait for asynchronous editor loading.

Browser verification completed: all four existing photo-wall scenarios passed on the final production implementation; both new admin/visitor editor scenarios passed, including real upload/image delivery, Save/Cancel, persistence, hidden-photo filtering, stale version rejection, failed-save draft retention, mobile layout and saving an empty gallery. Desktop/mobile screenshots are available under `.tmp/moments-editor-*.png`.
