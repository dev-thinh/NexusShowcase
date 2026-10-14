# Members Directory Redesign

## Goal

Redesign the public members area so the club hierarchy is immediately clear, member cards share one coherent visual system, and a growing list of regular members remains easy to browse.

## Page hierarchy

The main `/members` page presents active users in three sections mapped from the existing authorization roles:

1. `ADMIN` — **Ban Chủ Nhiệm**
2. `CORE_MEMBER` — **Nghiên cứu viên & Thành viên Kỳ cựu**
3. `MEMBER` — **Thành viên**

The first two sections display every matching active user because those groups are expected to remain small. The regular-member section displays six users per page in a maximum three-column, two-row desktop grid.

No database or role migration is included. The existing roles remain the source of truth for both permissions and public grouping.

## Header

Remove the visible eyebrow/suptitle `Nhân sự & Nghiên cứu viên`, the long descriptive paragraph beginning `Mạng lưới sinh viên...`, the word `Danh bạ`, and the multi-item statistics row.

The remaining copy is:

- Title: **Thành viên Robotics & IoT Lab**
- Subtitle: **{total} thành viên**

The `Users` icon remains outside the left content gutter. Its desktop visual size must be approximately the combined height of the former three-line header stack—eyebrow, title, and subtitle—even though only title and count remain visible. Target approximately 64–72 px on desktop, with a smaller responsive size on mobile. The title and count stay aligned to the normal content edge.

## Ordering and pagination

All groups are sorted by the number of contributions attached to published items, descending. Ties are sorted by full name ascending for stable output.

The regular-member section on `/members` uses server-rendered URL pagination, for example `/members?page=2`, with six `MEMBER` records per page. Invalid, negative, or excessively large page values resolve safely to an available page rather than producing an empty or broken layout.

The section also includes a **Xem tất cả thành viên** action linking to `/members/all`.

The new `/members/all` page contains only active users with role `MEMBER`. It uses the same contribution-first ordering and server-rendered pagination, with twelve records per page. Ban Chủ Nhiệm and Nghiên cứu viên & Thành viên Kỳ cựu are not repeated there.

## Member cards

Use one reusable card component for all three sections. Cards retain a restrained radius consistent with the site's current public cards and vary only through a subtle section accent, not separate layouts.

Each card may show:

- Avatar image when available, otherwise a stable initial fallback
- Full name linked to the profile
- Public group label appropriate to the section
- Student ID when present
- Short bio with consistent line clamping
- Published contribution count as a clearly visible compact metric
- GitHub and LinkedIn actions when available
- A consistently placed profile action

The card footer provides enough spacing between the contribution metric, social links, and profile action. Icon-only external links require accessible labels. Decorative icons are hidden from assistive technology.

Cards use equal-height layout within each grid row so actions line up without forcing absent optional data to leave awkward gaps.

## Data flow

The server page parses and normalizes the current page query. It requests active users with the existing public user selection and published contribution counts. The implementation may use separate role-specific queries to avoid loading every regular member solely to paginate them.

Pagination calculations use a total count for the relevant role and a shared pagination component or helper. No client-side member store or new API endpoint is required.

## Empty and boundary states

- A section with no users is omitted rather than showing an empty grid.
- If the regular-member group is empty, show a concise empty state and omit pagination.
- Pagination controls appear only when more than one page exists.
- Previous and next controls preserve accessible disabled states; numbered links expose the current page.

## Responsive behavior

- Mobile: one card per row; header icon scales down without pushing text off screen.
- Tablet: two cards per row.
- Desktop: three cards per row.
- The regular-member preview never exceeds six cards on a page.

## Verification

Add or update unit coverage for:

- Header copy removals, count subtitle, and oversized gutter icon contract
- Role-to-section labels
- Contribution-first ordering and deterministic name tie-break
- Six-member main-page pagination and twelve-member full-list pagination
- Safe page normalization and page-bound handling
- `/members/all` filtering to `MEMBER` only
- Accessible external/profile actions

Run the full unit suite, TypeScript checking, and production build before completion.
