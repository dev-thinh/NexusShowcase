# Feature Modules and Cleanup Implementation Plan

> Execution record 2026-10-21: completed inline in the approved current checkout. Verification details and scope limits are in reports/2026-10-21-refactor-verification.md. Commit steps remain unchecked because Git author identity is unavailable; immutable per-task snapshots replace commits. No merge/push/deployment was requested.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển implementation sang feature owner và xóa toàn bộ dead code đã chứng minh, không đổi UI/workflow.

**Architecture:** Di chuyển theo feature cùng consumer, giữ một implementation cho mỗi trách nhiệm. Không để compatibility wrapper hoặc parallel implementation sau task.

**Tech Stack:** Stack hiện tại, TypeScript compiler API cho boundary/reference audit; không thêm framework kiến trúc.

**Spec:** [Spec](../specs/2026-10-21-repository-refactor-design.md). **Prerequisite:** Plan 01. **Global Constraints/Review Focus:** [roadmap](2026-10-21-repository-refactor.md#global-constraints).

## M1: Chuyển feature ownership và bảo vệ dependency graph

**Files:** Move tất cả tệp runtime còn sống theo bảng map trong roadmap; Create `scripts/check-architecture.mjs`, `scripts/architecture-map.json`, `tests/unit/architecture-boundaries.test.ts`; Modify imports trong `src`, `tests`, `prisma/seed-categories.ts` nếu còn giữ và các config/script đang tham chiếu đường dẫn cũ; Modify `package.json`, `tsconfig.json`; Create `docs/architecture.md`.

**Interfaces:** Giữ export tên đang dùng trừ những API đã đổi ở F1–F5. `scripts/architecture-map.json` chứa `{moves:[{from,to}],deleted:[],allowedFeatureDependencies:{...}}`, không chứa source backup. `checkArchitecture(root:string): {violations:Array<{file:string;dependency:string;rule:string}>}` dùng import/export/dynamic import literal/require graph, phát hiện cycle và client kéo server module; script exit 1 khi violations. Chỉ giữ script nếu được gọi bởi `npm run check:architecture`/CI.

- [x] Tests fixture graph: `expect(checkArchitecture(badFixture).violations).toContainEqual(expect.objectContaining({rule:'shared-imports-feature'}))`; nhận diện `use client` transitive server import, `export *`, dynamic import literal và cycle review→submission→review. Good fixture với `import type` client-safe và server-action adapter hợp lệ qua. Test không đòi mọi client import action bị cấm: Next server action reference là trường hợp được phép.
- [x] Run `npx.cmd vitest run tests/unit/architecture-boundaries.test.ts` phải đỏ trước checker. Lập đầy đủ map path thực tế, không rename file đang có active consumer thành deleted chỉ vì bỏ khỏi map.
- [x] Chuyển theo thứ tự infrastructure/identity/assets → publications/submissions → review/members → shared UI và shell composition. Tách lib/action-schemas.ts theo owner, giữ ContributorInput/legacy snapshot contract đang dùng. Primitive shared không import feature; Navbar, NavbarNav và management navigation có dependency feature đặt ở `src/app/(shell)/_components/` (composition root), footer thuần ở shared/ui. StatusBadge/TypeBadge thuộc publications; submissions được dùng presentation này, không import review. `canReviewItem`/`getAuthorDraft` thuộc submissions để tránh cycle; ResourceLinks thuộc submissions, VideoPlayer thuộc shared. Tạm chưa di chuyển route page vào group cho tới P1. Update source-text test paths vào path mới có ý nghĩa, không tạo alias/shim.
- [x] Sau mỗi feature move run unit liên quan/typecheck; cuối task `npm.cmd run test:unit`, `npm.cmd run check:architecture`, `npx.cmd tsc --noEmit`. Verify source không còn import đường dẫn đã move; API route/file download URLs không đổi.
- [ ] Review ownership/cycles và commit `refactor: organize runtime code into feature modules`.

## M2: Action adapters, snapshot mapping, invalidation và domain errors

**Files:** Modify `src/features/submissions/server/actions.ts`, `src/features/review/server/actions.ts`, `src/features/publications/server/actions.ts`, `bulk-actions.ts`, `state-commands.ts`, `src/features/identity/server/member-actions.ts`, `member-commands.ts`, `account-actions.ts`, `src/features/assets/server/actions.ts`; Create `src/features/submissions/server/draft-commands.ts`, `src/features/submissions/server/snapshot-relations.ts`, `src/features/review/server/decision-command.ts`, `src/features/review/server/legacy-snapshot.ts`, `src/features/publications/server/invalidation.ts`; Modify `src/server/observability/errors.ts`; Tests `tests/unit/submission-workflow.test.ts`, `tests/unit/bulk-post-actions.test.ts`, `tests/integration/direct-approval.test.ts`, Create `tests/unit/invalidation.test.ts`, `tests/unit/legacy-snapshot.test.ts`.

**Interfaces:** `snapshotRelations(snapshot:SubmissionSnapshot): {contributors:Prisma.ItemContributorCreateWithoutItemInput[];links:Prisma.ItemLinkCreateWithoutItemInput[];attachments:Prisma.ItemAttachmentCreateWithoutItemInput[]}` pure mapper, không db/cache. `applyReviewedSnapshot(tx:Prisma.TransactionClient,input:{itemId:string;expectedReviewVersion:number;snapshot:SubmissionSnapshot;visibility:'PUBLIC'|'PRIVATE'}): Promise<{slug:string;memberIds:string[]}>`; caller decision transaction sở hữu commit/audit. `resolveLegacySnapshot(input:{snapshot:SubmissionSnapshot;reviewVersion:number;overrides:EditorialOverrides|null}): SubmissionSnapshot` chỉ merge khi reviewVersion=0. `invalidatePublicationChange(input:{slugs:string[];memberIds:string[];kind:'PUBLICATION'|'VISIBILITY'|'PIN'|'SUBMISSION'|'IDENTITY'}): void` invalidates affected pages sau commit; error logger nhận lỗi cache riêng.

- [ ] Regression tên `never applies legacy override to a new submission`: `expect(resolveLegacySnapshot({snapshot,reviewVersion:1,overrides:{title:'old'}})).toEqual(snapshot)`; version0 phải dùng title override. Mapper cho nội dung section + sidebar resource không duplicate URL; decision rollback không sửa live relations; cache chỉ gọi khi commit thành công, cache failure vẫn `expect(result.success).toBe(true)` và log nhóm invalidation. Test permission/conflict giữ cùng field error contract F2/F4/F5.
- [x] Run `npx.cmd vitest run tests/unit/legacy-snapshot.test.ts tests/unit/invalidation.test.ts tests/unit/submission-workflow.test.ts`; test mới đỏ ở duplicated mapping/missing invalidation helper trước extraction.
- [x] Extract command khỏi action từng nhóm; action chỉ actor→parse→command→invalidation/result. Archive/reopen được chuyển khỏi editorial-actions cũ vào publication actions/state-commands trước M3. Shared mapper không nhận Next/FormData; transaction phụ thuộc Prisma.TransactionClient, không mở transaction lồng. Dùng ActionResult từ F2, replacement metadata là typed error detail được giữ và client cập nhật tương ứng.
- [x] Full unit/typecheck/architecture check; integration direct approval/bulk và lifecycle khi DB an toàn. Test history snapshots byte-equivalent trước/sau, không mutate JSON fixture khi resolveLegacySnapshot.
- [ ] Review transaction/error boundary và commit `refactor: separate commands from actions and centralize publication invalidation`.

## M3: Xóa hẳn mã không dùng, dependency và tệp orphan có bằng chứng

**Files:** Delete `src/components/contact-form.tsx`, `featured-filmstrip.tsx`, `visibility-toggle-button.tsx`, `src/components/submission/optional-details.tsx`, sáu tệp `src/components/editorial/*` nếu còn ở path cũ (hoặc path moved tương ứng trong manifest); Delete `src/lib/home-section-filters.ts`, `nav-categories.ts`, `resource-presentation.ts` nếu không có caller mới. Delete editorial action stubs và tệp cũ sau M2; remove retired create/update/review wrappers, unused permission/actor/bulk exports và schema/type riêng. Delete `tests/unit/setup.test.ts`; Modify/delete test chỉ bảo vệ subtree chết (`nav-categories`, `home-section-filters`, `resource-presentation`, `review-workspace`, legacy editorial test cases), giữ coverage legacy adapter ở M2. Modify `package.json`, `package-lock.json`, `scripts/architecture-map.json`, `src/app/globals.css`; Create `scripts/audit-unused.mjs`, `scripts/audit-asset-references.ts`, `docs/superpowers/reports/refactor-deletions.md`.

**Interfaces:** `auditUnused(root:string): {unreachableFiles:string[];unusedExports:Array<{file:string;name:string}>;dynamicReferenceWarnings:string[]}` bắt đầu từ route/config/npm/script roots, mở rộng dynamic imports literal; unknown dynamic reference báo warning thay vì auto-delete. `auditAssetReferences(input:{prisma:PrismaClient;root:string}): Promise<{referenced:string[];unreferenced:string[];incompleteSources:string[]}>` chỉ SELECT, không write/delete. Deletion manifest mỗi mục ghi path/symbol, consumer check, test thay thế, lý do và status deleted/retained.

- [x] Test tên `retains files referenced only by revision history`: mock READ ONLY Prisma fixture có URL `/uploads/thumbnails/history.png` chỉ ở revision, `expect(result.referenced).toContain('/uploads/thumbnails/history.png')`; `expect(result.unreferenced).not.toContain('/uploads/thumbnails/history.png')`. Lặp cho authorDraft/editorial override/avatar. Graph fixture có module chỉ được gọi từ npm script/config/dynamic import literal phải reachable. Schema/table/migration không bị đánh dấu dead vì không có source import.
- [x] Run inventory tests trước helper (đỏ), implement READ ONLY reference traversal kể cả JSON strings có section prefix. Validate parser và normalize URL query/hash trước matching local asset path; external URL không được resolve thành path để delete.
- [x] Dùng rg + symbol/route graph xác minh từng candidate ngay trước xóa; xóa file/symbol và consumer test cũ cùng đợt. `clsx`/`tailwind-merge` chỉ remove dependency trực tiếp bằng `npm.cmd uninstall clsx tailwind-merge --ignore-scripts` sau khi xác nhận cả config/scripts không import. Không sửa lockfile thủ công. Dọn noUnused chẩn đoán thực, parameter bắt buộc do framework chỉ đổi `_name` với lý do. CSS xóa chỉ selector của dead subtree và không còn runtime reference.
- [x] Kiểm tra operational scripts/root logo: root logo so sánh hash/provenance với public logo; script không caller nhưng còn mục đích maintenance được giữ và tài liệu hóa, không tạo script mới không có entry point. Asset chỉ xóa nếu tất cả source/config/DB live/draft/revision/history/avatar scan hoàn chỉnh và không có reference; thiếu DB thì retained với lý do. Migrations và persisted legacy enums/tables giữ nguyên.
- [x] Run full unit/typecheck/architecture/unused audit và dedicated DB legacy regression. Viết deletion manifest theo kết quả thật; giải thích mọi candidate còn giữ. `git diff --check`, verify resolved absolute paths trong workspace trước recursive remove; không recursive delete computed path chưa kiểm chứng.
- [ ] Review deletion manifest/assets separately, commit `refactor: remove unreachable code and unused direct dependencies`.

## Exit gate

- [x] Không còn wrapper/backup bỏ không hoặc runtime import sang path đã xóa.
- [x] Dead code đã xóa thật, retained candidate có consumer/provenance/data reason; history không bị mất.
- [x] App build/typecheck/unit/architecture qua sau module move; integration không dùng dev database.
- [x] Chuyển Plan 03 với export/interface đích đã ổn định.
