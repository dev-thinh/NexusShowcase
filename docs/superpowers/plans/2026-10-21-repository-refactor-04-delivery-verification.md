# Delivery and Final Verification Implementation Plan

> Execution record 2026-10-21: completed inline in the approved current checkout. Verification details and scope limits are in reports/2026-10-21-refactor-verification.md. Commit steps remain unchecked because Git author identity is unavailable; immutable per-task snapshots replace commits. No merge/push/deployment was requested.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Setup/migration có thể tái lập, kiểm tra tự động và báo cáo bàn giao dựa trên bằng chứng.

**Architecture:** Disposable DB kiểm chứng đường fresh-install/upgrade; CI tái sử dụng script đã chạy local. Không thay đổi DB của người dùng, không tự publish/deploy/merge.

**Tech Stack:** Stack hiện tại, PostgreSQL16 test service, Node22 CI, Playwright đã có từ F6.

**Spec:** [Spec](../specs/2026-10-21-repository-refactor-design.md). **Prerequisite:** Plans01–03; V1 có thể khảo sát read-only sớm sau F1, không chạy rollout vào DB thực. **Global Constraints/Review Focus:** [roadmap](2026-10-21-repository-refactor.md#global-constraints).

## V1: Database baseline, operational inventory và setup tái lập

**Files:** Create `docker-compose.test.yml`, `scripts/verify-database-upgrade.ts`, `tests/fixtures/schema-before-editorial.prisma`, `prisma/migrations/20261001_initial_baseline/migration.sql`, `prisma/migrations/migration_lock.toml`, `docs/database-operations.md`; Modify `README.md`, `.env.example`, `package.json`; Modify `prisma/seed.ts`, `prisma/seed-mock-posts.ts`, giữ/remove `prisma/seed-categories.ts` và `normalize-content-types.ts` theo M3 evidence; Report `docs/superpowers/reports/database-verification.md`.

**Interfaces:** `verifyDatabaseUpgrade(input:{freshUrl:string;legacyFixtureUrl:string;outputPath:string}):Promise<void>` chỉ nhận DB test đã qua F1 guard; không có hàm auto resolve DB thật. `inventoryIdentifierCollisions(client:PrismaClient):Promise<Array<{normalized:string;userIds:string[]}>>` READ ONLY, report không xuất email raw. Seed mock idempotent20 PUBLIC, bootstrap không công khai bài cũ hoặc reset ngoài opt-in.

- [x] Trên DB disposable riêng, tạo schema pre-editorial fixture theo schema hiện tại trừ đúng phần được thêm bởi ba incremental migrations, không đoán từ README cũ. Ghi hash của ba migration hiện tại; test assert không đổi. Verify migrate-deploy từ empty đang thất bại vì thiếu baseline để lưu bằng chứng đỏ.
- [x] Generate initial baseline SQL bằng installed Prisma CLI đã kiểm tra help; baseline chỉ core pre-editorial schema, không tạo lại table/column sẽ được migration sau thêm. Add migration_lock provider PostgreSQL; run full migration chain từ empty, schema diff với current schema phải rỗng. Không sửa SQL hoặc checksum migrations cũ.
- [x] Dựng fixture có live item, draft/revision/history và legacy override; áp incremental migrations trên DB fixture riêng và verify row counts/immutable history/live content/version/cascade còn đúng, role Editor chuyển CORE_MEMBER theo migration hiện có. Fresh empty + upgrade cả hai phải đạt schema đích; nếu không chứng minh tương đương, không rollout và report blocker thay vì rewrite applied history.
- [x] Inventory migration history/identifier collision/assets từ DB runtime chỉ SELECT nếu kết nối sẵn; không chạy resolve/deploy/reset vào đó. Tài liệu tách fresh install, unmanaged existing schema cần diff+baseline resolve có kiểm soát, managed upgrade. Giữ seed mock20 và bootstrap đã yêu cầu; RESET_DATABASE không tự bật trong script/CI app bootstrap. Operational utility chỉ giữ khi có entry point/documented owner, không tạo script treo.
- [ ] Run dedicated upgrade verifier + full unit/typecheck; report DB names anonymized, migration hashes/schema diff/fixture invariants, chưa kiểm tra gì ghi rõ. Commit `build: document and verify reproducible database setup` sau review migration riêng.

## V2: CI và command/docs hiện hành

**Files:** Create `.github/workflows/ci.yml`; Modify `package.json`, `vitest.config.ts`, `vitest.integration.config.ts`, `playwright.config.ts`, `README.md`, `docs/architecture.md`, `UI_DESIGN_RULES.md`; Add superseded note/index cho old `docs/superpowers/specs/*` và `plans/*` bị thay hợp đồng; không xóa historical docs có giá trị chỉ vì không import.

**Interfaces:** Commands bắt buộc: `typecheck`=`tsc --noEmit`; `check:unused`=`tsc --noEmit --noUnusedLocals --noUnusedParameters` + AST unused report gate với entry point exceptions rõ; `check:architecture` từ M1; `test:unit`, `test:integration`, `test:e2e`, `bench:navigation`, `db:verify-upgrade` gọi implementation F1/F6/V1. `check` chạy typecheck/unused/architecture/unit và không đụng DB. Browser không bị Vitest gom vào unit/integration.

- [x] Kiểm tra từng command độc lập trên checkout hiện tại, không lấy `npm test` mơ hồ làm CI. Test config reject integration fixture khi không có TEST_DATABASE_URL; unit `npm.cmd run check` vẫn chạy không DB. CI matrix unit/typecheck/build trên Windows/Linux; integration/browser tuần tự trong Linux job với postgres16 riêng, Node22 và test secrets cấp bởi job, không dùng env development.
- [x] CI dùng npm ci, prisma generate, guard/verify trước fixture writes, build production rồi chạy browser với test-only credentials. Upload artifacts metrics, schema verification và browser traces khi fail; không upload .env, database dump chứa mật khẩu hoặc auth storageState. Không tăng coverage bằng test mock không chạm app logic.
- [x] README có cấu trúc mới, command thực tế, setup test DB, migration policy, upload storage persistence, unresolved asset access policy và performance harness. Mark old Editor/10pin specs superseded qua index/note, không sửa lịch sử thành như chưa từng tồn tại. Hợp nhất quy chuẩn UI theo computed style P3, không áp redesign từ tài liệu cũ.
- [x] Run `npm.cmd run check`, `npm.cmd run build`, dedicated `test:integration`, `test:e2e`, `db:verify-upgrade`; CI YAML/command mapping review không có default action publish hoặc DB production. Local không chạy GitHub workflow thật thì ghi chưa kiểm chứng remote CI; không giả kết quả từ YAML hợp lệ.
- [ ] Review CI/secrets/runtime setup và commit `ci: enforce architecture tests and isolated browser verification`.

## V3: Whole-branch review, benchmark diff và bàn giao

**Files:** Create `docs/superpowers/reports/2026-10-21-refactor-verification.md`; Update deletion manifest, architecture map, benchmark reports và checkbox thực tế của bốn plans. Mã sản phẩm chỉ sửa khi reviewer/verification có lỗi tái hiện, kèm test phù hợp.

**Interfaces:** Báo cáo cuối map requirement → task → verification command → kết quả/artifact; mỗi blocked check có nguyên nhân cụ thể và tác động, không dùng “all passing” nếu có check chưa chạy.

- [x] Chụp final git diff/status; xác nhận baseline dirty changes từ yêu cầu trước vẫn còn/được chuyển đúng, không vô tình xóa20 mock posts/scripts. Re-run reachability/symbol audit sau mọi move; kiểm tra không có stale path, dual implementation hoặc script không entry point.
- [x] Run fresh full `npm.cmd run check`, production build, dedicated integration/browser/database-upgrade commands; kiểm tra exit code và số lượng case, phân biệt test removed obsolete vs coverage mất. DB/schema/fixture blocker giữ task pending, không coi report là thay thế test.
- [x] Compare baseline/after với harness/environment/data tương đương: pending/shell/data/auth/query/RSC tách rõ; 10 warm/cold và raw samples; không vượt warm median/p95 baseline ngoài noise đã ghi. Browser delayed response <200ms feedback, rapid last-click/history/focus/IME/upload/reduced-motion qua. Không hạ budget hoặc bỏ session policy để làm benchmark đẹp.
- [x] Request fresh whole-branch review dùng requesting-code-review; kiểm tra đặc biệt private metadata, asset retention, stale draft, capacity concurrency, schema rollout và client bundle boundary. Sửa issue theo systematic-debugging/TDD; không mở scope không liên quan.
- [ ] Report rõ file/symbol/dependency đã xóa, asset/script/data còn giữ vì lý do gì, behavior đã sửa, measured improvement và check chưa kiểm chứng. Commit report nếu Git identity có sẵn; dùng finishing-a-development-branch sau khi kiểm tra đủ điều kiện, không merge/deploy khi user chưa chọn.

## Exit gate

- [x] Người dùng nhận diff reviewable, deletion manifest và kết quả thực tế.
- [x] Mọi requirement hoàn tất có artifact; requirement blocked chưa được đánh dấu hoàn tất.
- [x] Không có dữ liệu người dùng bị reset/migrate/xóa ngoài scope; không publish/deploy tự động.
