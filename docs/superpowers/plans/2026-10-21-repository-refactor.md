# Repository Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor NexusShowcase theo feature, sửa lỗi quyền/concurrency, xóa mã không dùng và tối ưu điều hướng/truy vấn với bằng chứng kiểm thử và số đo.

**Architecture:** Modular monolith trên stack hiện tại. Bốn delivery plan bên dưới được thực hiện theo thứ tự; mỗi plan kết thúc ở một ứng dụng chạy được, có review và validation riêng. Không gom thành một lần rewrite.

**Tech Stack:** Next.js 15, React 19, Prisma 6, PostgreSQL, TypeScript strict, Vitest 2; thêm Playwright làm dev dependency cho browser test thực.

**Spec:** [2026-10-21-repository-refactor-design.md](../specs/2026-10-21-repository-refactor-design.md), được người dùng duyệt bằng “oke” sau khi nhận link spec.

## Global Constraints

- Giữ URL, nội dung, hình thức giao diện, lịch sử và nghiệp vụ: CORE_MEMBER/ADMIN soạn bài của mình; Admin duyệt trực tiếp; tối đa 3 bài ghim và thay thế tường minh; PUBLIC/PRIVATE; live content tách khỏi authorDraft; revision bất biến và reviewVersion chống xung đột.
- Không viết lại ứng dụng, tách microservice, nâng major dependency, thêm Redis/queue/event bus hay thay hệ thống thiết kế.
- Không xóa dữ liệu runtime, lịch sử Git hoặc migration đã áp dụng.
- Input action là dữ liệu không tin cậy: Zod parse trước khi truy cập thuộc tính hoặc normalize.
- Không chạy integration/browser fixture ghi DB trước khi guard mới được chứng minh bằng unit test.
- Unit luôn không cần DB; không tự resolve/migrate/reset DB người dùng.
- Việc áp quyền lên URL file PRIVATE và hợp nhất identifier có casing khác nhau là hai thay đổi dữ liệu riêng, không thực hiện ngầm trong đợt này.
- Không reset/stash/drop công việc chưa commit. Migrations, snapshots, asset chưa chứng minh orphan phải giữ.
- Mỗi step commit chỉ stage file của task; nếu Git identity vẫn thiếu, không tự đặt tên/email hoặc commit dưới danh tính người khác: giữ diff, ghi trạng thái và tiếp tục task không phụ thuộc commit.

## Review Focus

1. URL test khác credentials/schema/query nhưng cùng database: reject trước mọi cleanup (F1).
2. Phiên vừa đổi quyền/khóa hoặc phải đổi mật khẩu: không được upload/ghi nghiệp vụ qua action hay HTTP (F2).
3. Tab editor A trả save chậm sau khi đã sửa tiếp hoặc tab B đã lưu: không mất local edit hoặc ghi đè version mới (F4).
4. Click liên tục, back/forward, mở link bằng Ctrl/middle-click: route cuối đúng và Navbar không trình bày nội dung cũ như route mới (P1).
5. Asset chỉ được tham chiếu trong snapshot/authorDraft hoặc member có 0 bài PUBLIC: giữ asset và giữ member trong ranking (M3, P2).

---

## Delivery plans và phụ thuộc

| Thứ tự | Plan | Kết quả độc lập | Task |
| --- | --- | --- | --- |
| 1 | [Foundation](2026-10-21-repository-refactor-01-foundation.md) | Harness an toàn, hợp đồng quyền/version/pin đúng, baseline browser/performance | F1–F6 |
| 2 | [Modules và cleanup](2026-10-21-repository-refactor-02-modules-cleanup.md) | Feature boundaries, action/query adapter mỏng, dead code được xóa có manifest | M1–M3 |
| 3 | [Navigation và queries](2026-10-21-repository-refactor-03-navigation-queries.md) | Persistent shell, payload nhỏ, danh sách có giới hạn và UI giữ nghiệp vụ | P1–P3 |
| 4 | [Delivery và verification](2026-10-21-repository-refactor-04-delivery-verification.md) | Setup/migration tái lập, CI, benchmark trước/sau và final review | V1–V3 |

Task trong cùng plan chỉ được chạy song song khi không sửa cùng file, consumer/interface đã ổn định và không dùng chung fixture DB mutable. Thứ tự Plan01 là F1 → F6 → F2 → F3 → F4 → F5: F1 phải xong trước bất kỳ test ghi DB; F6 phải thu baseline trước thay đổi auth/payload và trước M1/P1/P2/P3. Không chạy toàn bộ bốn plan song song.

## Quy ước hợp đồng chung

`src/shared/lib/action-result.ts` định nghĩa `ActionResult<T, Detail = never> = { success: true; data: T } | { success: false; code: 'VALIDATION'|'UNAUTHORIZED'|'FORBIDDEN'|'NOT_FOUND'|'CONFLICT'|'INTERNAL'; error: string; fieldErrors?: Record<string,string[]>; details?: Detail }`. Generic thứ hai cho replacement-capacity metadata, không dùng untyped payload.

`src/shared/lib/pagination.ts` định nghĩa `Page<T> = { items: T[]; page: number; pageSize: number; total: number; totalPages: number }` và `pageBounds(rawPage: unknown, total: number, pageSize: number): { page: number; skip: number; take: number; totalPages: number }`. Bỏ giá trị không phải số nguyên dương; clamp đến trang cuối; total=0 vẫn page=1/totalPages=1.

Actor `getActor(allowedRoles?: readonly Role[], options?: { allowPasswordChangeRequired?: boolean }): Promise<Actor|null>` có id/fullName/role/status:'ACTIVE'/mustChangePassword; xác minh từ server, không nhận actor từ browser. `publishedWhere(authenticated: boolean): Prisma.ShowcaseItemWhereInput` không cho filter consumer override status/visibility.

Chữ ký command/action dùng trong task là đích cuối; tất cả caller/test đổi trong cùng task. Không để alias cũ chỉ để tránh chuyển import. `use server` chỉ export async function và type; helper/const nằm trong module thường. Module cần type Prisma dùng `import type` nếu không thực thi Prisma API.

## Map trách nhiệm tệp

| Hiện tại | Đích | Trách nhiệm |
| --- | --- | --- |
| lib/prisma.ts | server/db/prisma.ts | Singleton duy nhất |
| lib/auth.ts, session.ts, current-user.ts | features/identity/server/auth.ts, session.ts, actor.ts | Auth, cache theo request, actor |
| lib/permissions.ts, public-user.ts | features/identity/model/permissions.ts, public-user.ts | Contract thuần, selector/DTO an toàn |
| actions/admin-actions.ts, account-actions.ts | features/identity/server/member-actions.ts, account-actions.ts | HTTP-independent command + action adapter khi cần |
| actions/showcase-actions.ts | features/submissions/server/actions.ts + features/publications/server/actions.ts | Save/submit vs pin/visibility, không để file hỗn hợp |
| actions/approval-actions.ts | features/review/server/actions.ts + features/submissions/server/actions.ts | Admin decision vs owner withdrawal |
| actions/bulk-post-actions.ts | features/publications/server/bulk-actions.ts | Bulk published states |
| lib/article-content.ts, submission-types.ts, submission-snapshot.ts | features/submissions/model/article.ts, snapshot.ts, snapshot-mapper.ts | Client-safe schema và mapping |
| lib/direct-review.ts | submissions/model/workflow-state.ts (`canReviewItem`), submissions/model/draft.ts (`getAuthorDraft`); review/model/review-state.ts (`pendingReviewWhere`), review/server/review-snapshot.ts (`getReviewSnapshot`) | Predicate dùng bởi owner/review thuộc submissions; tránh vòng submissions→review→submissions |
| lib/bulk-posts.ts, citation.ts, showcase-navigation.ts, item-status-presentation.ts | features/publications/model/bulk-posts.ts, citation.ts, navigation.ts, status.ts | Contracts/presentation thuần |
| lib/dashboard-items.ts | features/submissions/model/dashboard-items.ts | Bộ lọc dashboard |
| lib/member-directory.ts | features/members/model/directory.ts | Group labels, comparator/ranking contract |
| actions/upload-actions.ts, lib/file-signatures.ts | features/assets/server/actions.ts, storage.ts; model/file-signatures.ts | Auth/validation vs filesystem; giữ URL |
| components/submission/* còn sống, submission-preview.tsx, my-posts.tsx, withdraw-submission-button.tsx | features/submissions/components/ giữ basename | Editor và author UI |
| approval-controls.tsx | features/review/components/approval-controls.tsx | Admin decision UI |
| showcase-card/card-link/card-admin-controls/citation-modal/pin-toggle-button/pin-management/admin-bulk-posts | features/publications/components/ giữ basename | Publication UI |
| article-content.tsx, resource-links.tsx | features/submissions/components/ giữ basename | Section/resource presentation dùng cùng snapshot model; route live compose trực tiếp |
| video-player.tsx | shared/ui/video-player.tsx | URL/title presentation, không import feature |
| components/ui/badge.tsx | features/publications/components/badges.tsx | StatusBadge/TypeBadge phụ thuộc publication status; RoleBadge không caller được xét xóa M3 |
| member-card/member-pagination/member-section-heading | features/members/components/ giữ basename | Member UI; pagination generic chuyển shared nếu nhiều feature dùng |
| admin-create-member-modal/admin-delete-member-modal/admin-member-table/admin-role-toggle/change-password-form/sign-out-button | features/identity/components/ giữ basename | Identity UI |
| home-hero.tsx | features/publications/components/home-hero.tsx | Home presentation |
| components/navbar*, management-nav, management-layout | app/(shell)/_components/ giữ basename | Composition root dùng feature contract; chuyển các import nhờ relative path hoặc alias đầy đủ |
| components/ui/* ngoại trừ badge.tsx, dialog-provider, navigation-*, loading-content, page-reveal, ime-input-support, academic-footer | shared/ui, shared/dialogs, shared/navigation theo chức năng | Primitive, navigation state, footer và providers không phụ thuộc feature |
| lib/dialog-controller.ts, ime-blur-guard.ts, slugify.ts, video-parser.ts | shared/dialogs/controller.ts; shared/lib/ime-blur-guard.ts, slugify.ts, video-parser.ts | Utility thuần có consumer |
| lib/action-schemas.ts | identity/model/member-input.ts; submissions/model/input.ts; shared/lib/validation.ts | Phân schema theo owner; không giữ mega-schema |

Navbar/shell và management navigation là composition root trong `app/(shell)/_components`, được import feature contracts/server components đúng biên client/server. Toàn bộ shared không import feature; không cần exception mở rộng shared để làm boundary test qua.

## Chuẩn bị execution

- [x] Xác nhận execution method và workspace preference tại handoff. Dùng using-git-worktrees khi bắt đầu thực thi; nếu user chọn làm tại repo hiện tại thì không tạo worktree.
- [x] Chụp `git status --short`, `git diff --binary`, danh sách staged/untracked và hash tệp baseline; giữ evidence trong workspace SDD khi thiếu Git identity, không thu `.env` hoặc credential. Nếu tạo worktree, chuyển cả staged/unstaged và các untracked liên quan theo manifest, verify hash, không stash/drop.
- [x] Đọc trọn file/consumer của task trước sửa. Baseline cũ: TypeScript qua, 342/350 unit test qua; không coi đó là kết quả hiện tại khi đã sửa code.
- [x] Hoàn thành từng task, cập nhật checkbox, chạy verification được chỉ định và reviewer gate; commit không thực hiện vì thiếu identity, giữ snapshot bất biến thay thế.

## Spec coverage và handoff

Spec §1–2 → M1/M2; §3 → P1; §4 → F3/P2; §5 → F2/F4/F5/M2; §6–7 → F2/M3; §8 → F1/V1; §9 → F6/P3/V3; §10 → toàn bộ roadmap/V2/V3. Chỉ deviation đã ghi bằng chứng mới được báo là giới hạn, không đánh dấu requirement hoàn tất khi chưa thực hiện.

- [x] Tách thành bốn delivery plan thay vì một rewrite nhiều subsystem.
- [x] File ownership, interface, value và thứ tự dependency được chỉ rõ.
- [x] Năm review focus đều có test ở task sở hữu.
- [x] Self-review: sửa cycle submissions→review bằng workflow predicate đúng owner; tách Badge/VideoPlayer/ResourceLinks theo dependency thực; đặt baseline F6 trước thay đổi payload; thống nhất typed replacement details giữa pin/bulk/UI.
- [x] Người dùng duyệt plan, chọn Subagent tại repo hiện tại; yêu cầu walkthrough sau mỗi task.

Execution final: người dùng sau đó chọn inline.15/15 task bàn giao; kết quả local380 unit/57 integration/14 browser và88 mẫu benchmark ở [verification report](../reports/2026-10-21-refactor-verification.md). Một số route cache tăng thời gian đo; không đạt bằng chứng mọi route đều nhanh hơn. Commit steps để trống vì thiếu identity; không merge/push/deploy.
