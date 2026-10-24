# Navigation and Query Optimization Implementation Plan

> Execution record 2026-10-21: completed inline in the approved current checkout. Verification details and scope limits are in reports/2026-10-21-refactor-verification.md. Commit steps remain unchecked because Git author identity is unavailable; immutable per-task snapshots replace commits. No merge/push/deployment was requested.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Giữ shell khi chuyển route, loại payload thừa và giới hạn truy vấn mà không thay thứ tự/quyền/nghiệp vụ.

**Architecture:** Route groups dưới một root layout; query theo feature trả DTO, rendering/streaming boundary theo dữ liệu. Bản production và dataset phải tương đương baseline F6.

**Tech Stack:** Next App Router/Suspense, Prisma/PostgreSQL, Playwright.

**Spec:** [Spec](../specs/2026-10-21-repository-refactor-design.md). **Prerequisite:** Plans 01–02. **Global Constraints/Review Focus:** [roadmap](2026-10-21-repository-refactor.md#global-constraints).

## P1: Persistent shell và điều hướng phản hồi đúng route

**Files:** Create `src/app/(shell)/layout.tsx`, `(site)/layout.tsx`, `(account)/layout.tsx`, `(auth)/layout.tsx`; Move route `page.tsx` và nested pages home/category/members/showcase/contact vào `(shell)/(site)/`, dashboard/admin/account vào `(shell)/(account)/`, login vào `(shell)/(auth)/`; move login form/actions còn ở route vào `features/identity/components/login-form.tsx` và `features/identity/server/login-actions.ts`. Modify `src/app/layout.tsx`, remove root loading chứa Navbar trùng; add route loading/error files dưới groups, preserve metadata/redirects. Modify shell Navbar/Nav tại `(shell)/_components/`, `src/shared/navigation/navigation-link.tsx`, `navigation-transition.tsx`, `loading-content.tsx`; Tests `tests/unit/loading-content.test.tsx`, `navigation-link.test.tsx`, `navbar-nav.test.ts`, `tests/e2e/navigation.spec.ts`, `auth-lifecycle.spec.ts`.

**Interfaces:** `SiteNavbar(): ReactNode` server composition không await toàn bộ header; `AccountNavigation(): Promise<ReactNode>` async session region trong Suspense giữ kích thước. `NavigationTransition` giữ `begin(href:string): number|null`, `finish(id:number):void`; pending token mới nhất thắng và active lấy committed pathname. App root giữ một provider instance. Account layout gate cho phép change-password với mustChangePassword và chặn vùng nghiệp vụ tương ứng; action vẫn tự authorize.

- [x] Browser regression tên `preserves navbar across route transitions`: đặt marker bằng `await page.locator('header').first().evaluate(el => { el.dataset.testShell='kept'; })`, click native link, `await expect(page.locator('header[data-test-shell="kept"]')).toBeVisible()`. Click home khi trì hoãn RSC 1000 ms bằng test network fixture phải thấy pending/route feedback dưới 200 ms, không active route đích cùng card route cũ được trình bày như hoàn chỉnh. Click home→robotics→members trước data resolve phải `await expect(page).toHaveURL(/\/members$/)`; Back/Forward, Ctrl-click/new tab giữ URL đúng; login/sign-out cập nhật menu bằng refresh/invalidation không để stale account state.
- [x] Run `npm.cmd run test:e2e -- tests/e2e/navigation.spec.ts` trước thay shell; ghi test nào đỏ. Unit tokens: `finish(oldId)` không được clear latest pending; cancelled navigate không gọi begin; cùng pathname khác query hoàn tất pending đúng (không chỉ chờ pathname change).
- [x] Move routes cùng update import/test path, không để hai route trùng URL. Một Navbar ở shell; footer site/account cùng primitive, login không footer. Page trả content/main, không giữ wrapper gây min-height/scroll jump. Root provider/IME/dialog preserved; metadata và redirect returnTo giữ nguyên. Streaming home static shell render trước auth/data trong section; destination loading có heading rõ. Error boundary có retry, không nuốt redirect/notFound.
- [x] Run full unit/typecheck/architecture và production build; browser navigation/auth lifecycle qua. Kiểm tra title, anchors, focus, mobile nav/profile dropdown không biến mất khi thay fallback. Không sửa lỗi bằng disable toàn bộ link trong 5 giây.
- [ ] Review route map/slow navigation và commit `refactor: persist the app shell across route transitions`.

## P2: Query modules, bounded pagination và contributor lookup

**Files:** Create `src/shared/lib/pagination.ts`, `src/features/publications/server/queries.ts`, `src/features/members/server/queries.ts`, `src/features/members/server/ranking.ts`, `src/features/submissions/server/queries.ts`, `src/features/identity/server/member-search-action.ts`; Modify tất cả site pages mới sau P1, dashboard/admin list pages, editor new/edit pages; Modify member-directory contract, member pagination và contributor-editor/member-search components tại feature paths; Tests `tests/unit/category-pagination.test.tsx`, `search-pagination.test.tsx`, `member-directory.test.ts`, `member-search.test.ts`, `tests/integration/member-portfolio.test.ts`, Create `tests/unit/query-contracts.test.ts`, `tests/integration/member-ranking.test.ts`.

**Interfaces:** `Page<T>`/`pageBounds` từ roadmap. `listPublications(input:{authenticated:boolean;categorySlug?:string;q?:string;year?:number;sort:'featured'|'newest'|'oldest'|'title';page:unknown;pageSize:9|10}):Promise<Page<PublicationCardDto>>`; `getHomePublications(authenticated:boolean):Promise<PublicationCardDto[]>` take3/pin priority; `listDirectory(input:{authenticated:boolean;role:PublicMemberRole;page:unknown;pageSize:6|12}):Promise<Page<PublicMemberDto>>`; `listAuthorItems(input:{actor:Actor;filter:PostFilter;q:string;page:unknown}):Promise<Page<AuthorItemDto>>`; `listMemberPublications(input:{memberId:string;authenticated:boolean;type:'PROJECT'|'RESEARCH_PAPER';page:unknown}):Promise<Page<PublicationCardDto>>`; `searchContributors(input:{q:string;page:number}):Promise<ActionResult<Page<{id:string;fullName:string}>>>` actor-protected, pageSize20, max query200, selected IDs fetched separately by minimal DTO.

- [x] Test tên `rejects partial numeric page input`: `expect(pageBounds('2oops',21,10)).toEqual({page:1,skip:0,take:10,totalPages:3})`; invalid/-1/Infinity/fraction defaults1, overflow clamps. Page sizes research/search10, robotics9, directory MEMBER6/all12, bulk10 giữ nguyên; filter/count identical; ID tie stable. Guest has only PRIVATE contributions vẫn là member có count0, không bị inner join loại. Vietnamese tie names và zero-contribution members so sánh comparator hiện hành. Contributor out-of-order responses không thay result mới; selected contributor vẫn hiện khi ngoài trang search. Case-insensitive identifier behavior giữ nguyên, không migrate account casing.
- [x] Run `npx.cmd vitest run tests/unit/query-contracts.test.ts tests/unit/member-search.test.ts` và dedicated DB member-ranking (đỏ trước query mới). Không dùng source string chứa `take` như bằng chứng query thực có bound; capture Prisma arguments hoặc integration results.
- [x] Extract queries và mapping, select DTO từ F3; shared pageBounds không parseInt chấp nhận '2oops'. Count/page đều policy; giữ sort/pin/year/search/returnTo. Dashboard/profile paginate20, query params `page`, `researchPage`, `projectPage`; directory leadership/core dùng 12 mỗi trang qua `adminPage`/`corePage` để không tải nhóm vô hạn, MEMBER giữ `page`6. Dùng pagination primitive hiện có, bảo toàn các query params của nhóm khác. Contributor debounce200ms + sequence guard; không fetch toàn bộ users trên new/edit page.
- [x] Ranking dùng parameterized SQL và collation vi được verify bằng fixture accent/tie trên dedicated DB; không string interpolate query/column từ user. Nếu collation không tương đương, chọn spec fallback minimal id/fullName/count ranking + hydrate trang; report còn metadata scan, không đánh dấu DB pagination hoàn toàn. Giữ ID tie khi locale comparator hòa; không lệ thuộc thứ tự enum Role để gán group priority.
- [x] Run full unit/typecheck/architecture + member/search/profile integration; browser search/filter/page/return links cùng author editor lookup qua. Trên dataset1000/100 ghi query count và không truyền whole content vào CitationModal; count visibility không rò metadata PRIVATE.
- [ ] Review query policy/SQL/ordering và commit `perf: bound feature queries and reduce public payloads`.

## P3: CSS/observer consolidation và tối ưu theo profile

**Files:** Modify `src/app/globals.css`, `src/shared/navigation/page-reveal.tsx`, feature home hero/other active components khi có measured hotspot; Create `tests/e2e/presentation.spec.ts`, `tests/unit/page-reveal.test.ts` nếu path đã đổi giữ basename; Modify `UI_DESIGN_RULES.md`; Report `docs/superpowers/reports/refactor-performance.md` và `refactor-after/metrics.json`. `prisma/schema.prisma`/new index migration chỉ thay khi query plan chứng minh cần.

**Interfaces:** Giữ PageReveal public component và reduced-motion semantics. Metrics schema tái sử dụng F6; không đổi measurement implementation giữa baseline và after. CSS tokens giữ selector/API đang dùng; không đổi tone màu/font/geometry ngoài việc bỏ rule trùng computed-equivalent.

- [x] Test tên `keeps content readable with reduced motion`: `await page.emulateMedia({reducedMotion:'reduce'})`, điều hướng và `await expect(page.locator('main')).toBeVisible()` cùng section/card nằm trong viewport; kiểm tra computed opacity là1 khi animation kết thúc hoặc reduced-motion bật. Browser snapshot/computed-style baseline tại viewport390/768/1440, navigation active/focus, form/modal/empty/loading; IME test vẫn qua. Reveal không đặt nội dung paused opacity0; streaming child mới không bị hidden. Observer test nhiều mutation không rescan toàn body vô hạn, cleanup cancel/disconnect khi route change.
- [x] Run presentation/reveal cases để chứng minh trạng thái trước thay đổi; chỉ thêm regression đỏ cho bug xác định, không bắt visual test cố tình fail để tạo red giả cho refactor thuần.
- [x] Hợp nhất rule hero/layout trùng theo specificity/media order, xóa selector dead có manifest; update design rules theo computed style đã giữ. Narrow MutationObserver sang vùng cần thiết hoặc bỏ animation không consumer; không thêm timeout “chữa” latency. Profile auth/query/RSC/render với F6; chỉ index/cache khi metric/EXPLAIN chứng minh và test invalidation/privacy sẵn có. Mọi cache là public-only hoặc request-scoped; nếu không cần, giữ không cache.
- [x] Thu after cùng 10 warm/cold, dataset20/1000 và môi trường baseline; report median/p95/raw metrics. Delayed navigation feedback <200ms là test phản hồi; không nhầm với data complete time. Nếu số đo noise, báo raw mẫu và rerun chỉ khi có lý do, không chọn mẫu tốt nhất. Unit/typecheck/production browser/presentation qua.
- [ ] Review computed style và benchmark diff; commit `perf: consolidate presentation and verify navigation improvements`.

## Exit gate

- [x] Route URLs/metadata/login/account đúng, Navbar không remount khi điều hướng trong shell.
- [x] Slow-network/rapid-click browser test qua, page/data thời gian được báo tách biệt.
- [x] Không payload full article/draft trong list/citation; list bound và ranking đúng hoặc fallback được ghi rõ.
- [x] Visual, IME/reduced-motion tests và metrics trước/sau có artifact để review.
