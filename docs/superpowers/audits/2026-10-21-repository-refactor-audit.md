# Repository refactor: audit và thiết kế đề xuất

Ngày: 2026-10-21. Trạng thái: audit hoàn tất ở mức nêu dưới đây; người dùng đã chốt hướng kiến trúc và [spec hoàn chỉnh](../specs/2026-10-21-repository-refactor-design.md). [Implementation plan](../plans/2026-10-21-repository-refactor.md) đang chờ review và chọn cách triển khai; chưa triển khai refactor.

## Mục tiêu và giới hạn

Yêu cầu: rà soát toàn repo, refactor, tối ưu, tổ chức cấu trúc hợp lý, clean code và xóa vĩnh viễn tệp/hàm không dùng.

Giả định thiết kế: giữ nghiệp vụ hiện hành, URL, giao diện, dữ liệu và lịch sử. Luồng chính là tác giả soạn bài và Admin duyệt trực tiếp. Không khôi phục luồng Editor. Thay đổi bảo mật khắc phục hành vi sai được kiểm thử riêng. Không nâng cấp framework hoặc thêm hạ tầng phân tán chỉ để đổi kiến trúc.

## Phạm vi đã khảo sát

- Kiểm kê 220 tệp trong `src`, `tests`, `prisma`, `docs`; 118 tệp `src`, 74 tệp kiểm thử, 20 tài liệu; khoảng 15.991 dòng code/test/CSS/SQL tại thời điểm kiểm kê.
- Đọc cấu hình, README, quy chuẩn UI, schema và migrations; kiểm tra luồng truy vấn, xác thực, actions, routes, component và kiểm thử theo ba nhánh audit độc lập.
- Dựng đồ thị import tĩnh cho 117 tệp TypeScript/TSX từ 22 entry point App Router: 103 tệp reachable, 14 tệp ứng viên không reachable. Đây là kết quả static analysis, không thay thế kiểm tra tham chiếu động hoặc dữ liệu.
- Các lượt đọc component lớn có phần bị giới hạn output. Không coi đây là chứng nhận đã đọc từng dòng của mọi tệp. Trước mỗi đợt sửa cần đọc đầy đủ đơn vị được thay đổi và consumer của nó.
- Không đọc `.env`, không chạy integration test, không kết nối/ghi database và không thay đổi mã sản phẩm trong đợt audit này.
- Có thay đổi chưa commit từ các yêu cầu trước, gồm seed mock và sửa loading/trang chủ. Phải giữ và tách chúng khỏi thay đổi refactor.

## Baseline đã chạy

| Kiểm tra | Kết quả |
| --- | --- |
| `npx.cmd tsc --noEmit` | Qua, exit 0 |
| `npm.cmd run test:unit` | 342 qua, 8 lỗi; 56/58 tệp qua |
| `tsc --noUnusedLocals --noUnusedParameters` | 11 chẩn đoán TS6133; cờ này chưa bật trong cấu hình hiện tại |
| Tái hiện database guard bằng URL giả, chỉ gọi hàm thuần với env riêng | Chấp nhận cùng database phát triển khi thêm `&test=true`; không mở kết nối |
| Production build, browser E2E, latency/query benchmark | Chưa chạy; không có kết luận hiệu năng thực tế |

Sáu lỗi unit nằm ở `tests/unit/upload.test.ts:125`: kỳ vọng dấu `/` trong đường dẫn Windows. Hai lỗi nằm ở `tests/unit/citation-panel-spacing.test.ts:12`: kiểm tra chuỗi class chưa có trong trang chủ/danh mục. Không sửa code hoặc xóa test chỉ để tăng số test qua.

## Phát hiện ưu tiên

### P1: quyền truy cập và tính an toàn của test

1. `src/app/members/[id]/page.tsx:29` chỉ lọc PUBLISHED, không lọc PUBLIC cho khách; card hiện tiêu đề, tóm tắt, thumbnail của bài PRIVATE. Trang chi tiết lại chặn khách tại `src/app/showcase/[slug]/page.tsx:62`. Count của directory cũng chưa thống nhất chính sách visibility. Cần một predicate công khai dùng chung và test guest/member/admin.
2. `tests/setup/database-guard.ts:17` so sánh URL dạng chuỗi; đoạn 24–28 chấp nhận bất kỳ query có chữ `test`. URL cùng host/database/schema với thêm `test=true` vượt qua guard. Các suite có thao tác xóa và sửa fixture nên phải sửa trước khi chạy integration. So sánh danh tính database/schema chuẩn hóa và từ chối URL sai định dạng.
3. `src/lib/auth.ts:14` có fallback secret cố định nếu env thiếu. Cần cấu hình bắt buộc, không đưa giá trị secret vào log/tài liệu.
4. `src/actions/upload-actions.ts:23` kiểm tra role nhưng không chặn `mustChangePassword` như `src/lib/current-user.ts:33`. Thống nhất actor policy cho action và HTTP upload.
5. `src/actions/showcase-actions.ts:169` đọc trạng thái trước transaction; khi ghim, transaction update chỉ theo ID. Có thể bị archive xen giữa và để bài ARCHIVED vẫn isPinned. Đưa kiểm tra và ghi vào cùng transaction, có test cạnh tranh.

### P2: ranh giới module, dữ liệu và lỗi

- `src/actions/showcase-actions.ts:43` dùng `input.content` trước validation; input sai kiểu có thể throw. Parse ở biên action, sau đó mới normalize.
- `src/actions/admin-actions.ts:92` cho phép tự hạ quyền/loại bỏ admin cuối; cần chặn mất quyền quản trị có chủ đích bằng test và transaction.
- Draft save không nhận version từ client; CAS đọc version mới trên server không phát hiện editor tab cũ lưu tuần tự sau tab mới. Nếu xử lý trong scope này, thêm expected version xuyên suốt DTO/editor/action và test xung đột.
- Tạo/login identifier chưa có chính sách casing nhất quán. Cần kiểm kê dữ liệu trùng và thiết kế chuyển đổi trước khi đổi ràng buộc database.
- Trang chủ/danh mục query toàn bộ scalar ngoài authorDraft và truyền nguyên item sang `CitationModal`, trong khi citation chỉ cần title/slug/year/issuer/tên tác giả. Danh mục còn tải attachments không sử dụng. Tách select và DTO theo mục đích.
- Directory lấy toàn bộ thành viên rồi phân trang trong memory; dashboard/profile có tập kết quả không giới hạn. Chuyển lọc/phân trang về database với thứ tự và tie-breaker được kiểm thử.
- Navbar/footer được khai báo lại ở nhiều page. Navbar đợi session; page còn có các dependency auth/category trước Suspense. Shared layout và boundary riêng sẽ làm vòng đời điều hướng rõ hơn. `getSession` đã cache trong một request; không kết luận gọi nhiều lần là query auth nhiều lần.
- Cache invalidation lặp và nhiều catch nuốt lỗi. Tập trung invalidation, phân biệt lỗi validation/conflict/infrastructure và log phía server không lộ dữ liệu nhạy cảm.

### Kiểm thử và vận hành

- `tests/integration/showcase-pinning.test.ts:119` vẫn kỳ vọng FIFO 10 bài, trái nghiệp vụ giới hạn 3 bài và thay thế tường minh.
- `tests/e2e/workflow.test.ts:96` vẫn gọi luồng Editor đã nghỉ; đây là Vitest node với identity mock, không phải browser E2E.
- Nhiều suite sửa toàn bộ pin và có thể chạy đồng thời trên cùng DB. Cần fixture/schema isolation hoặc serialization phù hợp trước khi tin kết quả concurrency.
- Earliest migration bắt đầu bằng ALTER TYPE, chưa có baseline khởi tạo database rỗng hoặc migration lock. Thiết kế baseline và kiểm chứng fresh-install/upgrade; không rewrite migration đã áp dụng.
- 23/58 unit files kiểm tra source text; các test này dễ vỡ khi chuyển thư mục và không chứng minh tương tác trình duyệt. Giữ assertion kiến trúc có mục đích; thay assertion giao diện bằng hành vi.
- Chưa có browser runner, CI workflow hay benchmark điều hướng. Lỗi chuyển tab 5 giây chưa được đo để phân tách compile dev, auth, query, RSC và render.

## Xóa mã không dùng

Xóa hẳn khỏi working tree cùng import, export, test cũ liên quan; không để wrapper giả hoặc thư mục backup. Lịch sử Git vẫn giữ lại bản cũ. Mọi ứng viên phải được kiểm tra lại consumer khi thực hiện.

Ứng viên đã xác nhận không reachable từ route qua source import:

- `src/components/contact-form.tsx`
- `src/components/featured-filmstrip.tsx`
- `src/components/submission/optional-details.tsx`
- `src/components/visibility-toggle-button.tsx`
- Sáu tệp trong `src/components/editorial/`; route review hiện tại dùng `SubmissionPreview` và `ApprovalControls`.
- `src/lib/home-section-filters.ts`, `src/lib/nav-categories.ts`, `src/lib/resource-presentation.ts`; còn test hoặc tham chiếu từ subtree cũ.
- Action stub `createShowcaseItemAction`, `updateShowcaseItemAction`, `reviewShowcaseItemAction`; chín stub luồng Editor, cùng schema/type chỉ phục vụ chúng.
- Helper không có caller production: `requireCurrentUser`, `canUserEditPublication`, `canUserPublish`, `isMemberOrHigher`, `updateBulkPostsAction`; kiểm tra dependency nội bộ rồi xóa consumer test lỗi thời.
- `tests/unit/setup.test.ts` chỉ kiểm tra `true === true`; loại bỏ.
- `clsx`, `tailwind-merge` không có import runtime/config hiện tại; có thể bỏ dependency trực tiếp và cập nhật lockfile bằng package manager.

`editorial-actions.ts` còn archive/reopen: chuyển các action này sang module publication trước khi xóa tệp cũ. `ContributorInput`, `ShowcaseCard`, pin/withdraw controls vẫn dùng, phải giữ.

Những thứ chưa chứng minh được là thừa:

- Migrations, enum/bảng legacy và `mergeEditorialOverrides`: dữ liệu persisted cũ vẫn được adapter review sử dụng. Chỉ loại bỏ sau inventory/migration dữ liệu có phương án bảo toàn lịch sử.
- 16 tệp upload trong `public` (~12,9 MB): 15 tệp không được source tham chiếu trực tiếp, nhưng URL có thể ở database/section/snapshot. Cần inventory tham chiếu database chỉ đọc trước khi phân loại orphan; không xóa chỉ vì rg không thấy.
- `public/logo.svg` đang dùng. Bản `logo.svg` root là ứng viên duplicate, cần so sánh nội dung và provenance.
- `prisma/seed-categories.ts` không có caller và tự công khai các bài theo vị trí không có order; đề xuất xóa sau khi xác nhận không còn quy trình vận hành dùng nó.
- `prisma/normalize-content-types.ts` là công cụ sửa dữ liệu, chưa chứng minh không dùng chỉ bằng đồ thị import.
- Spec/plan cũ là hồ sơ quyết định, không phải runtime dead code. Đánh dấu superseded và có tài liệu kiến trúc hiện hành.

## Ba phương án

| Phương án | Lợi ích | Đánh đổi |
| --- | --- | --- |
| A. Modular monolith theo feature, refactor tăng dần (đề xuất) | Phân ranh giới rõ, giữ Next/Prisma, kiểm chứng từng phần và xóa dead code | Cần vài đợt chuyển import và test |
| B. Giữ thư mục, chỉ tối ưu từng điểm nóng | Ít thay đổi nhất, sửa lỗi nhanh | Boundary và trùng lặp còn tồn tại; đáp ứng chưa đủ yêu cầu cấu trúc |
| C. Viết lại/tách nhiều service | Tách deployment độc lập | Chưa có nhu cầu hoặc số đo chứng minh; tăng vận hành và rủi ro migration |

## Thiết kế đề xuất cho phương án A

```text
src/
  app/                    # Route adapters; route groups giữ nguyên URL
    (site)/               # Shared navbar/footer, home/category/member/showcase/contact
    (auth)/               # Login
    (account)/            # Dashboard/admin/account, vẫn kiểm tra quyền ở action/query
    api/                  # HTTP adapters
    uploads/              # Download adapter, chính sách file cần quyết định riêng
  features/
    identity/             # Session, credentials, actor policy, member admin
    publications/         # Public queries, card DTO, visibility, pin, archive/reopen
    submissions/          # Draft/article schemas, snapshots, save/submit/withdraw, editor
    review/               # Admin decisions, legacy snapshot adapter
    members/              # Directory/profile queries và presentation
    assets/               # Upload validation, filesystem storage và download
  shared/
    ui/                   # Primitive dùng xuyên feature
    navigation/           # Link, active state, loading/pending lifecycle
    dialogs/              # Dialog controller/provider
    lib/                  # Utility thuần có consumer thực tế
  server/
    db/                   # Prisma singleton, transaction helpers cần thiết
    config/               # Runtime env validation
    observability/        # Structured errors và timing
```

Luồng: route/component → query hoặc server action → policy/schema → domain command + transaction → Prisma/storage. Không import server module vào client; không dùng barrel export trộn client/server. Action adapter mỏng, command/result có kiểu rõ, không thêm generic repository khi chưa có nhu cầu.

Giữ `authorDraft` tách live content, revision bất biến, `reviewVersion`, public DTO và ngưỡng 3 pin. Không cache dùng chung dữ liệu phụ thuộc quyền; cache chỉ được đưa vào sau khi rõ scope và invalidation. Query SELECT đúng DTO; index chỉ thay đổi sau EXPLAIN/đo query.

Tài nguyên PRIVATE hiện có thể tải bằng URL trực tiếp: đây là hành vi đã tồn tại. Việc áp quyền ở mức file cần thiết kế riêng ownership và chuyển URL cũ, không âm thầm phá URL trong đợt cleanup.

## Thứ tự triển khai dự kiến

1. Củng cố baseline: guard database, fixture isolation, cập nhật test trái nghiệp vụ và lỗi cross-platform.
2. Sửa visibility, actor policy, validation và transaction theo TDD; giữ test hợp đồng bảo vệ nghiệp vụ.
3. Xóa dead subtree/action/schema/helper/dependency đã xác minh, dọn test tương ứng.
4. Tách feature modules, query DTO, mapper và invalidation; chuyển từng feature cùng consumer, không để wrapper bỏ không.
5. Shared route shell, boundary theo trang, phân trang database và giảm payload; đo trước/sau.
6. Hợp nhất CSS tương đương theo computed style, cập nhật tài liệu hiện hành; chuẩn hóa migration/setup và CI.
7. Chạy typecheck, unused checks, unit/integration, production build, browser journeys; rà diff và dead-code graph cuối.

Đây là thứ tự thiết kế, chưa phải implementation plan được duyệt. Không chạy DB test hoặc migration trước khi guard/isolation được xác minh.

## Tiêu chí nghiệm thu

- Các URL, search/filter, return links, citation và workflow hiện hành hoạt động; guest không thấy metadata PRIVATE; bản live không bị draft ghi đè.
- Mutation dùng actor từ server; stale version/concurrent pin/review/archive có test hành vi.
- Tất cả kiểm tra được yêu cầu phải qua; báo riêng check chưa chạy hoặc bị chặn. Có script typecheck/unused, test suites tách rõ; build fresh-install/upgrade được kiểm chứng trong môi trường riêng.
- Browser test thật cho chuyển liên tục home/category/members, back/forward, click cuối cùng, focus/modal/IME và reduced motion. Ghi nhận cold/warm, latency auth/query, RSC bytes và thời gian nội dung xuất hiện; không gọi skeleton là bằng chứng dữ liệu đã nhanh hơn.
- Danh sách xóa có bằng chứng reachability và test; không còn unused imports/params mới. Asset/data legacy chưa chứng minh orphan không bị xóa.
- Mỗi đợt thay đổi có diff review và validation riêng; không đưa thêm công nghệ chỉ để đạt tên gọi “system design”.

## Trạng thái quy trình Superpowers

- [x] Phân loại architectural, phản ánh mục tiêu và giả định.
- [x] Audit context, baseline, phương án và thiết kế đề xuất.
- [x] Người dùng duyệt thiết kế/phạm vi: “oke chốt thế đi”.
- [x] Viết spec hoàn chỉnh và nhận review spec.
- [x] Dùng writing-plans và tự review kế hoạch triển khai.
- [ ] Người dùng review plan và chọn cách triển khai.
- [ ] Triển khai TDD, review, verification và báo cáo kết quả.

Theo `superpowers:brainstorming/SKILL.md`: “Architectural: the human partner reviews and approves the written spec, then reviews the written implementation plan and selects its execution method.” Vì vậy audit này không tự coi là đã được phép bỏ qua các bước duyệt của skill được yêu cầu.
