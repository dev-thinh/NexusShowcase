# Compact profile implementation plan

**Goal:** Make member profiles compact, friendly and easy to edit.

**Design:** One responsive summary contains avatar, name, role, biography, social links and owner actions. Remove the separate management heading, navigation and sidebar. Research and project category links display one list at a time and preserve pagination in the URL. Editing opens the existing accessible Modal with a two-column form on desktop and a single column on mobile. Preserve avatar upload, preview, removal, save errors and ownership checks.

**Approaches:** The user delegated layout decisions after the proposed horizontal summary, modal and category tabs. This approach reduces page height more than retaining the sidebar and an inline form.

**Architecture:** Keep the profile page server-rendered and use query parameters for category selection. Reuse the shared Modal and the existing ProfileEditor and server actions; no new dependencies or database changes.

**Files:** `src/app/(shell)/(site)/members/[id]/page.tsx`, `src/features/identity/components/profile-editor.tsx`, `tests/unit/member-profile-layout.test.tsx`.

- [x] Add profile render tests for owner/visitor actions, one publication category at a time and category pagination.
- [x] Consolidate the summary and category navigation; reduce empty states to a compact message. Use compact publication rows and six results per page on profiles; retain the existing query default elsewhere.
- [x] Move editing into Modal, group avatar and primary fields, place social links in a two-column grid, and keep save/cancel together.
- [x] Run TypeScript, targeted profile/avatar tests and architecture checks; inspect responsive rendering if a local browser is available.

Browser inspection: public profile returned HTTP 200, had no horizontal overflow at 390/768/1440px, and project category navigation passed. Desktop profile content measured 902px high with six publications; mobile 1200px. Authenticated modal interactions were not browser-tested.
