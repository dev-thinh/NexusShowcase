# Khắc phục sau audit — 25/10/2026

Phạm vi là các phát hiện trong [audit repository](repository-audit-2026-10-24.md), giữ các thay đổi ảnh, modal, animation và chuyển trang đã được duyệt. Không commit hoặc push trong đợt này.

## Thay đổi

- Nâng Zod và Vitest; vá dependency bắc cầu của Prisma/PostCSS theo phạm vi cần thiết. Giữ Prisma hiện tại, không dùng `audit fix --force`.
- Chuẩn hóa identifier mới và tra cứu không phân biệt hoa/thường; chặn trùng cả nhóm alias đăng nhập ở PostgreSQL. Migration phát hiện xung đột trước khi tạo index, không tự sửa hay gộp tài khoản. Tạo thành viên kiểm tra lại quyền admin trong transaction.
- Đổi mật khẩu dùng điều kiện hash/phiên bản đã đọc để tránh hai yêu cầu đồng thời ghi đè nhau. Login giới hạn 10 lần/15 phút theo identifier; upload 60 lần/phút theo tài khoản, dùng bộ đếm PostgreSQL chung giữa các instance.
- Registry lưu URL, provider, fileId, chủ sở hữu và trạng thái private. Mọi route media kiểm tra quyền trước khi đọc bytes/cache; response `private, no-store`. Bài PUBLIC cho khách đọc; bài PRIVATE đã xuất bản cho người đăng nhập; bản nháp/lịch sử theo quyền người tạo/người duyệt. Một ảnh đang được dùng công khai vẫn là ảnh công khai.
- Upload ImageKit mới bật private origin, đọc bằng chữ ký ngắn hạn phía server. Upload local nằm ngoài `public/`. Ảnh responsive dùng derivative cùng origin có kiểm tra quyền, không đưa ảnh riêng tư qua cache dùng chung của Next Image.
- Kiểm kê orphan bao gồm avatar, gallery, nội dung, link, attachment, bản nháp, editorial và revision. Cleanup mặc định dry-run, giữ file không rõ nguồn gốc, yêu cầu tối thiểu 7 ngày và khóa/trigger bảo vệ tham chiếu khi áp dụng. Chưa chạy xóa orphan thực tế.
- PageReveal giải phóng animation đã kết thúc, tránh giữ DOM lâu; giữ vị trí nút từ pointerdown đến click để focus không làm mất thao tác. Giữ animation cuộn sau khi trang đích xuất hiện.
- Typecheck dùng cấu hình ổn định riêng để không đua với file generated khi build. Loại CSS/keyframe và nhánh DeferredSection không dùng theo audit trước đó.

## Thay đổi trên dữ liệu thực tế

Đã kiểm tra không có nhóm identifier xung đột. Ba migration hardening mới được áp dụng trong một transaction sau khi đối chiếu schema; fingerprint tài khoản, bài và gallery không đổi. Không rewrite tài khoản, reset database hay thay lịch sử migration unmanaged hiện có. Lịch sử này vẫn cần đối chiếu riêng trước một lần `prisma migrate deploy` trên môi trường đó.

Đã xác minh chuyển cả 8 ảnh ImageKit cũ có tham chiếu công khai sang private origin, giữ nguyên đường dẫn và đối chiếu SHA256 bytes trước/sau. Provider xác nhận private và cả hai URL original không ký đều trả 401/403 trước khi ghi registry. Chỉ purge hai URL original chính xác của từng ảnh khi cache còn public; không purge wildcard. Một số lượt chờ purge dừng đúng giới hạn 30 giây; chạy tiếp sau khi provider xử lý xong hoàn tất đủ 8 ảnh. File cũ không bị xóa. Nội dung đã từng được tải công khai không thể thu hồi khỏi máy người đã tải.

Kiểm kê sau cùng: nguồn tham chiếu đầy đủ, 0 legacy chưa có registry, 0 ứng viên orphan. Dry-run cleanup ghi nhận 0 quarantine và 0 file bị xóa.

## Kiểm chứng

Các kiểm thử DB/trình duyệt dùng schema UUID trong database test riêng, không dùng dữ liệu tài khoản thật.

- Typecheck, unused gate và kiểm tra kiến trúc đều qua; không có module không thể đi tới hoặc vi phạm dependency. Hai export lifecycle archive/reopen vẫn là ngoại lệ đã được duyệt trước đó.
- Unit: 110 file, 533 ca qua với `npm run test:unit -- --maxWorkers=2`. Lượt chạy mặc định song song với trình duyệt có một ca biên dịch CSS vượt timeout 5 giây; chạy lại toàn bộ với hai worker qua, không tăng timeout hay bỏ ca kiểm thử.
- Integration: 21 file, 76 ca qua trên chuỗi migration mới trong schema cô lập. Một lượt chạy cùng build/browser trước đó vượt timeout ở việc tạo fixture lồng nhau; lượt chạy lại toàn bộ qua.
- `npm run db:verify-upgrade`: fresh/legacy schema diff rỗng, toàn bộ invariant được giữ.
- `npm audit`: 0 lỗ hổng ở mọi mức, gồm dependency phát triển.
- Registry inventory: nguồn đầy đủ, không còn legacy chưa đối chiếu, không có orphan đủ điều kiện; cleanup chỉ dry-run.
- Production harness build qua; toàn bộ 59 ca E2E qua, gồm điều hướng admin/public, chuyển trang trước khi cuộn lên, tải ảnh sớm, editor hai gallery, kéo thả, upload/download PDF, quyền truy cập và reduced motion. Bảy ca click từng lỗi trước bản sửa PageReveal đều qua trong lượt đầy đủ sau cùng.
- Production preview với dữ liệu thật: cả 8 ảnh gallery trả bytes ảnh hợp lệ qua route derivative có cache private sau khi origin đã được chuyển private.
- `git diff --check`: qua.
