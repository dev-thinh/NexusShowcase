# Rà soát bảo mật bổ sung — 26/10/2026

> Trạng thái 27/10/2026: F01–F05 đã có bản sửa và được áp dụng lên DB local; xem [báo cáo thực hiện](security-fixes-2026-10-27.md). Nội dung dưới đây giữ nguyên bằng chứng tại thời điểm audit.

## Phạm vi và kết luận

Rà soát working tree hiện tại, gồm các thay đổi UI và seed chưa commit; không suy kết quả từ báo cáo cũ. Đã xem xác thực/session, Server Actions, tất cả Route Handlers, public DTO, quyền bài viết/review, upload và phân phối file, cấu hình Next.js, Compose, dependencies và cấu hình DB đang dùng trong workspace.

Kết quả: 2 vấn đề mức cao ở dữ liệu/cấu hình demo hiện tại và 3 điểm thiếu kiểm soát tài nguyên mức trung bình theo phân tích mã. Mức cao phụ thuộc khả năng truy cập ứng dụng/cổng DB; chưa chứng minh khả năng truy cập từ Internet. Không xác nhận được IDOR chỉ từ việc URL chứa user ID. Không có bằng chứng website đã bị xâm nhập.

Đây là source/configuration review, truy vấn DB chỉ đọc và kiểm tra HTTP không phá hủy trên localhost. Không chạy stress test, không đổi mật khẩu/quyền/dữ liệu thật, không sửa logic bảo mật trong lượt audit này. Các integration test có cơ chế schema cô lập nhưng đã dừng ở bước kiểm tra template trước khi chạy test.

## F01 — Cao nếu ứng dụng có người ngoài truy cập: tài khoản demo có mật khẩu cố định

**Bằng chứng:** `prisma/seed.ts:10`, `:22–26`. Seed upsert cả admin và core, đặt mật khẩu cố định, kích hoạt lại tài khoản và tắt `mustChangePassword`. Truy vấn DB và bcrypt comparison chỉ đọc xác nhận cả 5 tài khoản demo đang ACTIVE, khớp mật khẩu demo đã nêu trong hội thoại và không bị bắt đổi mật khẩu. Không in password hash vào báo cáo.

**Tác động:** người biết credential demo có thể đăng nhập đúng tài khoản, bao gồm quản trị. Đây là đường đăng nhập hợp lệ với credential đã biết, không phải bypass xác thực. Chạy lại seed sau khi đổi mật khẩu còn có thể khôi phục credential yếu và kích hoạt lại tài khoản.

**Ngữ cảnh:** dữ liệu này được tạo theo yêu cầu demo trước đó; không coi mật khẩu demo là credential production hợp lệ. Tuy nhiên script hiện không có rào chặn chạy trên môi trường production hay giới hạn DB demo.

**Khắc phục:** tách seed demo khỏi bootstrap production; demo chỉ chạy khi được bật rõ và xác minh DB đích; bootstrap production không reset tài khoản đã có, nhận/generate secret riêng, bắt đổi mật khẩu ban đầu. Trước khi public, đổi credential demo và thu hồi session bằng sessionVersion. Không tự thay đổi các tài khoản trong audit.

## F02 — Cao nếu cổng DB truy cập được: DB mở mọi interface, credential mặc định và superuser

**Bằng chứng:** `docker-compose.yml:6–11` chứa credential mặc định và publish `5434:5432` không giới hạn loopback. Runtime `docker port` xác nhận `0.0.0.0:5434` và `[::]:5434`. So sánh có che giá trị xác nhận password trong DATABASE_URL hiện tại khớp Compose. Catalog `pg_roles` xác nhận application role có `rolsuper`, `rolcreatedb`, `rolcreaterole` đều true.

**Tác động:** máy có thể kết nối cổng này và biết credential mặc định có thể truy cập DB trực tiếp, bỏ qua phân quyền ứng dụng. Superuser làm tăng phạm vi ảnh hưởng tới toàn cụm PostgreSQL/container; không khẳng định từ đó có quyền trên host.

**Giới hạn:** bind mọi interface không tự chứng minh firewall/router cho phép truy cập Internet. Chỉ xác nhận cấu hình và trạng thái trên máy này, không suy sang server production khác.

**Khắc phục:** bind `127.0.0.1:5434:5432` cho phát triển; production dùng mạng riêng và allowlist; đổi password hiện có bằng thao tác DB có kế hoạch (sửa biến Compose không tự đổi password của volume đã khởi tạo). Tách role migration và role runtime; runtime chỉ có quyền cần thiết, không SUPERUSER/CREATEDB/CREATEROLE.

## F03 — Trung bình, phân tích mã: login limiter bị chia theo tên nhập và không giới hạn tổng request

**Bằng chứng:** `src/features/identity/server/auth.ts:33–46` ghi limiter trước truy vấn tồn tại account; key là identifier người gọi nhập. `src/features/identity/server/rate-limit.ts:12–18` INSERT/UPSERT theo key, không giới hạn cardinality hoặc tự xóa key cũ. Repo có cleanup command nhưng không có lịch chạy tự động. Không tìm thấy limiter theo nguồn đáng tin cậy hoặc budget tổng trên đường login trong app.

**Tác động:** thay đổi tên đăng nhập không tồn tại tạo nhiều bucket khác nhau, mỗi key có budget riêng và gây ghi DB/truy vấn liên tục. Giới hạn hiện tại có ích với đoán mật khẩu một account nhưng không chặn username spray hoặc tăng trưởng bảng bucket. Budget theo account cũng cho phép người ngoài làm cạn lượt đăng nhập của một account trong cửa sổ thời gian.

**Giới hạn:** chưa tạo hàng loạt request/bucket hoặc chứng minh DB bị cạn tài nguyên. Reverse proxy/WAF bên ngoài repo có thể giảm rủi ro này; chưa kiểm tra cấu hình đó.

**Khắc phục:** budget tổng và theo nguồn đã chuẩn hóa qua proxy tin cậy, giữ budget theo account; TTL cleanup có lịch và giới hạn kích thước lưu trữ; theo dõi cardinality/abuse. Không tin tùy ý X-Forwarded-For từ client.

## F04 — Trung bình, phân tích mã: upload thiếu quota dung lượng/số file lâu dài

**Bằng chứng:** `assets/server/actions.ts:16`, `avatar-actions.ts:25` cho phép 60 lần/phút/account; `upload-command.ts:20` giới hạn từng ảnh 5 MiB và resource/PDF 25 MiB; `storage.ts:6–23` ghi file/registry mà không kiểm tra tổng dung lượng/số file theo owner hay ngân sách toàn hệ thống. Các đường dẫn trên đều nằm dưới `src/features/`.

**Tác động:** một account hợp lệ có thể liên tục tạo file, kể cả đổi avatar nhiều lần để lại file không còn dùng. 60 file ảnh x 5 MiB/phút tương đương trần lý thuyết khoảng 300 MiB/phút/account; resource của core/admin cao hơn. Đây không phải thông lượng đã đo. Có thể làm tăng chi phí ImageKit hoặc chiếm disk khi dùng local. Các công cụ cleanup thủ công không thay thế quota.

**Giới hạn:** không upload thử file, không thử làm đầy disk hay gọi API ghi cloud. Nhà cung cấp có thể có quota riêng; chưa kiểm chứng account cloud.

**Khắc phục:** quota byte và số file theo account/toàn hệ thống, reservation nguyên tử trước ghi, giới hạn upload đồng thời, lifecycle cleanup có provenance và thời gian giữ an toàn.

## F05 — Trung bình khi dữ liệu/traffic tăng, phân tích mã: kiểm tra quyền file tốn kém trước khi từ chối khách

**Bằng chứng:** `src/features/assets/server/access.ts:14–39` truy vấn toàn bộ công trình cùng live/draft/history, tổng hợp liên kết/attachment/revision và chuẩn hóa JSON để tìm URL trước khi kiểm tra actor. Route thumbnails/resources/documents đều gọi ACL này; không thấy budget/cache ACL cho anonymous ở app. Các đường dẫn hợp lệ nhưng không tồn tại vẫn tới nhánh kiểm tra này.

**Tác động:** request GET rẻ của khách có thể kích hoạt truy vấn tốn kém theo kích thước kho bài và lịch sử. Cache byte/thumbnail hiện tại được sử dụng sau ACL nên không loại bỏ chi phí ACL. Không được bỏ kiểm tra quyền chỉ để tăng tốc.

**Giới hạn:** chưa chạy load test hoặc đo query plan ở quy mô lớn. Với 20 bài hiện tại chưa có bằng chứng gây outage; mức độ phụ thuộc quy mô và bảo vệ ở proxy.

**Khắc phục:** xây bảng tham chiếu asset có index, lưu quyền/public placement có cơ chế invalidation khi đổi quyền hoặc publish/archive; thêm budget request và concurrency. Nếu cache quyết định quyền, phải phân biệt user và thu hồi ngay khi visibility/ownership thay đổi.

## Kiểm tra ID người dùng và quyền truy cập

- Public directory/profile dùng explicit select trong `src/features/identity/model/public-user.ts`, không select email, passwordHash, studentId hay sessionVersion.
- `src/features/identity/server/profile-actions.ts` luôn update `actor.id`; upload/remove avatar cũng lấy `actor.id` từ server session. Không cho client chọn target account bằng URL/body.
- Các thao tác quản lý account yêu cầu ADMIN; command tạo/đổi quyền/vô hiệu hóa kiểm tra lại quyền quản trị trong transaction.
- Bài nháp/edit yêu cầu creator; review action yêu cầu ADMIN. Các truy vấn danh sách công khai lọc PUBLISHED và PUBLIC cho khách. PRIVATE ở thiết kế hiện tại nghĩa là nội bộ cho người đăng nhập, không phải chỉ creator.
- Các asset chỉ có draft/private reference không cấp anonymous access; registry ownership và quarantine được kiểm tra; SQL truyền tham số thay vì nối input vào câu SQL thực thi.
- Vì vậy `/members/<id>` cho hồ sơ công khai không phải bằng chứng IDOR. Đổi ID thành slug chỉ là đổi định tuyến, không thay thế kiểm tra quyền. Chưa xác nhận đường sửa user khác bằng đổi ID trong những đường đã xem và unit test đã chạy; chưa có kết quả integration mới để chứng minh toàn bộ DB-path.

## Hardening và phần chưa xác minh

- CSP production vẫn có `script-src 'unsafe-inline'` trong `next.config.ts:5`. Nên chuyển sang nonce/hash; đây là điểm phòng thủ yếu hơn, chưa chứng minh được XSS injection trong ứng dụng. JSX render text và URL validation hiện có.
- MFA cho admin, idle/absolute session lifetime riêng cho admin, bảo vệ login ở proxy là các bước nâng mức bảo vệ; chưa coi thiếu MFA là exploit đã xác nhận.
- `readAuthSecret` chỉ bắt buộc non-empty, không ngăn placeholder/yếu. Secret đang dùng không trùng `.env.example` và có ít nhất 32 ký tự; không in giá trị, không suy ra entropy chỉ từ độ dài.
- URL auth local đang là HTTP. Không suy HTTP localhost thành lỗi TLS production. Cần xác minh HTTPS, cookie Secure, HSTS và Host/X-Forwarded-* trên deployment thật. `trustHost: true` cần đi cùng proxy tin cậy.
- File thumbnail được kiểm tra dung lượng/signature; bản gốc không được decode/re-encode để chuẩn hóa hoặc xóa EXIF trước lưu. Không xác nhận có GPS/metadata nhạy cảm trong file thật. Đánh giá yêu cầu riêng tư trước public ảnh gốc.
- Chưa kiểm tra trực tiếp cấu hình bắt buộc signed URL/quyền private trên account ImageKit thật; code upload đặt private và server ký URL không đồng nghĩa toàn bộ origin đã được khóa đúng.
- Chưa kiểm tra firewall, backup/restore thực tế, quyền host, TLS endpoint public, log provider, bí mật trong toàn bộ lịch sử Git, hay dependency chưa có advisory. Kiểm tra backup không thuộc lượt audit này.

## Bằng chứng kiểm thử mới

- `npm run typecheck`: PASS.
- `npm audit --json`: 0 known advisories trong graph đang cài (272 entries theo metadata). Không đồng nghĩa không tồn tại lỗ hổng chưa công bố.
- Nhóm unit chuyên biệt xác thực/phân quyền/CSRF/asset/upload/password: 13 file, 82 test PASS.
- Full unit suite hiện tại: 133 file, 656 PASS / 1 FAIL. Test `tests/unit/category-page.test.ts` còn yêu cầu `object-contain`, trái thay đổi thumbnail `object-cover` vừa được người dùng duyệt. Không sửa test hay UI trong lượt audit; đây không phải bằng chứng lỗi bảo mật.
- Integration: 22 suite dừng ở setup, không có test chạy, do dedicated test DB template thiếu application tables. Không reset hay migrate runtime DB để ép test chạy. Không tái sử dụng kết quả integration của báo cáo trước như kết quả lần này.
- HTTP localhost không cookie: upload POST 403; review POST 401; moments/research PUT 403, với Origin hợp lệ và JSON rỗng. Đây là các phép kiểm tra từ chối, không thay đổi bài/file.
- GET public home APIs (featured/members/moments/research): 200, `Cache-Control: private, no-store`, không có key email/passwordHash/studentId/sessionVersion trong JSON đã lấy. Chỉ kiểm tra các response này, không chứng nhận mọi response RSC.
- Quét mẫu credential độ tin cậy cao trên 527 tracked file paths: không thấy private key, AWS key dạng phổ biến, GitHub token hay ImageKit private key theo mẫu. Không tính credential DB mặc định trong Compose là bí mật an toàn: nó được báo riêng ở F02. Đây không phải scan toàn bộ lịch sử Git.
- Tài khoản/credential và quyền DB được kiểm tra bằng SELECT và bcrypt comparison, không đăng nhập vào account production khác.

## Thứ tự xử lý

1. Trước public: F01 và F02 — tách demo, đổi credential, thu hồi session, thu hẹp cổng và quyền DB. Việc này thay đổi quyền truy cập vận hành, cần kế hoạch rollout riêng.
2. F03/F04 — bảo vệ login và ngân sách lưu trữ.
3. F05 — cải thiện ACL query có index với kiểm thử chống rò file khi thay đổi visibility.
4. Sửa template DB test, cập nhật assertion giao diện theo yêu cầu đã duyệt, rồi chạy lại toàn bộ suite; xác minh deployment HTTPS/proxy/ImageKit và CSP.

## Tham khảo

- OWASP IDOR prevention: https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html
- OWASP Denial of Service: https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html

Báo cáo này bổ sung trạng thái mới cho `docs/security-review-2026-10-26.md`; không sửa hoặc coi các kết quả lịch sử trong báo cáo cũ là bằng chứng hiện tại.
