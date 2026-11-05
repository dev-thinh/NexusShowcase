# Tự lưu bản nháp công trình

## Mục tiêu và phạm vi đã thống nhất

Người viết không phải chủ động lưu để giữ nội dung. Áp dụng cho tạo bài mới, sửa bản nháp và sửa bài đã xuất bản. Bài công khai vẫn chỉ được cập nhật sau khi duyệt. Chỉ giữ một nút Xem trước với biểu tượng con mắt ở thanh hành động cuối form; bỏ nút ở đầu form. Khi đang xem trước, nút cuối form chuyển thành Soạn thảo.

## Cách tiếp cận

Đã cân nhắc chỉ tự lưu lên server và kết hợp tự lưu server với bản khôi phục tại trình duyệt. Người dùng đồng ý hướng kết hợp: server giữ bản nháp dùng được giữa các thiết bị, trình duyệt giữ phần chưa đồng bộ khi mất kết nối hoặc rời trang. Chỉ cảnh báo trước khi thoát không đáp ứng mục tiêu giữ dữ liệu.

## Tạo bản nháp

Thao tác Đăng công trình mới tạo một bản nháp qua mutation có xác thực rồi chuyển sang /dashboard/items/[id]/edit. Không tạo dữ liệu trong quá trình render GET vì prefetch, reload và render lại có thể tạo bài ngoài ý muốn. Mỗi lần tạo có khóa idempotency ổn định qua retry; bấm đúp không tạo hai bài. Khi chưa có mạng, báo chưa tạo được và cho phép thử lại, không giả báo thành công.

Draft cho phép tiêu đề trống; danh sách hiển thị nhãn Công trình chưa có tiêu đề. Không điền nhãn này vào nội dung thật. Giữ xác thực bắt buộc tiêu đề, tóm tắt và người đóng góp ở bước Gửi duyệt. Draft chấp nhận dữ liệu đang nhập dở trong giới hạn dung lượng và cấu trúc an toàn; việc lưu không được âm thầm cắt hoặc chuẩn hóa làm mất nội dung. Không nới quyền tham chiếu tệp hoặc quyền chỉnh sửa.

## Lưu và khôi phục

Đề xuất kỹ thuật: tự lưu sau 1,5 giây ngừng nhập, có mốc lưu tối đa khoảng 10 giây nếu người dùng gõ liên tục. Chỉ một yêu cầu lưu được thực hiện tại một thời điểm. Khi có chỉnh sửa trong lúc lưu, xếp bản mới nhất cho lần lưu tiếp theo và dùng reviewVersion server vừa trả về. Lỗi mạng giữ dirty state và thử lại có giãn cách; kết nối lại kích hoạt thử đồng bộ.

Ghi bản khôi phục trên trình duyệt theo tài khoản và ID bài, kèm phiên bản server mà dữ liệu dựa trên và thời điểm cập nhật. Lỗi quota hoặc trình duyệt chặn lưu phải được báo đúng, không hiển thị Đã lưu trên thiết bị. Chỉ xóa bản khôi phục khi server xác nhận đúng nội dung đã lưu; phản hồi của một lần lưu cũ không được xóa chỉnh sửa mới hơn.

Khi mở lại, nếu dữ liệu cục bộ chưa đồng bộ thì cho phép khôi phục hoặc bỏ bản cục bộ. Nếu server đã thay đổi phiên bản, dừng tự đồng bộ và cho người dùng xử lý xung đột; không tự ghi đè và không yêu cầu tải lại trước khi bảo toàn nội dung. Hai tab dùng cùng cơ chế kiểm tra phiên bản; mỗi tab giữ được phần đang viết của mình. Bài không còn được sửa do đang chờ duyệt cũng phải giữ phần cục bộ và thông báo rõ.

Rời trang không phụ thuộc vào request mạng phút cuối. beforeunload chỉ là lớp cảnh báo bổ sung khi dữ liệu chưa được bảo toàn. File đang tải dở không thể được khôi phục chỉ bằng JSON; không báo đã lưu tệp trước khi tải lên hoàn tất.

## Trạng thái và thao tác

Form vẫn nhập được trong lúc autosave; chỉ chặn thao tác cần đồng bộ khi gửi duyệt hoặc khi thao tác tệp thực sự yêu cầu. Trạng thái gồm Chưa đồng bộ, Đang lưu…, Đã lưu, Ngoại tuyến · Đã lưu trên thiết bị và lỗi lưu/khôi phục khi có. Không bật popup hay tự cuộn/focus lỗi sau mỗi lần autosave.

Giữ nút Lưu bản nháp để lưu ngay hoặc thử lại thủ công. Gửi duyệt chờ lưu bản mới nhất thành công, xác thực dữ liệu đầy đủ và dùng đúng reviewVersion; không gửi một snapshot cũ nếu người dùng vừa chỉnh sửa. Khi gửi thành công, dừng autosave và dọn đúng bản khôi phục đã gửi.

## Các phần cần đổi trong repo

- Luồng tạo bài mới và các liên kết Đăng công trình mới: mutation tạo draft có idempotency và URL ổn định.
- Schema input, draft commands và persistence: lưu dữ liệu dang dở an toàn, không ảnh hưởng nội dung công khai hoặc snapshot gửi duyệt.
- use-submission-editor: hàng đợi lưu, retry, bảo toàn nội dung mới khi request đang chạy, phối hợp gửi duyệt.
- SubmissionEditor và SubmissionActionBar: không khóa form khi tự lưu; chỉ một nút preview có icon ở cuối; trạng thái lưu không gây gián đoạn.
- Lưu cục bộ và khôi phục: tách theo tài khoản/bài, xử lý hai tab và phiên bản server.
- Tránh invalidation diện rộng không cần thiết ở mỗi nhịp autosave; vẫn cập nhật danh sách bản nháp và luồng duyệt đúng thời điểm.

## Kiểm chứng

Kiểm tra tạo trùng do bấm đúp/retry; draft trống và dữ liệu đang nhập dở; gõ trong khi request cũ chưa xong; lỗi mạng rồi reconnect; reload và chuyển trang; hai tab cùng sửa; lỗi lưu trình duyệt; submit trong khi autosave; bài đã xuất bản không đổi bản công khai. Kiểm tra UI chỉ còn một nút xem trước có icon ở cuối và form không mất focus/khóa khi tự lưu. Chạy kiểm tra kiểu, kiến trúc, unit và integration/browser phù hợp với thay đổi.

## Ngoài phạm vi

Không làm cộng tác thời gian thực hoặc tự hợp nhất mọi xung đột. Không hứa bảo toàn file chưa upload, dữ liệu trình duyệt đã bị xóa, hoặc đồng bộ giữa thiết bị khi chưa có kết nối. Không tự động xóa draft có nội dung.

## Quyết định bổ sung sau rà soát kỹ thuật

- Khóa khôi phục có thêm ID phiên soạn thảo/tab để hai tab không ghi đè dữ liệu cục bộ của nhau; giao diện khôi phục liệt kê các phiên còn dữ liệu chưa đồng bộ.
- Snapshot JSON của draft là nguồn nạp lại editor, giữ nguyên dữ liệu đang nhập. Không chỉ nới validation rồi tái dựng từ contributor/resource relations vì có thể làm mất phần dang dở. Chỉ tạo projection/relations hợp lệ theo nhu cầu workflow, tiếp tục kiểm tra quyền tệp. Cần tương thích dữ liệu draft cũ khi chuyển đổi.
- Mỗi lần lưu có mutation ID ổn định qua retry. Server nhận diện request đã commit nhưng mất phản hồi và trả lại kết quả tương ứng, tránh xung đột giả do chính lần lưu trước. Không dùng một ID cho hai payload khác nhau.
- Có lối truy cập để xem/sao chép bản khôi phục khi bài đã chuyển sang chờ duyệt hoặc không còn được chỉnh sửa; không để redirect của trang edit khiến dữ liệu cục bộ trở nên không thể truy cập.


## Điều chỉnh UX theo yêu cầu ngày 2026-11-05

Người viết không cần biết cơ chế lưu trên máy và lưu lên server. Khi mở lại bài sau gián đoạn, tự tiếp tục từ nội dung đang viết nếu phiên bản tương thích; không hiện bảng Khôi phục / Tải bản sao / Bỏ bản khôi phục trong luồng bình thường. Bỏ các bản giữ tạm đã giống nội dung lưu trên server. Trạng thái thường chỉ là Đang lưu... và Đã lưu; chỉ báo Đã lưu khi có xác nhận lưu thành công. Nếu có xung đột thực sự giữa hai tab, giữ nguyên nội dung, hiện thông báo ngắn và để phần đối chiếu/sao chép trong mục chi tiết thu gọn. Không tự ghi đè một bản mới hơn.
