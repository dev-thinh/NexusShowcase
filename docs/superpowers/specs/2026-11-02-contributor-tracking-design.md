# Contributor workflow tracking

User confirmed contributors should follow work from the initial draft. Creators retain existing upload-role and ownership checks for save, submit and withdraw even when absent from the contributor list. Linked contributors, regardless of upload permission, see their work and workflow stages in the dashboard. Published contributions remain attributed on public profiles.

## Approach

Expand the existing creator-or-contributor dashboard scope to all states rather than create a second workspace or grant contributors write access. Reuse the same scope for ORM lists, accent-insensitive SQL search and grouped statistics; OR membership prevents double counting. Expose update reviewStatus but retain private feedback/version redaction for non-creators. Non-creator unpublished rows show status without a preview link: this change grants tracking, not access to draft content or files. External names without an associated account cannot have a personal workspace.

No schema migration, publication visibility change, mutation authorization change or profile attribution change is needed. Live contributors determine membership; adding a contributor only in an unpublished update takes effect on publication through the existing snapshot pipeline.
