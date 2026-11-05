# Loading workspace và tải ảnh — 2026-11-05

## Nguyên nhân xác định từ mã và tài liệu Next.js cài trong repo

- `/my-works/new` có trang tiêu đề riêng, gọi tạo draft rồi `router.replace` sang editor. Loading chung là danh sách card; khi tạo draft xong, `busy` bị tắt trước khi navigation xong, để lại khoảng trống. Trang đích lại đổi tiêu đề thành “Chỉnh sửa bản nháp”.
- Thumbnail, ảnh/PDF trong section, resource và avatar được gửi trực tiếp qua Server Action. Tài liệu `node_modules/next/dist/docs/01-app/02-guides/server-actions.md` xác nhận dispatcher phía client chạy Server Action tuần tự. Upload chậm có thể giữ các action kế tiếp trong hàng đợi.
- Editor đưa `uploads > 0` vào biến `busy` dùng cho toàn bộ fieldset, nên mọi ô nhập bị khóa khi có một upload.
- Avatar gọi `revalidatePath('/', 'layout')`, làm mất hiệu lực toàn bộ cây route, sau đó client còn gọi `router.refresh()`. Việc tải lại UI không cần thiết để thay một URL ảnh.

## Thay đổi

- Skeleton theo cấu trúc workspace cho navigation, route loading `/new`, `/[id]/edit`, và quá trình tạo draft; giữ đến khi navigation commit. Tiêu đề draft thống nhất “Soạn thảo công trình”.
- Giữ mutation ID tạo draft trong sessionStorage đến lúc chuyển trang xong, để reload trong lúc chờ không tạo trùng. Sau khi rời `/new` thành công, lần đăng bài mới tiếp theo tạo draft mới.
- Upload qua HTTP riêng đến `/api/upload`, dùng chung helper xử lý lỗi, timeout và phản hồi lỗi server. Target avatar cho thành viên thường vẫn đi qua xác thực, kiểm tra cùng origin, giới hạn body stream, rate limit, kiểm tra loại/dung lượng ảnh, gắn owner và ghi avatar của tài khoản hiện tại. Không cấp quyền upload tài nguyên thông thường cho thành viên thường.
- Khi upload, vẫn cho nhập thông tin cơ bản và autosave. Tạm khóa subtree media/resource để tránh callback upload ghi đè chỉnh sửa cùng dữ liệu; chờ upload xong mới preview/gửi duyệt. Có trạng thái tải rõ ràng.
- Avatar cập nhật state tại chỗ và phát sự kiện theo user ID để đồng bộ ảnh trên navbar. Cache chỉ vô hiệu hóa các trang liên quan; bỏ refresh thủ công sau upload/xóa avatar.

## Giới hạn

Kiểm thử production chạy với storage local và database test riêng. Các thay đổi giải quyết việc khóa giao diện/hàng đợi và refresh dư thừa; chưa đo thời gian truyền ảnh thực tế đến ImageKit trong môi trường triển khai. Những lỗi state trong báo cáo rà soát trước vẫn là các mục riêng, chưa được sửa trong đợt này.

## Kết quả kiểm chứng

- `npm run check`: đạt typecheck, kiểm tra code không dùng, kiến trúc (0 vi phạm), **172 file / 913 unit test**. Bộ kiểm tra code không dùng vẫn ghi nhận hai export có sẵn `reopenShowcaseAction`, `archiveShowcaseAction`, không làm lệnh thất bại.
- Production build bằng `next build --webpack` trong harness riêng: đạt.
- E2E nhóm autosave, mất response/retry gửi duyệt và PDF: **7/7 đạt** trên bản production đã sửa.
- E2E mới `workspace-upload-interaction.spec.ts`: **3/3 đạt** trên lần chạy cuối. Bao gồm skeleton xuyên suốt tạo draft và lần tạo kế tiếp có ID mới; vẫn nhập và lưu tiêu đề được khi upload bị cố tình giữ chờ; thành viên thường đổi avatar qua HTTP, vẫn mở sửa hồ sơ được, navbar cập nhật đúng, không có request refresh trang hồ sơ sau upload, xóa avatar trở về chữ.
- Lần đầu ghép 10 ca có 9 ca đạt và ca avatar timeout do chọn đúng fixture bắt buộc đổi mật khẩu (member 002). Đã đổi sang fixture thành viên thường hợp lệ và chạy lại cả 3 ca mới đạt; không sửa cơ chế bắt đổi mật khẩu.
- Review độc lập theo skill `requesting-code-review`: không có phát hiện cần xử lý.
- `git diff --check`: đạt. Chưa commit/push.
