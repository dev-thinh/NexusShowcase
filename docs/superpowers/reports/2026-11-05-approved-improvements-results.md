# Kết quả triển khai các cải tiến được duyệt — 2026-11-05

Triển khai trực tiếp trên dev theo phê duyệt của người dùng. Finding 3 về hiển thị tên dưới avatar bị loại khỏi phạm vi: không thay markup/layout danh sách thành viên hoặc member wall; trang thành viên chỉ được bổ sung metadata.

## Đã triển khai

| Finding | Kết quả |
| --- | --- |
| 1 | Gửi duyệt có receipt giao dịch và mutation ID ổn định. Giữ request chưa xác nhận qua reload; khóa viết trong thời gian chưa rõ kết quả, cho thử lại cùng request mà không tạo hai revision/audit event. Auth/permission/conflict của một lần retry không được coi là bằng chứng lần trước thất bại. Chỉ mở lại sau validation rejection kèm owner-authorized read xác nhận cùng phiên bản và trạng thái còn sửa được. |
| 2 | Ưu tiên bản local khớp phiên bản server trước pending request cũ hơn; không chọn một receipt cũ chỉ vì timestamp mới hơn. |
| 4 | Mục lục thu gọn và tài nguyên quan trọng nằm trước thân bài trên mobile; sidebar desktop được giữ. |
| 5 | Trang chi tiết nhận section cha từ marker được render sau kiểm tra quyền; hồ sơ thành viên giữ section Thành viên. Pending navigation vẫn phân biệt với route đã commit. |
| 6 | Root title template và title riêng từng trang, tên bài/hồ sơ động chỉ được lấy theo đúng quyền đọc. |
| 7 | Thông báo thành công thông thường không chặn thao tác; giữ xác nhận cho thao tác cần quyết định. Lưu draft chỉ dùng trạng thái tại chỗ. Đổi mật khẩu hiển thị xác nhận sau khi đã chuyển sang đăng nhập. |
| 8 | Chuẩn tìm kiếm không phân biệt dấu/hoa thường, có giới hạn và escape wildcard, áp dụng public publications và review queue, giữ chuẩn sẵn có ở danh sách cá nhân/admin members. Count/query/pagination và visibility được kiểm thử. |
| 9 | Bộ lọc tài khoản đã vô hiệu hóa và thao tác khôi phục cho admin; giữ ID/lịch sử, tăng sessionVersion. |
| 10 | Reset mật khẩu cho admin bằng mật khẩu tạm ngẫu nhiên; one-use login CAS, buộc đổi, thu hồi phiên cũ, chống replay bằng observed version và chặn self-reset. Mật khẩu tạm chỉ được trả cho admin đang thực hiện, có reveal/copy trong modal, không đưa vào public DTO/log. |
| 11 | Hỗ trợ dọn local orphan trong công cụ hiện có, giữ grace/quarantine/full-reference recheck và kiểm tra file identity. Admin overview có dung lượng/giữ chỗ. Chưa xóa tệp runtime nào. |
| 12 | Hỗ trợ legacy READY_FOR_APPROVAL nhất quán ở policy, queue/count/filter, withdrawal và recent admin activity; không rewrite dữ liệu production. |

## Kiểm chứng

- `npm run check`: typecheck, unused gate, architecture và **874 unit tests / 167 files** qua.
- `npm run test:integration`: **122 tests / 35 files** qua, gồm replay submission, legacy review/withdraw, account restore/reset/concurrent temporary login và SQL search thật.
- `npm run db:verify-upgrade`: fresh và legacy schema verification qua; không lệch schema, giữ fixture invariants.
- Production browser harness build qua. Lượt rộng có 12/13 scenario qua; scenario account recovery dùng permanent-password test fixture ngẫu nhiên đôi khi thiếu ký tự bắt buộc. Đã sửa fixture bảo đảm chính sách mật khẩu, không nới validation.
- Lượt trình duyệt cuối **5/5 qua**: account restore/reset/forced change; metadata/nav/mobile TOC; lost committed submit response; uncertain submit reload; expired session after lost submit response. Các scenario auth lifecycle, autosave, conference và direct approval khác đã qua ở lượt rộng.
- Independent review hoàn tất. Hai phát hiện được xử lý: không mở editor chỉ dựa trên failed authorization của retry, và đồng nhất recent activity cho trạng thái review cũ.
- `git diff --check` qua.

## Vận hành

Migration `20261105_temporary_password_consumption` đã áp dụng cho database dev local đã xác minh và template test riêng. Khi triển khai môi trường khác phải áp dụng migration trước khi chạy code mới. Không push/deploy trong tác vụ này.

Dọn tệp vẫn là thao tác bảo trì rõ ràng, không tự xóa sau khi xem dung lượng. Local apply cần Linux `/proc/self/fd`, từ chối symlink/hardlink/non-file, đường dẫn không hợp lệ, inventory thiếu hoặc file đổi identity. Tệp chưa đăng ký và claim bị gián đoạn cần được kiểm kê/xử lý, không suy diễn quyền xóa.
