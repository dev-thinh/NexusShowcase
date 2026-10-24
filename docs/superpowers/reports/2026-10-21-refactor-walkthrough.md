# Refactor walkthrough

Execution update: người dùng chuyển sang **inline execution**; tiếp tục cùng kế hoạch và ledger, walkthrough sau mỗi task. Review tổng thể ở cuối.

## F6 — browser harness và số đo ban đầu

- Chạy ứng dụng production với schema test riêng; giữ thông tin đăng nhập trong tệp tạm và xóa sau chạy. Timing chỉ xuất số liệu khi bật rõ ràng.
- Đã ghi 88 mẫu trên 20/1000 bài, 100 thành viên; không timeout nội dung. Trang chủ warm median/p95: 332,6/630,5 ms và 627,1/633,9 ms. Đây là thời điểm dữ liệu đầu tiên hiển thị, không phải toàn trang hoàn tất.
- Unit 392/392, TypeScript và build qua. Browser: 2 qua, 1 lỗi có thật ở lần duyệt bài đầu tiên: DB đã lưu nhưng UI còn chờ. Giữ regression để sửa tại M2/P1; chưa tuyên bố đã tối ưu hiệu năng.
- Dùng Edge 155.0.4283.62 cho phép đo trước/sau. Số đo query bao gồm prefetch trong cửa sổ quan sát; giá trị không thu được để null.

## F2 — xác thực và quyền thao tác

- Thống nhất `getActor` kiểm tra tài khoản từ DB, xóa module `current-user` cũ và đổi toàn bộ consumer. Upload qua action/HTTP bị chặn khi buộc đổi mật khẩu; riêng đổi mật khẩu vẫn được phép.
- Bỏ secret mặc định, yêu cầu cấu hình rõ ràng. JWT bị thu hồi trả về hết phiên; thêm type cho session/user/token và logger chỉ ghi metadata an toàn.
- RED bắt được upload sai quyền và JWT không thu hồi đúng; GREEN toàn bộ unit 403/403, provider/logger 8/8 sau bổ sung, TypeScript qua. Thêm `ActionResult` dùng chung cho các task tiếp theo.

## F3 — quyền xem và dữ liệu công khai

- Khách chỉ thấy bài PUBLISHED/PUBLIC trên hồ sơ; thành viên đăng nhập thấy thêm bài nội bộ đã xuất bản. Count danh bạ dùng cùng policy; loại tài khoản đã xóa mềm.
- Bỏ MSSV khỏi query/type/card công khai. Danh sách dùng selector riêng, trích dẫn chỉ nhận tiêu đề/năm/đơn vị/tên tác giả; không truyền nguyên bài vào client.
- RED tái hiện tiêu đề PRIVATE trong HTML hồ sơ guest. GREEN integration 3/3, unit liên quan 41/41, TypeScript qua. Phân trang danh bạ/hồ sơ sẽ thực hiện tại P2.

## F4 — bản nháp và phiên bản editor

- Validation chạy trước normalize nên input `null`, số hoặc content sai kiểu trả lỗi rõ ràng. Lưu/gửi bài yêu cầu phiên bản editor đã đọc; hai tab không ghi đè âm thầm.
- Editor dùng phiên bản save trả về khi gửi duyệt; phản hồi save cũ giữ trạng thái chưa lưu của chỉnh sửa mới. Lỗi lưu giữ nguyên nội dung.
- GREEN unit 24/24, integration 12/12, TypeScript qua; kiểm tra hai save đồng thời chỉ một lần thành công. Luồng cập nhật vẫn giữ nguyên bài đang xuất bản và lịch sử bản nộp.

## F5 — thao tác trạng thái nguyên tử

- Ghim đơn/bulk và hiển thị dùng một transaction, nhận trạng thái đích rõ ràng. Kiểm tra bài còn xuất bản, capacity và bài thay thế ngay trong transaction; archive bỏ ghim cùng lần ghi.
- Chặn Admin tự hạ quyền; kiểm tra lại quyền trong transaction và giữ ít nhất một Admin hoạt động. Session cũ bị thu hồi khi đổi quyền.
- GREEN unit 403/403, integration ghim/bulk/Admin 15/15, race bổ sung 5/5, TypeScript qua. Giữ dữ liệu dialog thay thế có kiểu rõ ràng.

## M1 — cấu trúc theo feature

- Chuyển 74 tệp vào identity/assets/publications/submissions/review/members, shared và server. Tách bốn module trộn trách nhiệm; không để alias tương thích hoặc implementation song song.
- Navbar/management ở composition shell; predicate của tác giả thuộc submissions để tránh cycle. Tách thao tác ghi tệp vào storage, giữ nguyên URL.
- Thêm manifest di chuyển, tài liệu kiến trúc và checker import graph. GREEN unit 407/407, TypeScript, architecture không vi phạm; kiểm tra upload/download/graph 27/27.

## M2 — command, snapshot và kết thúc action

- Tách action/command cho bản nháp, duyệt bài, tài khoản, mật khẩu và upload. Dùng mapper quan hệ snapshot chung, giữ adapter legacy chỉ áp dụng với reviewVersion 0. Invalidation chạy sau commit; lỗi hạ tầng phân biệt với conflict.
- DB test gây lỗi audit thật xác nhận rollback nội dung/quan hệ; lỗi cache vẫn trả commit thành công. Sửa thiếu sót glob Tailwind sau M1, thêm test CSS production.
- Lần duyệt đầu trước sửa đã lưu nhưng chờ client điều hướng. Server action nay redirect sau commit; browser production 3/3 qua, giữ timeout 8 giây và kiểm tra cả cập nhật bài đang xuất bản.
- GREEN unit 414/414; integration toàn suite 45/45, sau đó direct approval 12/12 gồm hai ca bổ sung; TypeScript và architecture qua.

## M3 — xóa mã chết có bằng chứng

- Xóa thực tế 23 tệp (15 runtime/8 test cũ), các stub/schema/helper không còn caller và hai dependency `clsx`, `tailwind-merge`. Test bulk còn dùng chuyển sang adapter đang chạy trong UI.
- Thêm audit reachability/asset chỉ đọc và bật `noUnusedLocals`/`noUnusedParameters`. Graph còn 0 tệp unreachable; hai export lifecycle giữ theo spec. Manifest ghi lý do từng mục.
- Giữ logo gốc vì khác hash với logo public; giữ 16 upload do nguồn template còn cần xác minh provenance. Không xóa asset hoặc lịch sử chỉ vì thiếu import.
- GREEN unit 360/360, integration liên quan 20/20, TypeScript/noUnused và architecture qua.

## P1 — shell cố định và điều hướng

- Navbar nằm trong layout chung, phần tài khoản tải riêng trong Suspense. Route groups giữ nguyên URL; bỏ header/footer trùng và loading cấp root lặp Navbar. Login không footer; vùng nghiệp vụ có gate đổi mật khẩu.
- Phản hồi pending xuất hiện ngay, active theo route đã commit, token cũ không xóa request mới. Giữ query trong URL object, Back/Forward và Ctrl-click; tab công khai dùng được trên mobile.
- RED xác nhận Navbar cũ remount. GREEN unit 363/363, TypeScript/architecture/build; browser điều hướng 4/4, gồm phản hồi dưới 200 ms khi RSC chậm và click nhanh. Auth/duyệt bài 2/2 qua trên cùng runtime trước lần đổi riêng cách mô phỏng mạng trong test.

## P2 — truy vấn giới hạn và contributor lookup

- Tách query theo feature, áp giới hạn tại DB và phân trang server cho danh sách công khai, hồ sơ, dashboard và quản trị. Count dùng cùng policy; UI chỉ nhận trường cần hiển thị. Home trả hero trước khi session/data hoàn tất.
- Contributor tìm từng trang 20, debounce 200 ms và bỏ phản hồi cũ. Editor chỉ hydrate tên đã chọn, gồm contributor trong authorDraft; sửa lỗi mất focus khi chuyển trang picker.
- GREEN unit 371/371, integration liên quan 8/8, browser production 3/3, TypeScript/architecture qua. PostgreSQL tiếng Việt được đối chiếu bằng fixture; DB thiếu collation có fallback metadata được ghi rõ. Số đo dataset 1000/100 được thu cùng benchmark P3.

## P3 — observer, CSS và số đo

- Observer chỉ quét document lúc khởi tạo, sau đó xử lý DOM mới; gộp CSS hero tương đương và xóa pulse-wave không còn consumer. Computed style khớp ở 390/768/1440, reduced motion/modal/focus vẫn qua. Sửa thêm mất focus contributor khi dùng bàn phím.
- Unit 372/372; browser presentation/điều hướng 5/5, lượt keyboard/presentation cuối 4/4; typecheck/architecture qua. Benchmark đủ 88/88 mẫu, cùng môi trường baseline.
- Trang chủ với 1.000 bài giảm median 627,1→335,7 ms và p95 633,9→344 ms. Báo cáo giữ cả các mẫu/p95 tăng nhẹ, giới hạn đo và giá trị unavailable: [chi tiết](refactor-performance.md).

## V1 — database và seed có thể tái lập

- Thêm baseline trước ba migration hiện có; không sửa SQL/checksum cũ. Cài mới và nâng cấp trên schema test riêng đều có diff rỗng, tám invariant dữ liệu/lịch sử/cascade qua.
- Bootstrap/mock seed chạy hai lượt vẫn đúng 20 bài mẫu và không đổi bài PRIVATE sẵn có. Bổ sung command verify/inventory, compose test và quy trình fresh/unmanaged/managed.
- Unit 375/375, integration seed 1/1, TypeScript/architecture qua. Runtime inventory chỉ đọc: chưa có managed history, không thấy collision; giữ 16 upload chưa đủ provenance. [Chi tiết](database-verification.md).

## V2 — command, CI và dependency

- Thêm `check` không cần DB, gate unused với hai ngoại lệ lifecycle có lý do; đổi Vitest config sang ESM. CI Node22 có matrix Windows/Linux và PostgreSQL16 integration/browser tuần tự; chỉ upload artifact đã giới hạn.
- Cập nhật patch Next/React/PostCSS trong major hiện hành. Audit giảm 18→16, chưa sạch; phần còn lại cần thay đổi major và đã [ghi rõ](dependency-review.md).
- Local: check 375/375, integration 53/53, browser production 12/12, build và verifier migration qua. GitHub workflow chưa được chạy remote. Auth flows không lưu trace chứa credential; chỉ guest navigation/presentation có trace khi lỗi.

## V3 — review cuối, kiểm chứng và bàn giao

- Review độc lập không có Critical, có hai Important: race vô hiệu hóa Admin và snapshot lịch sử có tags/issuer. Cả hai được tái hiện RED rồi sửa, giữ nguyên lịch sử và strict input bên ngoài. Một Minor về rule kiến trúc phòng ngừa được ghi hoãn; code hiện tại không vi phạm.
- Stress browser tái hiện thêm lỗi duyệt đã lưu DB nhưng UI còn pending sau redirect RSC. Tách quyết định qua HTTP JSON có kiểm tra quyền/origin/body16KiB; chỉ chuyển trang sau thành công. Lỗi giữ nguyên input, chặn bấm lặp và bỏ completion sau unmount. Thành công duyệt dùng tải document mới; link thông thường vẫn dùng shell cố định.
- Kiểm tra cuối:380/380 unit,57/57 integration,14/14 browser,10/10 lượt duyệt lặp; build production và verifier fresh/legacy đều qua. Timeout giữ nguyên, không retry. IME, PDF upload/download đúng byte, rapid navigation/history và computed style390/768/1440 đều qua.
- Benchmark cuối đủ88 mẫu: home1.000 bài median627,1→347,8ms; pending p95 tối đa8,4ms. Một số route cache có median tăng tối đa30,2ms, chưa rõ nguyên nhân; không khẳng định mọi route nhanh hơn. [Số liệu đầy đủ](refactor-final-performance.md).
- Giữ đủ20 slug mock ban đầu. Cleanup cuối0 schema/0 user-item test/0 thư mục harness; không reset/migrate DB ứng dụng hoặc xóa upload chưa rõ nguồn gốc. Giữ checkout `dev` và snapshot vì thiếu Git identity; chưa merge/push/deploy. [Bàn giao và giới hạn](2026-10-21-refactor-verification.md).

## Bổ sung — chuyển trang trước và tải theo cuộn

- Link nội bộ cùng dùng skeleton trang đích ngay khi bấm; không giữ nội dung cũ hiển thị trong lúc chờ response. Có loading boundary riêng cho site/account; giữ navbar, lịch sử và thao tác click chuẩn.
- Trang chủ chỉ gọi dữ liệu công trình/thành viên khi section tiến gần viewport200px; có skeleton/lỗi/thử lại, chống gọi trùng. Test chặn request xác nhận vẫn rời trang ngay khi section chưa tải xong.
- Xác nhận phân trang DB: nghiên cứu10/trang, robotics9/trang với skip/take và filter/count thống nhất. Không query hết rồi slice trên client. Tách build harness để không xung đột dev server đang chạy.
- Full check385 unit, production build và17 browser test qua; cleanup0. Benchmark protocol mới chưa chạy, không tái dùng số cải thiện cũ cho hành vi mới. [Walkthrough chi tiết](2026-10-21-navigation-viewport-followup.md).

Kế hoạch: [4 đợt, 15 task](../plans/2026-10-21-repository-refactor.md). Người dùng đã duyệt làm tại repo hiện tại, sau đó chọn thực thi inline và yêu cầu walkthrough sau mỗi task.

Mỗi mục hoàn tất ghi thay đổi, kiểm thử thực tế, kết quả review và phần chưa kiểm chứng. Các task chưa có mục hoàn tất vẫn đang chờ thực hiện; không coi tài liệu này là chứng nhận toàn bộ refactor đã xong.

## Thiết lập execution

- Giữ nguyên baseline chưa commit của các yêu cầu trước; chụp manifest/hash và diff trong workspace SDD riêng của plan.
- Branch hiện tại là `dev`; không tạo worktree vì người dùng đã chọn làm tại repo hiện tại.
- Commit đang không khả dụng do Git author identity chưa được cấu hình; không tự đặt danh tính. Task được review bằng snapshot trước/sau, gồm cả tệp mới.
- Thứ tự foundation: F1 → F6 → F2 → F3 → F4 → F5, để có harness DB an toàn trước và số đo trước khi sửa auth/payload.

## F1 — bảo vệ database test và baseline

- Guard PostgreSQL kiểm tra danh tính database; không chấp nhận query/credential/schema để phân biệt cùng database. Xác minh catalog trước khi ghi.
- Mỗi suite tạo schema UUID với enum/FK riêng; cleanup chỉ schema thuộc fixture. Suite dùng mock chuyển sang unit; test Editor/10-pin cũ được thay bằng direct Admin/3-pin, giữ kiểm thử hành vi còn cần.
- RED: 8 trường hợp vượt guard cũ. GREEN: guard 20/20, unit 390/390, integration 36/36 hai lượt, TypeScript và diff check qua. Kiểm tra cuối: 0 schema fixture, 0 user/item trong template.
- Review: Approved, không có Critical/Important; cảnh báo Vite CJS có sẵn là Minor.
- Database test còn thiếu được tạo riêng và chỉ khởi tạo khi mới/trống; database ứng dụng không bị ghi. Chưa commit do thiếu Git identity.
