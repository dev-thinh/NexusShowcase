# Admin tab workspace

Approved design: persistent “Quản trị” heading and four left-aligned tabs: Tổng quan, Phê duyệt, Thành viên, Nội dung. Active tab is bold with a dark underline; inactive tabs use muted readable text. Only the content below the tabs changes. Personal posts/profile stay in the account menu.

Implementation:
- Put authentication, common container, heading and navigation in the admin layout. Each child page renders a section, not its own page shell.
- Add AdminTabs using native Next links with scroll=false so the global whole-page loading replacement is bypassed. Keep independent per-tab list URLs in the persistent component; retain URL, reload and browser history support. Nested review detail keeps the review tab active.
- Simplify overview to three summary metrics and five recent activities. Move pin/visibility bulk actions and publication management to a searchable, filtered, paginated Content tab.
- Preserve member search/role filtering and review pagination. Review detail gets an explicit back-to-list action within the shared workspace.
- Remove admin navigation from personal posts, preserving personal navigation and account-menu access.
- Add content-only loading and error states below the persistent tabs; avoid top-level page animation when only an admin route changes.
- Verify route authorization, active/muted tab rendering, URL restoration, overview/content queries and existing workflows; run TypeScript, unit/architecture checks and read-only desktop/mobile browser checks.

No database schema changes. Existing server actions and unified success dialogs remain in use.

Implemented: shared authorized admin layout; left-aligned four-tab navigation using the site's 600 emphasis weight and 400 muted inactive weight; content-only loading/error states; five-item recent activity preview; content search/status filters with pin/visibility actions; member search via client navigation; snapshot-aware review search and sanitized return URLs; personal navigation separated from admin tabs. Publication mutations also invalidate the new content route.

Validation: TypeScript, all 590 unit tests and architecture checks pass. Read-only browser tests verify all four tabs at 390/768/1440px, stable heading/tab DOM and position, active/inactive computed font weights, no whole-page skeleton, preserved member/content/review search and filters, native Back/Forward, and guest redirect. Screenshots are in `.tmp/admin-tabs-*.png`. Review detail return URLs and access rules are covered by unit tests; no live review decisions or account/publication mutations were performed.
