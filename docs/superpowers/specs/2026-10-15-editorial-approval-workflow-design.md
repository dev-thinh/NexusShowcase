# Editorial Approval Workflow Design

**Date:** 2026-10-15

## Objective

Make the editorial workspace follow a strict Author → Editor → Admin workflow, present submission data safely and clearly, and reuse the same visual system as the author submission form.

## Workflow and permissions

### Author submission

Authors create drafts and submit revisions. A submitted revision is immutable and moves the item to `PENDING_REVIEW`.

### Editorial review (`PENDING_REVIEW`)

- The assigned Editor may edit publication fields and the editorial checklist.
- The assigned Editor may add internal comments or comments addressed to the author.
- The assigned Editor may request an author revision or hand the editorial draft to Admin.
- The Editor may preview author resources but may not rename, replace, remove, reorder, or exclude them.
- Admin may assign an Editor and inspect progress, but may not edit the editorial draft, hand it off, or contact the author directly at this stage.
- Handoff requires a category, a complete checklist, and no unresolved required author comments.

### Approval (`READY_FOR_APPROVAL`)

- The editorial draft, checklist, comments, and author snapshot are read-only.
- Admin may preview the effective publication and author resources.
- Admin may publish internally, publish publicly, return the item to Editor with a reason, or reject it with a reason.
- Admin may not edit publication fields or request an author revision directly.
- Returning to Editor creates an internal required comment and moves the item back to `PENDING_REVIEW`.
- If the author must change the submission, the Editor converts the Admin feedback into an author-facing revision request.

### Publication visibility

Publication is one atomic transaction:

- Internal publication sets `status = PUBLISHED` and `visibility = PRIVATE`.
- Public publication sets `status = PUBLISHED` and `visibility = PUBLIC`.
- Internal is the default selection in the approval UI.
- The chosen visibility is recorded in the publication audit event.

Backend authorization and state checks enforce these rules; hiding controls is not treated as authorization.

## Status presentation

All visible status text comes from one shared status-presentation module. Raw enum values are never rendered to users.

| Enum | Vietnamese label |
|---|---|
| `DRAFT` | Bản nháp |
| `PENDING_REVIEW` | Chờ biên tập |
| `REVISION_REQUESTED` | Chờ tác giả bổ sung |
| `READY_FOR_APPROVAL` | Chờ phê duyệt |
| `PUBLISHED` | Đã xuất bản |
| `REJECTED` | Không được phê duyệt |
| `ARCHIVED` | Đã lưu trữ |

The shared module supplies labels and badge presentation so dashboard, review queues, workspace, preview, and detail pages cannot drift.

## Contributor snapshots

New submission snapshots store the contributor's display name alongside the stable user ID. This preserves the name shown at submission time if the account name later changes.

For existing snapshots without a display name, the review route resolves user IDs in one batch and passes a lookup map to the source revision view. Missing or deleted users fall back to a neutral `Thành viên` label; technical IDs are never displayed.

External contributors continue to use their submitted name and affiliation.

## Resource policy and preview

Author resources are immutable source evidence:

- They are copied unchanged from the selected author snapshot into the publication.
- Editorial overrides no longer accept a `resources` field.
- Editor and Admin cannot modify resource metadata or publication inclusion.
- Problems are handled through field-level feedback to the author.

The source view shows safe metadata instead of storage locations:

- image/document: label, file name, type, and formatted size when available;
- link: label and hostname;
- no local path, object key, or full storage URL is printed in the interface.

A shared resource-preview modal provides:

- inline image preview;
- embedded PDF preview;
- an external-link action for web links;
- a download action for unsupported files.

The underlying URL remains an opaque delivery value used by `src`, `href`, or a future signed-storage URL. The UI does not derive behavior from local `/uploads` paths, allowing a later storage provider to replace local delivery without redesigning the workspace.

## Field-level feedback

During `PENDING_REVIEW`, the assigned Editor can add feedback to an individual field:

- `Nội bộ` is visible to Editor/Admin only.
- `Gửi tác giả` is visible to the author and may be a required change or suggestion.
- Required author feedback must be resolved before editorial handoff.

During `READY_FOR_APPROVAL`, feedback controls are read-only. Admin returns the whole editorial draft to Editor with a reason instead of creating author-facing feedback.

The resources section has its own field-level feedback control, while individual author resources remain immutable.

## Editorial override presentation

- A field with an override shows only `Khôi phục bản gốc`.
- The redundant `Đã biên tập` badges are removed.
- Restore removes that field from the override object and immediately shows the source value.
- Category has no author source value; restoring it clears the editorial selection.

## Visual system

The review workspace reuses the author form's design tokens and component classes:

- outer document surfaces use `panel-detail`;
- nested groups use `panel-nested`;
- cards use the shared `rounded-lg`/`rounded-md` hierarchy;
- responsive padding follows the author form's `p-6 sm:p-8` rhythm;
- controls share height, border, focus ring, typography, and disabled treatment;
- actions use `action-primary-detail` and `action-secondary-detail`;
- the preview modal uses the existing modal/panel conventions.

The two-column comparison remains because it supports source-versus-publication review, but its surfaces, spacing, and responsive behavior match the submission editor.

## Data and action changes

- Extend snapshot contributor data with an optional `displayName` for backward compatibility.
- Remove `resources` from accepted editorial overrides and from editorial field editing.
- Add `visibility` to the publication action input.
- Update publication to persist status and visibility together.
- Restrict editorial handoff and author-revision actions to the assigned Editor in `PENDING_REVIEW`.
- Restrict publish, return-to-editor, and reject actions to Admin in `READY_FOR_APPROVAL`.
- Make save-editorial-draft reject writes outside the assigned Editor's active review state.
- Preserve existing snapshot JSON without a database migration; readers handle the optional display name.

## Error handling

- Unauthorized role/state combinations return explicit action errors even if called outside the UI.
- Resource preview failure shows metadata plus an open/download fallback.
- Missing contributor accounts never expose IDs.
- Publication rejects missing category, incomplete checklist, unresolved required feedback, or a stale item state.
- Concurrent state transitions continue to use conditional updates so only one final action succeeds.

## Testing

Unit tests cover:

- every status label and the absence of raw enum rendering;
- role/state authorization for all workflow actions;
- publication visibility validation and persistence;
- contributor display-name snapshotting and legacy fallback;
- safe resource metadata formatting;
- removal of resources from editorial overrides;
- restore-only override indicators;
- read-only Admin approval controls;
- shared panel/action tokens in the review workspace.

Integration tests cover:

- Author → Editor → Admin → internal publication;
- Author → Editor → Admin → public publication;
- Admin → Editor return followed by Editor → Author revision request;
- immutable resource propagation from revision snapshot to publication;
- rejected direct Admin-to-Author and Admin editorial-write attempts.

The existing end-to-end workflow is extended to assert localized statuses, resource preview availability, and both publication visibility outcomes.
