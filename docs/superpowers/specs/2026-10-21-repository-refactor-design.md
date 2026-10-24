# NexusShowcase — thiết kế refactor và tối ưu toàn repo

Ngày: 2026-10-21. Trạng thái: spec và [implementation plan](../plans/2026-10-21-repository-refactor.md) đã được người dùng duyệt, thực thi inline tại checkout hiện tại. Kết quả và giới hạn kiểm chứng được ghi trong [báo cáo bàn giao](../reports/2026-10-21-refactor-verification.md).

Tài liệu đầu vào: [audit và phương án đã chốt](../audits/2026-10-21-repository-refactor-audit.md). Spec này là nguồn mô tả mục tiêu hiện hành cho đợt refactor; các tài liệu cũ vẫn lưu làm lịch sử quyết định.

## 1. Mục tiêu và hợp đồng cần giữ

Chuyển code sang modular monolith theo feature trên Next.js App Router, React, Prisma và PostgreSQL hiện có. Giảm coupling, tải thừa dữ liệu và điểm chặn hiển thị; xóa hẳn code không còn consumer. Thành công được chứng minh bằng hành vi, kiểm thử và số đo trước/sau, không dựa vào số thư mục hoặc số dòng giảm.

Giữ URL, nội dung, hình thức giao diện, lịch sử và nghiệp vụ: CORE_MEMBER/ADMIN soạn bài của mình; Admin duyệt trực tiếp; tối đa 3 bài ghim và thay thế tường minh; PUBLIC/PRIVATE; live content tách khỏi authorDraft; revision bất biến và reviewVersion chống xung đột. Bản sửa lỗi quyền truy cập, kiểm tra version và chống mất admin cuối được mô tả rõ bên dưới.

Không viết lại ứng dụng, tách microservice, nâng major dependency, thêm Redis/queue/event bus hay thay hệ thống thiết kế. Không xóa dữ liệu runtime, lịch sử Git hoặc migration đã áp dụng. Việc áp quyền lên URL file PRIVATE và hợp nhất identifier có casing khác nhau là hai thay đổi dữ liệu riêng, không thực hiện ngầm trong đợt này.

## 2. Kiến trúc đích

```text
src/
  app/
    layout.tsx                    # HTML, font, provider cấp ứng dụng
    (shell)/
      layout.tsx                  # Một Navbar được giữ qua điều hướng
      (site)/                     # /, /category, /members, /showcase, /contact
      (account)/                  # /dashboard, /admin, /account
      (auth)/                     # /login, giữ bố cục login hiện tại
    api/                          # HTTP auth/upload adapters
    uploads/                      # Download adapter, giữ URL hiện tại
  features/
    identity/
    publications/
    submissions/
    review/
    members/
    assets/
  shared/
    ui/
    navigation/
    dialogs/
    lib/
  server/
    db/
    config/
    observability/
tests/
  unit/
  integration/
  e2e/                            # Browser thật; không chứa test action giả E2E
  setup/
  fixtures/
```

Mỗi feature chỉ tạo thư mục `model`, `server`, `components` khi có nội dung thực tế. Contract client-safe là type/schema thuần, không kéo Prisma client runtime hoặc auth vào client bundle. Import trực tiếp entry point cần dùng; không có barrel export trộn server/client. Module server dùng `server-only`; server action dùng `use server` tại adapter.

Các dependency có hướng:

| Module | Trách nhiệm | Dependency được phép |
| --- | --- | --- |
| identity | Credentials, session, actor policy, member admin, public identity DTO | server infrastructure, shared |
| publications | Predicate visibility, card/detail/citation DTO, pin/visibility/archive/reopen commands | identity, server infrastructure, shared |
| assets | Validate upload, storage, download response | identity, server infrastructure, shared |
| submissions | Article/draft/snapshot, editor, save/submit/withdraw | identity, publication contracts/presentation client-safe, asset action/contracts, server infrastructure, shared |
| review | Quyết định Admin, legacy snapshot adapter | identity, submissions, publication commands/contracts, server infrastructure, shared |
| members | Directory/profile queries và UI | identity public contracts, publication visibility/contracts, server infrastructure, shared |

`shared` không phụ thuộc feature. `server` infrastructure không phụ thuộc UI hoặc feature. Publications không import review; submissions không import review. Luồng review gọi thao tác xuất bản qua helper nhận transaction client, không mở transaction lồng. Kiểm tra dependency cycle và server/client boundary là một phần nghiệm thu.

Route chỉ parse route/search params, compose UI/boundary và gọi query/action; không giữ business transaction hoặc full Prisma include inline. Query trả DTO cụ thể. Action chịu trách nhiệm actor, input runtime, command và invalidation; business command có thể kiểm thử độc lập với Next cache/router.

## 3. Shell và điều hướng

Một root layout duy nhất giữ provider hiện tại. Group `(shell)` giữ Navbar chung cho site/account/login, không đổi URL và không dùng nhiều root layout gây full navigation. Hai nhóm site/account đặt footer chung trong layout tương ứng; login giữ không có footer như hiện tại. Layout bảo vệ vùng account bổ sung gate phù hợp, nhưng action/query vẫn tự kiểm tra quyền.

Navbar có cùng hình học ở trạng thái tải; vùng tài khoản async nằm trong Suspense riêng. Dữ liệu bài viết không chặn việc render shell. Mỗi route có loading/error/empty state phù hợp; không dựng Navbar thứ hai trong root loading. Không thay toàn bộ nội dung bằng overlay che trắng.

Tab active biểu thị route đã commit; pending thể hiện riêng. Bấm liên tục phải kết thúc ở lựa chọn cuối, pending cũ không được xóa pending mới, back/forward và modified click giữ hành vi native. Nếu shell commit trước dữ liệu, nội dung route đích phải có heading/loading rõ, không hiển thị tab đích cùng nội dung hoàn chỉnh của route cũ như đã tải xong.

Home hero, ô tìm kiếm và tiêu đề section không chờ truy vấn feature/member. Auth và dữ liệu được defer vào boundary nhỏ nhất có thể mà vẫn giữ policy. Không thêm cache session xuyên request. Request-scoped cache đang có được giữ.

## 4. Query, DTO và phân trang

Mọi query hiển thị công trình dùng policy chung: khách chỉ PUBLISHED + PUBLIC; tài khoản có phiên hợp lệ được xem PUBLISHED nội bộ theo hợp đồng hiện hành. Dashboard/review dùng policy riêng, không tái sử dụng query công khai để lấy draft. Profile và count phải dùng cùng visibility predicate như danh sách.

DTO công khai không có email, passwordHash, studentId, sessionVersion, authorDraft, private review hoặc toàn văn không cần thiết. Bỏ studentId khỏi dữ liệu directory dành cho khách. Citation DTO chỉ chứa title, slug, publishedYear, issuer, contributor names; không truyền nguyên bản ghi qua client boundary.

Tách card SELECT, citation projection và detail SELECT. Card SELECT không lấy content hoặc attachments nếu card không hiển thị chúng. Không fetch trước toàn bộ danh sách để chỉ lấy một trang. Count và page có cùng filter; order luôn có ID tie-breaker.

Giữ page size hiện tại: research/search 10, robotics 9, directory MEMBER 6, members/all 12, bulk posts 10. Dashboard/profile và contributor search được thêm truy vấn phân trang/tìm kiếm có giới hạn; dùng control hiện có. Không đổi ý nghĩa filter hoặc bỏ mất công trình khi phân trang. Count tổng độc lập với page length.

Directory hiện xếp theo số công trình nhìn thấy, rồi tên tiếng Việt. Query ranking phải count theo visibility và giữ cả người có 0 công trình. Dùng truy vấn PostgreSQL có tham số với Vietnamese ICU collation đã được kiểm chứng trên DB riêng; kiểm thử đối chiếu comparator hiện hành bằng tên có dấu và tie. Nếu môi trường không hỗ trợ collation tương đương, giữ comparator đúng nghiệp vụ với projection xếp hạng tối thiểu rồi hydrate trang, ghi rõ giới hạn còn lại; không tuyên bố đã có phân trang database hoàn toàn. Không tự đổi thứ tự vì tiện cho ORM.

Index và cache là tối ưu dựa trên số đo: chỉ thêm index khi query plan trên fixture lớn chứng minh cần. Không thêm shared cache cho kết quả phụ thuộc tài khoản. Cache công khai chỉ được thêm khi đường invalidation đầy đủ và test không rò quyền.

## 5. Actor policy và mutation

Identity cung cấp actor từ server gồm id, role, trạng thái tài khoản và cờ đổi mật khẩu. Cả upload action/HTTP adapter, save, submit, review, pin, bulk và member admin dùng policy thống nhất. Tài khoản phải đổi mật khẩu chỉ truy cập luồng đổi mật khẩu/sign-out cần thiết, chưa được ghi nghiệp vụ hoặc upload.

Auth secret bắt buộc lấy từ AUTH_SECRET hoặc NEXTAUTH_SECRET đã được validate; không có fallback cố định. Thiếu secret phải báo lỗi cấu hình rõ khi khởi tạo chức năng auth. Không ghi secret/token/password hoặc URL chứa credential vào log. Session/JWT type có khai báo rõ, thay cast `any` tại các consumer được chuyển.

Input action là dữ liệu không tin cậy: Zod parse trước khi truy cập thuộc tính hoặc normalize. Result dùng discriminated union với các nhóm VALIDATION, UNAUTHORIZED/FORBIDDEN, NOT_FOUND, CONFLICT, INTERNAL; client giữ thông báo tiếng Việt và field errors. Không trả exception thô.

| Command | Điều kiện và tính nguyên tử |
| --- | --- |
| Save draft | Existing item nhận expectedReviewVersion từ editor; kiểm tra owner/state/version và ghi cùng transaction; trả version mới. Create không cần expected version. |
| Submit/withdraw | Nhận version cập nhật mới nhất; kiểm tra owner và state; đổi state, revision/audit trong transaction. |
| Review | Admin, state/version hợp lệ; áp snapshot và live relations nguyên tử; revision bất biến; published update chưa duyệt không sửa live. |
| Set pin/replace/bulk | Kiểm tra PUBLISHED và capacity trong transaction; cập nhật state mong muốn; không thể ghim ARCHIVED hoặc vượt 3 khi concurrent. |
| Set visibility | Nhận PUBLIC/PRIVATE mong muốn; không dùng read-then-toggle dễ mất thao tác. |
| Archive/reopen | State transition/version được kiểm tra trong transaction; archive luôn xóa pin. |
| Change role | Không cho tự hạ quyền; không được làm mất admin ACTIVE, không deleted cuối cùng trong transaction. |

Editor lưu version trong state và cập nhật sau save. Submit dùng ID/version của lần save vừa hoàn tất, tránh closure cũ. Một save đang chạy không được bị response cũ đánh dấu sạch cho nội dung vừa sửa mới hơn; conflict giữ nội dung local và báo cần tải/đối chiếu. Test gồm hai tab lưu tuần tự và hai request đồng thời.

Không tự đổi cách casing của identifier trong database. Hợp đồng hiện tại được kiểm thử; xuất báo cáo duplicate/case-collision chỉ đọc và mô tả migration riêng nếu phát hiện.

Transaction helper nhận Prisma.TransactionClient có kiểu cụ thể. Serialization conflict trả lỗi có thể thử lại; không retry vô hạn hoặc lặp side effect ngoài DB. Invalidation chạy sau commit, tập trung theo loại thay đổi và affected slug/member IDs. Lỗi invalidation được log; không báo mutation thất bại như chưa ghi khi DB đã commit.

## 6. Storage và dữ liệu lịch sử

Upload giữ giới hạn, magic-byte validation, tên UUID và URL hiện hành. Paths filesystem và URLs được xử lý riêng để chạy đúng Windows/Linux. Bản refactor thống nhất actor policy nhưng không tự chuyển public upload sang storage bảo vệ vì chưa có mô hình ownership asset và chính sách migration URL.

Chỉ xóa asset nếu chứng minh không được tham chiếu bởi live items, draft JSON, article sections, revisions, editorial overrides, user avatars, static source/config và operational manifests. Nếu không truy cập được DB để kiểm kê, giữ file và ghi rõ chưa đủ bằng chứng; không suy ra orphan từ import graph. Không có job tự xóa orphan trong phạm vi này.

Giữ enum/table legacy, immutable snapshots và mergeEditorialOverrides còn dùng cho reviewVersion=0. Xóa UI/action cũ không đồng nghĩa xóa dữ liệu cũ. Cần một legacy adapter nhỏ có fixture regression; không để kiến trúc hiện tại phụ thuộc toàn bộ code Editor cũ.

## 7. Danh mục xóa và tiêu chí dead code

Ứng viên trong audit phải được kiểm tra lại trước khi xóa. Đồ thị bao gồm App Router entry points, import/export/re-export, dynamic import/require, server action consumers, npm/config/scripts, CSS assets, test và operational/data references. Test chỉ giữ một implementation cũ không biến nó thành nghiệp vụ đang dùng.

Xóa cùng một đợt:

- ContactForm, FeaturedFilmstrip, OptionalDetails, VisibilityToggleButton và sáu component editorial không reachable.
- Helper home-section-filters, nav-categories, resource-presentation nếu không có consumer mới hợp lệ.
- Retired create/update/review wrappers, chín Editor action stubs, schema/type riêng của luồng đã nghỉ, helper/export chỉ có test lỗi thời gọi.
- Tệp editorial-actions sau khi chuyển archive/reopen còn cần thiết sang publications.
- Tautological setup test; thay test FIFO 10 pin và fake Editor E2E bằng hợp đồng hiện hành. Test bảo mật/cạnh tranh không bị bỏ để làm suite xanh.
- Dependency trực tiếp clsx/tailwind-merge nếu static/config/runtime reference check tiếp tục xác nhận không dùng; dùng package manager cập nhật lockfile.
- Import/local/parameter/CSS cũ chỉ còn do subtree bị xóa; không xóa token/style nếu route còn dùng hoặc chưa kiểm tra responsive/reduced-motion.

Không tạo compatibility wrapper vô dụng hoặc backup folder. Consumer nội bộ chuyển import trong cùng đợt; server action đang active có thể giữ tên export để giảm thay đổi hợp đồng, nhưng implementation nằm ở feature đích. Cập nhật test path có ý nghĩa thay vì tạo lại tệp cũ để chiều test.

One-off Prisma scripts cần provenance check: seed-categories không được phép âm thầm công khai bài khi giữ lại; normalization script phải có tài liệu vận hành hoặc được xác định đã hết mục đích trước khi xóa. Root logo chỉ xóa khi kiểm tra tham chiếu và provenance cho thấy bản public là nguồn chính. Tài liệu lịch sử đánh dấu superseded, không coi là dead executable code.

## 8. Database test và migration

Không chạy integration/browser fixture ghi DB trước khi guard mới được chứng minh bằng unit test. Guard parse URL nghiêm ngặt, chỉ cho PostgreSQL; chuẩn hóa host/default port, database đã decode và schema hiệu lực. Không dùng credential hoặc tham số query không liên quan để phân biệt DB. So sánh resource identity, không so sánh chuỗi URL.

Giới hạn mặc định bảo thủ: DB test phải có tên database riêng nhận diện test và không cùng database với DATABASE_URL, dù schema/credentials/query khác. Host alias local phổ biến phải chuẩn hóa. Dedicated DB được verify qua catalog chỉ đọc trước setup; schema-per-worker chỉ được tạo bên trong DB test đã xác minh. Chạy suite tuần tự/fileParallelism=false trước; chỉ bật parallel khi isolation được kiểm thử. Fixture cleanup chỉ tác động dữ liệu thuộc test, không reset toàn bộ pins chung.

Tách unit/integration/browser config rõ; unit luôn không cần DB. Unit auth kiểm tra callback/provider ứng dụng, không chỉ mock field/bcrypt. Browser E2E dùng runner thực với isolated test DB và test-only credentials tạo bởi fixture; không đi qua DB phát triển.

Migrations hiện có không khởi tạo database rỗng. Trước khi chọn rollout, kiểm tra migration history chỉ đọc và dựng DB disposable riêng. Ưu tiên baseline initial migration mô tả schema trước các incremental migration, thử migrate deploy từ rỗng và đường upgrade từ fixture cũ. DB đã có schema cần baseline resolve rõ ràng sau diff tương đương; không tự resolve/migrate/reset DB người dùng. Không sửa nội dung migration đã áp dụng. Tài liệu phân biệt fresh install, existing unmanaged schema và managed upgrade; nếu baseline không chứng minh tương đương, dừng bước rollout đó với bằng chứng cụ thể, phần refactor khác vẫn tiếp tục.

## 9. Hiệu năng và khả năng quan sát

Đo bản production với cùng seed và cấu hình, tách khỏi cold compile dev. Ghi commit/worktree, dataset size, DB/network, browser/device profile và cache state. Có fixture 20 bài để kiểm tra thực tế và fixture lớn riêng (ít nhất 1.000 công trình/100 thành viên) để phát hiện query không giới hạn; không ghi fixture benchmark vào DB người dùng.

Với home → research → robotics → members → home: thu ít nhất 10 lượt warm và các lượt cold riêng. Ghi click→pending, click→route shell, click→data, query count/time, auth duration và RSC bytes; lưu median/p95 và raw sample. Không log nội dung riêng tư.

Nghiệm thu: pending/đổi shell có phản hồi dưới 200 ms ở browser test với server delay được kiểm soát; click cuối cùng thắng và không có màn hình trống/hiển thị sai route. Payload list/citation không có toàn văn/draft; query list có giới hạn. Warm median/p95 không được chậm hơn baseline trên cùng harness ngoài sai số đo đã ghi nhận. Nếu chưa chứng minh cải thiện data latency, báo số đo và giới hạn; không coi skeleton là cải thiện query.

Không bỏ kiểm tra session/visibility để đạt số đo. CSS consolidation giữ computed style theo viewport, focus và reduced motion; animation/observer chỉ tối ưu khi còn consumer hoặc profile chứng minh cần.

## 10. Chuyển đổi, kiểm thử và bàn giao

Thực hiện theo các đơn vị có thể review riêng: test safety/baseline → lỗi quyền/version/transaction → dead code → feature modules → shell/DTO/pagination → style/docs/setup → verification toàn hệ thống. Mỗi đơn vị đọc đầy đủ code/consumer liên quan, có regression test khi sửa hành vi, và tự qua kiểm tra trước khi chuyển tiếp.

Đây chưa phải task-by-task implementation plan. Plan phải map từng đơn vị sang file, test đỏ/xanh, dependency và checkpoint review. Cách triển khai khuyến nghị là agent theo đơn vị độc lập sau khi foundation ổn định; không để nhiều agent cùng sửa file chung hoặc dùng chung DB mutable. Người dùng chọn phương thức khi duyệt plan.

Các check bàn giao:

1. Typecheck, unused checks, dependency/server-client boundary checks, unit tests và git diff check.
2. Integration trên dedicated DB: public boundary, role/password lifecycle, direct approval/live draft, version conflict, concurrent pin/archive/bulk, test DB guard.
3. Production build; fresh-install/upgrade DB disposable; browser journey cùng history/focus/dialog/IME/upload/reduced-motion và pending navigation.
4. Reachability audit cuối với deletion manifest; asset/script giữ lại phải có lý do; không thêm scaffold không dùng.
5. Architecture/setup/command docs hiện hành; CI dùng typecheck/unit/build, integration/browser chỉ với DB test cô lập và secrets từ CI. Không tự publish/deploy.
6. Báo changed behavior, đường dẫn đã chuyển, số lượng và loại tệp bị xóa, test kết quả thực tế, số đo trước/sau và phần chưa kiểm chứng. Không tuyên bố “optimize toàn bộ” chỉ vì đã đổi cấu trúc.

Giữ các thay đổi người dùng đã yêu cầu từ trước: 20 bài mẫu, script seed và sửa loading/home. Không reset/stash/drop công việc chưa commit. Khi dùng worktree, đưa baseline này vào bằng phương pháp có kiểm chứng, không vô tình chỉ refactor HEAD cũ.

## 11. Checklist review spec

- [x] Phản ánh hướng modular monolith và cleanup đã được người dùng chốt.
- [x] Có boundary/dependency rõ; không dùng microservice hoặc abstraction không có consumer.
- [x] Phân biệt code chết, asset orphan và dữ liệu lịch sử.
- [x] Có hợp đồng quyền, version, transaction và invalidation.
- [x] Có quy trình DB test/migration không nhắm vào DB người dùng.
- [x] Có nghiệm thu hiệu năng dựa trên số đo, không hứa loại bỏ chính xác 5 giây chưa đo.
- [x] Không có placeholder; các giới hạn/nhánh môi trường được mô tả bằng điều kiện kiểm chứng.
- [x] Người dùng review spec này: “oke” sau khi nhận link spec.
- [x] Dùng superpowers:writing-plans để viết và tự review kế hoạch triển khai.
- [ ] Người dùng review plan và chọn phương thức triển khai.
