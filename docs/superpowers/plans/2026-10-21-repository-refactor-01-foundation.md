# Refactor Foundation Implementation Plan

> Execution record 2026-10-21: completed inline in the approved current checkout. Verification details and scope limits are in reports/2026-10-21-refactor-verification.md. Commit steps remain unchecked because Git author identity is unavailable; immutable per-task snapshots replace commits. No merge/push/deployment was requested.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Củng cố harness an toàn và sửa hợp đồng quyền, validation, version, pin trước khi di chuyển cấu trúc.

**Architecture:** Sửa tại entry point hiện tại với helper có owner ở vị trí đích; M1 chuyển consumer và phần implementation còn lại. Thứ tự execution F1 → F6 → F2 → F3 → F4 → F5, giữ baseline trước sửa auth/payload; các ID ổn định để cross-reference. F4/F5 cùng sửa showcase-actions nên chạy tuần tự.

**Tech Stack:** Stack hiện tại; Playwright dev tooling trong F6.

**Spec:** [Spec](../specs/2026-10-21-repository-refactor-design.md). **Global Constraints/Review Focus:** áp dụng nguyên văn [roadmap](2026-10-21-repository-refactor.md#global-constraints).

## F1: Database guard, cấu hình suite và baseline unit có nghĩa

**Files:** Modify `tests/setup/database-guard.ts`, `tests/setup/database.ts`, `tests/unit/test-database-guard.test.ts`, `tests/unit/upload.test.ts`, `tests/unit/citation-panel-spacing.test.ts`, `vitest.config.ts`, `package.json`; Create `vitest.integration.config.ts`, `tests/fixtures/database.ts`; Modify toàn bộ 13 tệp `tests/integration/*.test.ts` để dùng fixture thay vì global reset. Thay assertions FIFO cũ tại `tests/integration/showcase-pinning.test.ts`; xóa fake `tests/e2e/workflow.test.ts` sau khi chuyển coverage direct Admin còn hợp lệ sang `tests/integration/direct-approval.test.ts`.

**Interfaces:** Giữ `assertTestDatabaseUrl(devUrl?, testUrl?, env?): string`; thêm `verifyTestDatabase(client: PrismaClient, expectedUrl: string): Promise<void>` và `withTestFixtures<T>(run: (fixture: { prisma: PrismaClient; prefix: string }) => Promise<T>): Promise<T>`. Helper verify chỉ SELECT catalog trước setup; fixture tạo dữ liệu prefix/schema trong DB test đã xác minh và cleanup đúng phần sở hữu.

- [x] Viết test guard bằng URL giả: `expect(() => assertTestDatabaseUrl(dev, dev+'&test=true', {})).toThrow()`; cùng DB nhưng credentials khác/schema khác/percent encoding/localhost-127.0.0.1/query reorder đều reject; malformed URL và non-Postgres reject; DB `nexus_showcase_test` riêng accept. Mock client xác nhận verify sai thì `deleteMany/create/updateMany` chưa được gọi.
- [x] Run `npx.cmd vitest run tests/unit/test-database-guard.test.ts`; phải đỏ ở bypass thực tế trước khi sửa guard.
- [x] Implement URL identity theo spec §8; không log URL có credential. Cấu hình Vitest unit chỉ include `tests/unit/**`, integration config riêng include `tests/integration/**`, `fileParallelism:false`, guard setup riêng; `npm.cmd run test:integration` dùng config đó. Fixture không sửa các pin ngoài phần sở hữu, global capacity test dùng schema cô lập. Sửa upload assertion bằng `path.join('storage','resources')`; citation spacing kiểm tra rendered semantic action grouping thay vì ép class không cần thiết. Chuyển contract test Editor/10 pin sang direct Admin/3 pin có replacement; giữ permission/concurrency coverage.
- [x] Run `npm.cmd run test:unit` và `npx.cmd tsc --noEmit`: mọi unit qua; không chạy DB khi URL chưa an toàn. Khi có dedicated DB, run `npm.cmd run test:integration` hai lần tuần tự, đều qua và cleanup không tác động fixture của suite khác. Thiếu DB thì ghi blocked validation, tiếp tục phần không phụ thuộc kết nối.
- [x] Review diff/fixture guard, commit `test: isolate database suites and align current workflow contracts` nếu Git identity có sẵn.

F1 completed: see task-1-report/review in SDD workspace and public walkthrough. No commit created because Git identity remains absent.

## F2: Actor, auth config, result/error contracts

**Files:** Create `src/shared/lib/action-result.ts`, `src/server/config/auth.ts`, `src/server/observability/errors.ts`, `src/features/identity/server/actor.ts`, `src/features/identity/model/session.ts`, `src/types/next-auth.d.ts`; Modify `src/lib/auth.ts`, `src/lib/current-user.ts`, `src/actions/upload-actions.ts`, `src/app/api/upload/route.ts`, action callers và account pages; Tests `tests/unit/current-user.test.ts`, `tests/unit/upload.test.ts`, `tests/unit/account-password.test.ts`, Create `tests/unit/auth-config.test.ts`, `tests/unit/auth-callbacks.test.ts`.

**Interfaces:** Roadmap `ActionResult<T>`, `Actor`, `getActor`. `readAuthSecret(env: Pick<NodeJS.ProcessEnv,'AUTH_SECRET'|'NEXTAUTH_SECRET'>): string` chọn AUTH_SECRET rồi NEXTAUTH_SECRET, blank đều throw. `reportServerError(event: string, error: unknown, context?: { itemId?: string; actorId?: string }): void` chỉ log nhóm lỗi, mã an toàn và stack đã kiểm soát, không ghi payload/secret/credential URL.

- [x] Test tên `requires explicit auth secret`: `expect(() => readAuthSecret({})).toThrow(/AUTH_SECRET/)`; blank reject; fallback env hợp lệ accept; session revoked/status SUSPENDED/deleted/mustChangePassword đều actor null. Upload cả action và HTTP khi mustChangePassword phải UNAUTHORIZED/FORBIDDEN và `expect(writeFile).not.toHaveBeenCalled()`; change-password vẫn được phép. Test actual app JWT/session callbacks bằng NextAuth factory mock để capture config, không chỉ assert bcrypt.
- [x] Run `npx.cmd vitest run tests/unit/current-user.test.ts tests/unit/upload.test.ts tests/unit/auth-config.test.ts tests/unit/auth-callbacks.test.ts`; xác nhận test hành vi mới đỏ.
- [x] Implement contracts ở path đích; consumer không giữ cả getCurrentUser và getActor chạy song song hoặc alias bỏ không. Thay cast any quanh user/session ở consumer đã chạm; auth callback null session được mô hình hóa và test đúng contract installed NextAuth. Logger không che lỗi hạ tầng như thành conflict.
- [x] Run các test trên + `npm.cmd run test:unit` + `npx.cmd tsc --noEmit`; mock env trong unit khi cần, không thêm secret cố định production để làm test qua.
- [ ] Review actor matrix và commit `fix: unify actor policy and require explicit auth configuration`.

## F3: Visibility và public DTO

**Files:** Create `src/features/publications/model/visibility.ts`, `src/features/publications/model/contracts.ts`, `src/features/publications/server/selects.ts`; Modify `src/app/page.tsx`, `src/app/category/[slug]/page.tsx`, `src/app/members/page.tsx`, `src/app/members/all/page.tsx`, `src/app/members/[id]/page.tsx`, `src/app/showcase/[slug]/page.tsx`, `src/lib/member-directory.ts`, `src/components/member-card.tsx`, `src/components/citation-modal.tsx`; Tests `tests/integration/public-data-boundary.test.ts`, `tests/integration/member-portfolio.test.ts`, `tests/unit/search-pagination.test.tsx`, Create `tests/unit/publication-visibility.test.ts`.

**Interfaces:** `publishedWhere(authenticated: boolean)` từ roadmap; `CitationDto` đúng `CitationItem` hiện tại; `toCitationDto(item: CitationDto): CitationDto` project tường minh tên tác giả; `publicationCardSelect` và `publicationDetailSelect` satisfies Prisma selector; export `PublicationCardDto`/`PublicationDetailDto` suy từ GetPayload tương ứng. `PublicMemberDto` là PublicUser projection + `_count.contributions`, không studentId. `AuthorItemDto` là card projection + status/reviewStatus/reviewVersion/rejectionReason chỉ trả cho owner. Card được giữ những field UI đang đọc, không content/authorDraft/attachments không dùng.

- [x] Test `expect(publishedWhere(false)).toEqual({status:'PUBLISHED',visibility:'PUBLIC'})`; guest profile gồm PRIVATE/PUBLIC/DRAFT chỉ render PUBLIC, count tương ứng; signed-in member thấy PUBLISHED nội bộ. DTO serialization không chứa sentinel email/studentId/passwordHash/authorDraft/content. Soft-deleted directory member không xuất hiện.
- [x] Run visibility/public-boundary tests unit trước và integration sau F1; phải đỏ ở guest profile hiện tại và payload thừa.
- [x] Áp policy chung cho query và count; tránh spread filter sau policy làm override quyền. Bỏ studentId khỏi PublicMember contract, không đặt `studentId:null` để che query vẫn lấy field. Truyền citation projection qua client, giữ output BibTeX/APA/IEEE.
- [x] Run `npx.cmd vitest run tests/unit/publication-visibility.test.ts tests/unit/search-pagination.test.tsx tests/unit/category-pagination.test.tsx tests/unit/citation.test.ts`; dedicated DB run public boundary/member portfolio; typecheck qua.
- [ ] Review guest/member/admin cases và commit `fix: enforce publication visibility across member pages`.

## F4: Draft validation và editor version lifecycle

**Files:** Modify `src/actions/showcase-actions.ts`, `src/actions/approval-actions.ts`, `src/components/submission/use-submission-editor.ts`, `src/components/submission/submission-editor.tsx`, `src/lib/submission-types.ts`, `src/app/dashboard/items/[id]/edit/page.tsx`; Create `src/features/submissions/model/versioned-input.ts`; Tests `tests/unit/submission-editor.test.tsx`, `tests/integration/direct-approval.test.ts`, Create `tests/unit/draft-validation.test.ts`, `tests/integration/draft-conflict.test.ts`.

**Interfaces:** `saveShowcaseDraftAction(input: {itemId: string|null; expectedReviewVersion?: number; draft: unknown}): Promise<ActionResult<{id:string;slug:string;status:string;reviewVersion:number}>>`; `submitShowcaseForReviewAction(input:{itemId:string;expectedReviewVersion:number}): Promise<ActionResult<{status:string;revisionNumber:number;reviewVersion:number}>>`. Existing saves bắt buộc expectedReviewVersion; create không nhận version. `saveDraft()` trong hook trả saved ID/version hoặc null, submit dùng giá trị trả về đó. Withdrawal chuyển tương đương version contract qua adapter.

- [x] Test tên `rejects malformed draft before normalization`: `await expect(saveShowcaseDraftAction({itemId:null,draft:null})).resolves.toMatchObject({success:false,code:'VALIDATION'})`; number/content object tương tự; save existing không có version reject. Hai tab nhận version v: A save→v+1; B save v→CONFLICT (`expect(result).toMatchObject({success:false,code:'CONFLICT'})`) và DB giữ A. Editor có editSequence tăng khi sửa: response save sequence cũ không được clear isDirty của sequence mới; save lỗi giữ nội dung. Submit dùng version từ save trả về, không version cũ trong closure.
- [x] Run `npx.cmd vitest run tests/unit/draft-validation.test.ts tests/unit/submission-editor.test.tsx`; đỏ đúng lỗi cần sửa. DB conflict suite chỉ chạy sau F1.
- [x] Parse envelope và draft trước normalize; CAS owner/state/version trong Serializable transaction, map version conflict theo ActionResult. Cập nhật tất cả action consumers/tests trong cùng task; không giữ signature cũ không consumer. Giữ authorDraft/live split và immutable revision.
- [x] Unit nêu trên + `tests/unit/submission-pickers.test.tsx` qua; integration direct approval/draft conflict qua khi DB sẵn; typecheck. Kiểm tra save rồi sửa tiếp trong khi response pending.
- [ ] Review stale editor/concurrency và commit `fix: preserve draft edits and reject stale editor versions`.

## F5: Atomic publication state và admin role protection

**Files:** Create `src/features/publications/server/state-commands.ts`, `src/features/identity/server/member-commands.ts`; Modify `src/actions/showcase-actions.ts`, `src/actions/bulk-post-actions.ts`, `src/actions/editorial-actions.ts`, `src/actions/admin-actions.ts`, `src/components/card-admin-controls.tsx`, `src/components/admin-bulk-posts.tsx`, `src/components/admin-role-toggle.tsx`; Tests `tests/unit/pin-limit.test.ts`, `tests/unit/bulk-post-actions.test.ts`, `tests/integration/showcase-pinning.test.ts`, `tests/integration/bulk-posts.test.ts`, Create `tests/integration/publication-state-races.test.ts`, `tests/integration/admin-role-invariants.test.ts`.

**Interfaces:** `PinConflictDetails = {requiresReplacement:true;requiredReplacements:number;pinnedItems:Array<{id:string;title:string}>}`; `setPublicationPin(actor:Actor,input:{itemId:string;enabled:boolean;replaceItemIds?:string[]}): Promise<ActionResult<{isPinned:boolean},PinConflictDetails>>`; `setPublicationVisibility(actor:Actor,input:{itemId:string;visibility:'PUBLIC'|'PRIVATE'}): Promise<ActionResult<{visibility:'PUBLIC'|'PRIVATE'}>>`; `updateMemberRole(actor:Actor,input:{targetUserId:string;newRole:Role}): Promise<ActionResult<SafeMember>>`. `SafeMember` là projection id/fullName/role/status hiện tại. Bulk result dùng ActionResult<{count:number},PinConflictDetails>; consumer đọc details có kiểu. Bulk gọi helper transaction cùng invariant, không loop mở transaction riêng cho từng bài.

- [ ] Test tên `never pins archived publications`: `expect(await setPublicationPin(admin,{itemId:archived.id,enabled:true})).toMatchObject({success:false})`, DB state `expect(saved.isPinned).toBe(false)`. Archive xen vào pin cũng không để ARCHIVED pinned; 4 pin request cạnh tranh `expect(pinnedCount).toBeLessThanOrEqual(3)`; replacement stale reject; visibility set cùng trạng thái hai lần giữ đúng trạng thái. Self-demotion reject; hai admin hạ quyền nhau đồng thời không loại bỏ admin cuối. Lỗi commit khác conflict được log, không báo sai CONFLICT.
- [x] Run unit pin/bulk mới phải đỏ với code race cũ; DB race tests dùng barrier ở boundary test/mocks hoặc Serializable DB behavior, không dùng arbitrary sleep để giả định thứ tự.
- [x] Implement read/condition/write trong cùng transaction, explicit desired state và affected IDs/slugs; archive xóa pin cùng transaction. Transaction role kiểm tra actor vẫn admin ACTIVE chưa deleted; enforce invariant admin cuối. Consumer toggle UI tính desired state nhưng server không suy từ stale read. Giữ replacement dialog/result metadata đang dùng.
- [x] Unit/integration cases trên + full unit/typecheck qua; kiểm tra result capacity metadata vẫn hiển thị dialog thay thế đúng 3 pin.
- [ ] Review state invariants và commit `fix: make publication and administrator transitions atomic`.

## F6: Browser harness và performance baseline trước chuyển cấu trúc

**Files:** Create `playwright.config.ts`, `tests/e2e/navigation.spec.ts`, `tests/e2e/direct-approval.spec.ts`, `tests/e2e/auth-lifecycle.spec.ts`, `tests/e2e/fixtures.ts`, `tests/fixtures/benchmark.ts`, `scripts/benchmark-navigation.ts`, `src/server/observability/timing.ts`; Modify `package.json`, `package-lock.json`, `src/lib/session.ts`, `src/lib/prisma.ts` để nối timing có opt-in; Report `docs/superpowers/reports/refactor-baseline/metrics.json` và `environment.md` (không secrets).

**Interfaces:** `createBenchmarkFixtures(input:{prisma:PrismaClient;items:20|1000;members:100;prefix:string}): Promise<{prefix:string;users:TestUser[]}>` chỉ chạy sau verifyTestDatabase; `runNavigationBenchmark(input:{baseUrl:string;warmRuns:10;outputPath:string}): Promise<void>`. `TestUser` fixture chỉ ở tests, không runtime export. `measureServerOperation<T>(name:'auth'|'query',operation:()=>Promise<T>):Promise<T>` và `recordQueryDuration(durationMs:number):void` chỉ emit numeric timing khi PERF_METRICS=1; không emit SQL/params/session data. Query duration nối Prisma events, auth wrapper giữ cache theo request. Harness collect structured timing với correlation ID, không dùng browser network duration làm query duration. Metrics gồm timestamp/environment, clickToPendingMs/clickToShellMs/clickToDataMs/authMs/queryCount/queryMs/rscBytes, raw samples/median/p95.

- [x] Tạo browser test `home navigation displays route content`: sau home→research→robotics→members→home, `await expect(page.locator('#home-search')).toBeVisible()` và đúng card của fixture. Thêm direct Admin review/live update và forced-password flow. Fake old Editor suite đã bỏ trong F1 được thay bằng journey thật này. Browser chỉ dùng dedicated DB; không submit fixture vào app đang chạy với DATABASE_URL thật.
- [x] Thêm `test:e2e`, `bench:navigation`, `build`, `start` harness chạy app production với env test. Thêm query/auth timing ở test harness boundary; không log query params hoặc dùng heuristic browser network thay cho query count. Nếu metric chưa có thì ghi unavailable, không điền 0 giả.
- [x] Run `npm.cmd run test:e2e` baseline; ghi failures thật còn ở shell/navigation thay vì che bằng test skip. Thu 10 warm lượt/route và cold riêng trên dataset 20 rồi 1000/100; giữ raw data. Chỉ baseline bug known chưa qua được ghi nhận, plan P1/P2 có regression cần làm xanh.
- [x] Run full unit/typecheck để xác nhận tooling không đụng runtime; kiểm tra report không có credentials/payload riêng tư. Thiếu browser/DB/build dependency thì ghi chính xác blocker và tiếp tục module task không phụ thuộc metric, không tuyên bố performance cải thiện.
- [ ] Review baseline fidelity, commit `test: add isolated browser journeys and navigation benchmarks`.

## Exit gate

- [x] F1–F5 behavioral checks qua hoặc validation bị chặn có bằng chứng cụ thể; không có lỗi quyền đã biết được bỏ qua.
- [x] F6 baseline được thu trước tối ưu; xác định metric/browser nào chưa đo.
- [x] Unit/typecheck và task review hoàn tất; chỉ sau đó chuyển Plan 02.
