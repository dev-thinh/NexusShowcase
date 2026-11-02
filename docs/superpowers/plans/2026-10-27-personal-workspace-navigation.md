# Personal workspace navigation and filters

**Approved request:** Match My Posts status filters to Admin Members role-filter styling; paginate Admin Members by10; show personal Posts/Profile active tabs like Admin tabs; use accurate personal/public profile breadcrumbs.

- [x] Visible selected filter: dark-blue filled pill, white label/count; wrap on mobile, preserve query, reset page on filter change.
- [x] Personal navigation: underline active tab, one aria-current; render on both dashboard and the authenticated owner's profile only. Account dropdown also visibly highlights the current personal area.
- [x] Personal breadcrumb: Home / My Profile, while another person's profile stays Home / Members / Name. Dashboard/new/edit labels consistently use My Posts as parent.
- [x] Admin Members: 10 rows for filtered/unfiltered/search; retain total/pageclamping and all other page sizes. Independent pagination task with actual database regression tests.
- [x] Verify red/green unit tests, full checks/integration, and production browser desktop/mobile flows. Rebuild running isolated demo to show updated UI without reseeding its data.

Validation: `npm run check` passed (690 unit tests); integration passed (106 tests); production browser checks passed (7 tests, mobile and desktop). Isolated demo rebuilt and `/login` returned HTTP 200 on port 3002; no reseeding.

## Follow-up layout approved by user

- All paginated lists use the library footer layout: page information on the left, page controls on the right, top spacing and divider. Shared `PaginationFooter` prevents placement differences.
- Member result count sits outside the card, aligned right, without a border.
- Dashboard and own profile no longer render duplicate personal tabs; top navigation retains active state and accurate breadcrumbs.
- Public member directories render the entire active, non-deleted role groups, preserving contribution ranking and public field selection; stale pagination parameters do not truncate the list. Admin remains ten members per page.
- Verification: 690 unit tests, 107 integration tests, eight production browser checks passed (390px and 1440px); git diff whitespace check passed.
