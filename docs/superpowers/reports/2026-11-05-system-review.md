# Rà soát hệ thống — 2026-11-05

## Phạm vi và kiểm chứng

Rà các luồng công khai (trang chủ, nghiên cứu, dự án, chi tiết, thành viên), điều hướng tài khoản/quản trị, tạo/sửa/lưu/gửi duyệt, xét duyệt, tài khoản và vòng đời tệp. Đối chiếu source, các kiểm thử hiện có và tài liệu kiến trúc; kiểm tra giao diện công khai trên local dev ở 390×844 và 1440px. Không sửa mã ứng dụng, không thay đổi dữ liệu người dùng, không chạy migration hay triển khai.

`npm run check` đạt: typecheck, unused gate, kiến trúc và **844 unit test / 158 file**. Kết quả này không thay thế kiểm thử các nhánh mới phát hiện. Đợt rà soát không chạy lại toàn bộ integration/E2E, không kiểm kê tài khoản cloud hoặc cấu hình hạ tầng ngoài repo.

## Nên sửa trước: độ tin cậy của luồng viết và gửi bài

### 1. Gửi duyệt cần nhận diện kết quả khi bị mất phản hồi

- **Bằng chứng:** `src/features/submissions/components/use-submission-editor.ts:218–227`; `src/features/submissions/server/draft-commands.ts:81`; cơ chế receipt hiện chỉ áp dụng cho lưu draft.
- **Tình huống:** server đã ghi nhận gửi duyệt, nhưng phản hồi bị mất. Client báo thất bại rồi mở lại editor; lần gửi/lưu tiếp dùng phiên bản cũ và bị xung đột.
- **Ảnh hưởng:** người viết không biết bài đã gửi thành công, có thể tiếp tục gõ trong một form không còn được lưu. Nội dung đã gửi vẫn còn; không kết luận bản đã gửi bị mất.
- **Đề xuất:** gửi duyệt có mutation ID riêng; khi kết quả chưa chắc chắn, đọc lại trạng thái trước khi cho viết tiếp hoặc cho thử lại cùng request.
- **Độ chắc chắn:** xác nhận từ luồng điều khiển; chưa mô phỏng mất phản hồi gửi duyệt trên trình duyệt trong đợt này.

### 2. Bản giữ tạm cũ có thể được chọn trước bản tương thích mới

- **Bằng chứng:** `src/features/submissions/components/draft-recovery.ts:69–71`; `src/features/submissions/components/draft-save-coordinator.ts:96`.
- **Tình huống:** server ở phiên bản 3; có một bản local tương thích phiên bản 3 và một pending request cũ có timestamp mới hơn nhưng receipt chỉ là phiên bản 1. Hàm chọn lấy bản pending cũ trước, không đưa ra bản còn lại; coordinator sau đó dừng vì receipt quá cũ.
- **Ảnh hưởng:** nội dung tương thích vẫn còn trên máy nhưng việc viết tiếp tự động bị chặn không cần thiết.
- **Kiểm chứng trực tiếp:** gọi hàm chọn với hai bản trên cho kết quả `resumedCompatible=false`, `resumedStale=true`, `visibleAlternatives=0`.
- **Đề xuất:** ưu tiên bản khớp phiên bản hiện tại; xử lý receipt cũ riêng, rồi tiếp tục chọn bản phù hợp. Chỉ hiện thông báo nếu thật sự cần người dùng quyết định.

## UI/UX: cải tiến có bằng chứng cụ thể

### 3. Danh sách thành viên thiếu tên hiển thị thường trực

- **Bằng chứng:** `src/features/members/components/home-member-wall.tsx:64–80`; component này được dùng tại `src/app/(shell)/(site)/members/page.tsx:30,44,60`.
- **Quan sát thực tế:** ở 390×844, chín thành viên hiện bằng chữ cái đại diện; ba thành viên cùng hiện chữ M. Tên cần hover/focus; chạm vào avatar lại đi tới hồ sơ.
- **Ảnh hưởng:** người dùng điện thoại khó chọn đúng người.
- **Đề xuất:** trên trang danh sách, thêm tên ngắn gọn dưới avatar; không cần đổi toàn bộ thành card lớn hoặc thay bố cục avatar của trang chủ.
- **Ảnh:** [Danh sách thành viên mobile](2026-11-05-system-review/members-mobile.png).

### 4. Mục lục trên mobile xuất hiện sau nội dung bài

- **Bằng chứng:** `src/app/(shell)/(site)/works/[slug]/page.tsx:166–223`; article đứng trước aside và chỉ chuyển thành hai cột ở breakpoint lg.
- **Quan sát thực tế:** trên bài mẫu ở 390×844, article kết thúc khoảng y=917; mục lục bắt đầu khoảng y=982.
- **Ảnh hưởng:** phải cuộn qua nội dung mới thấy công cụ để đi nhanh tới chính nội dung đó; các tài nguyên cũng xuất hiện khá muộn.
- **Đề xuất:** mục lục thu gọn đặt trước thân bài trên mobile; đưa các hành động quan trọng như PDF/mã nguồn gần tóm tắt nếu bài có tài nguyên đó. Giữ sidebar desktop.
- **Ảnh:** [Trang chi tiết mobile](2026-11-05-system-review/detail-mobile.png).

### 5. Trang chi tiết không giữ dấu hiệu đang thuộc mục nào

- **Bằng chứng:** `src/app/(shell)/_components/navbar-nav.tsx:216` chỉ so sánh đường dẫn tuyệt đối bằng nhau.
- **Quan sát thực tế:** một trang chi tiết nghiên cứu ở desktop không có link navbar nào mang `aria-current`; trang hồ sơ thành viên có cùng vấn đề theo source.
- **Đề xuất:** xác định section cha từ loại công trình hoặc ngữ cảnh route; làm nổi mục Nghiên cứu/Dự án/Thành viên phù hợp. Giữ phân biệt rõ giữa mục đang xem và hiệu ứng đang chuyển trang.

### 6. Tiêu đề tab trình duyệt còn tên trang cũ

- **Bằng chứng:** `src/app/layout.tsx:25`; trang thành viên và chi tiết chưa có metadata riêng.
- **Quan sát thực tế:** cả `/members` và bài mẫu đều có document.title là `Hoạt động | Robotics & IoT HCMUS`.
- **Ảnh hưởng:** khó phân biệt nhiều tab bài viết; bookmark/lịch sử không phản ánh tên trang hiện tại.
- **Đề xuất:** title riêng cho từng trang và theo tiêu đề công trình ở trang chi tiết; thống nhất với URL mới. Đây là thay đổi nhỏ có lợi ích rõ.

### 7. Thông báo thành công của thao tác thường dùng đang chặn luồng

- **Bằng chứng:** `src/shared/dialogs/dialog-provider.tsx:28–29` mở modal Thành công với nút Đã hiểu; `src/features/submissions/components/submission-editor.tsx:103` gọi nó sau Lưu bản nháp.
- **Ảnh hưởng:** lưu thủ công thêm một lần đóng hộp thoại, trong khi thanh hành động đã có trạng thái Đã lưu. Đây là cơ hội tinh gọn, không phải lỗi dữ liệu.
- **Đề xuất:** thao tác lưu thông thường dùng trạng thái tại chỗ hoặc thông báo ngắn không chặn; giữ xác nhận cho thao tác phá hủy và những quyết định nghiệp vụ thật sự cần xác nhận.

### 8. Tìm kiếm tiếng Việt chưa đồng nhất giữa các trang

- **Bằng chứng:** `src/features/publications/server/queries.ts:14–16` tìm với contains/insensitive; `src/features/submissions/server/queries.ts:35` và `src/shared/lib/search-text.ts:1` đã có cơ chế bỏ dấu cho danh sách cá nhân.
- **Ảnh hưởng dự kiến từ cách truy vấn:** cách gõ không dấu có thể tìm được ở Công trình của tôi nhưng không tìm được trên trang Nghiên cứu/Dự án. Ví dụ cần kiểm thử là `tu hanh` đối với `tự hành`.
- **Đề xuất:** thống nhất chuẩn tìm kiếm không phân biệt hoa thường và dấu ở các trường được hỗ trợ; giữ escape ký tự `%`/`_` và giới hạn độ dài. Chỉ thêm index phù hợp sau khi đo truy vấn/dữ liệu đủ lớn.
- **Độ chắc chắn:** xác nhận khác biệt implementation; chưa chạy phép so sánh tìm kiếm với dữ liệu thật trong đợt này.

## Tài khoản và lưu trữ

### 9. Thiếu luồng khôi phục tài khoản đã vô hiệu hóa

- **Bằng chứng:** `src/features/identity/server/member-commands.ts:134` soft-delete và thu hồi session; kiểm tra trùng tài khoản ở `:77–79` vẫn tính bản đã xóa; action hiện không có restore.
- **Tình huống:** quản trị viên vô hiệu hóa nhầm thành viên, sau đó không thể bật lại hoặc tạo lại cùng định danh từ giao diện.
- **Đề xuất:** hành động Khôi phục tài khoản dành cho admin, giữ chủ sở hữu và lịch sử; không phục hồi session cũ.
- **Độ chắc chắn:** thiếu luồng trong app, không khẳng định ngoài hệ thống không có công cụ vận hành.

### 10. Quên mật khẩu chưa có cách xử lý trong ứng dụng

- **Bằng chứng:** `src/features/identity/server/password-command.ts:29` cần mật khẩu hiện tại; `src/features/identity/components/login-form.tsx:174` chỉ hướng dẫn liên hệ để cấp tài khoản; admin actions chưa có reset.
- **Đề xuất:** admin cấp mật khẩu tạm dùng một lần, buộc đổi khi đăng nhập và thu hồi session; thêm chỉ dẫn ngắn ở màn đăng nhập. Không cần bổ sung đăng ký công khai hoặc dịch vụ email nếu mô hình CLB không cần.
- **Phân loại:** cơ hội hoàn thiện workflow, không phải khẳng định lỗ hổng bảo mật.

### 11. Tệp local không còn dùng vẫn chiếm quota

- **Bằng chứng:** `src/features/assets/server/orphans.ts:10` chỉ chọn ImageKit; `src/features/assets/server/upload-quota.ts:24,33` tính mọi asset chưa deleted vào quota. Thay/xóa avatar chỉ đổi tham chiếu.
- **Tình huống:** khi dùng ASSET_STORAGE=local, các file upload rồi bỏ dở hoặc avatar cũ không được thu hồi bằng luồng orphan hiện có; quota mặc định theo chủ sở hữu là 200 MiB.
- **Đề xuất:** dọn file local sau thời gian chờ, sử dụng đầy đủ kiểm kê tham chiếu/quarantine đã có; đồng thời cho admin thấy dung lượng đã dùng. Không xóa dựa riêng vào việc bài công khai không còn dùng file: draft, revision và gallery vẫn có thể tham chiếu.
- **Độ chắc chắn:** xác nhận logic quota/cleanup; chưa kiểm kê lượng file thừa thực tế trên máy hoặc production.

## Dữ liệu cũ: kiểm tra có điều kiện

### 12. Một trạng thái duyệt cũ có thể bị kẹt

- **Bằng chứng:** edit route chặn `reviewStatus=READY_FOR_APPROVAL` trên bài PUBLISHED, nhưng `src/features/submissions/model/workflow-state.ts:1` và `src/features/review/server/queries.ts:18` chỉ nhận published update có reviewStatus=PENDING_REVIEW.
- **Ảnh hưởng nếu có bản ghi như vậy:** người viết không được sửa/rút theo workflow; bài không hiện trong hàng chờ duyệt phù hợp.
- **Đề xuất:** kiểm kê chỉ đọc số bản ghi liên quan trước, rồi chuẩn hóa trạng thái hoặc hỗ trợ nhất quán các predicate.
- **Giới hạn:** chưa kiểm tra production có bản ghi bị ảnh hưởng; không đề xuất migration mù quáng.

## Thứ tự làm được đề xuất

1. Khép các tình huống gửi duyệt mất phản hồi và chọn nhầm bản viết tiếp (1–2), kèm regression test.
2. Các chỉnh sửa UX gọn: tên thành viên, mục lục mobile, active section và title trang (3–6). Không thiết kế lại toàn bộ website.
3. Tinh gọn thông báo và chuẩn tìm kiếm chung (7–8).
4. Khôi phục/reset tài khoản và quản lý dung lượng (9–11); kiểm kê trạng thái cũ (12) trước khi quyết định cần sửa dữ liệu hay không.


## Sau phê duyệt

Người dùng duyệt triển khai tất cả các đề xuất ngoại trừ finding 3. Xem [kết quả triển khai và kiểm chứng](2026-11-05-approved-improvements-results.md). Nội dung quan sát ở trên được giữ như bản ghi audit trước thay đổi.
