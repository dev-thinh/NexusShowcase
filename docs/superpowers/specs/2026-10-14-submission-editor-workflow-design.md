# Thiết kế luồng đăng và biên tập công trình

Ngày: 2026-10-14  
Trạng thái: Đã thống nhất định hướng, chờ duyệt đặc tả trước khi lập kế hoạch triển khai

## 1. Mục tiêu

Thiết kế lại luồng đăng công trình để mọi thành viên được cấp quyền đăng đều có thể gửi nội dung mà không cần hiểu taxonomy, layout hoặc nghiệp vụ quản trị website. Form phải đủ linh hoạt cho bài báo, dự án thuộc nhiều lĩnh vực và thành tích, nhưng chỉ yêu cầu lượng thông tin tối thiểu hợp lý.

Media và quản trị viên có một không gian biên tập riêng để chuẩn hóa ngôn từ, hình ảnh và metadata trước khi xuất bản. Nội dung thành viên gửi phải luôn được bảo toàn để đối chiếu.

## 2. Nguyên tắc bắt buộc

- Giao diện mang hình thức biểu mẫu học thuật hoặc tài liệu biên tập, không phải dashboard ghép từ nhiều card.
- Dùng một bề mặt trắng liên tục; phân cấp bằng tiêu đề, khoảng cách và đường kẻ mảnh.
- Không dùng panel lồng panel, nhiều nền màu, shadow hoặc bo góc lớn cho từng section.
- Chữ hướng dẫn có thể đầy đủ và giàu thông tin; không rút gọn theo phong cách sàn thương mại.
- Nhãn trường dùng sentence case, hạn chế uppercase và không dùng emoji.
- Thành viên cung cấp nội dung; admin chịu trách nhiệm taxonomy và cách xuất bản.
- Trường nâng cao là tùy chọn và không được cản trở dự án đơn giản.
- Bản gốc của thành viên không bị ghi đè bởi bản biên tập.

## 3. Vai trò và quyền hạn

### CORE_MEMBER

- Tạo và chỉnh sửa bản nháp của mình.
- Gửi xét duyệt.
- Cập nhật nội dung khi nhận yêu cầu bổ sung.
- Xem lịch sử phản hồi liên quan tới bài của mình.

### EDITOR

- Xem nội dung thành viên gửi.
- Biên tập tiêu đề, mô tả, nội dung chi tiết và tên hiển thị của tài nguyên.
- Chọn ảnh bìa, category, tags, loại nội dung, đơn vị và năm công bố.
- Sắp xếp tài nguyên cho bản xuất bản.
- Tạo và đóng yêu cầu bổ sung.
- Lưu và xem trước bản biên tập.
- Không được tự thay đổi quyền sở hữu, tác giả hoặc xuất bản bài.

### ADMIN

- Có toàn bộ quyền của EDITOR.
- Thêm, xóa và sắp xếp tác giả hoặc thay đổi vai trò tác giả.
- Thay đổi người sở hữu bài.
- Phê duyệt, từ chối, xuất bản, mở lại hoặc lưu trữ công trình.
- Quản lý thành viên và các quyền hệ thống khác như hiện tại.

`MEMBER` giữ quyền hiện tại và không được tự đăng nếu chưa được cấp quyền upload.

## 4. Luồng trạng thái

```text
DRAFT
  |
  v
PENDING_REVIEW
  |-- REVISION_REQUESTED --> thành viên cập nhật --> PENDING_REVIEW
  |-- REJECTED
  `-- PUBLISHED --> ARCHIVED
```

- `DRAFT`: đang soạn; chỉ tiêu đề là bắt buộc để lưu.
- `PENDING_REVIEW`: đã gửi; thành viên không tự thay đổi cho tới khi admin yêu cầu bổ sung hoặc mở lại.
- `REVISION_REQUESTED`: hiển thị là “Cần bổ sung”; bắt buộc có ít nhất một yêu cầu cụ thể. Thành viên được chỉnh sửa và gửi lại.
- `REJECTED`: hiển thị là “Không được phê duyệt”; bắt buộc có lý do. Thành viên chỉ xem, admin có thể mở lại thành `DRAFT`.
- `PUBLISHED`: bản xuất bản đang công khai theo visibility; thành viên không tự sửa trực tiếp.
- `ARCHIVED`: ngừng hiển thị công khai nhưng dữ liệu và lịch sử được giữ lại.

Việc editor đang biên tập hoặc checklist đã hoàn thành là trạng thái giao diện, không thêm vào enum nghiệp vụ.

## 5. Form dành cho thành viên

### Bố cục

Form là một luồng dọc trên bề mặt liên tục, chiều rộng đọc vừa phải. Ba phần được ngăn bằng đường kẻ mảnh:

1. Thông tin công trình.
2. Tác giả và người tham gia.
3. Tài liệu và nội dung bổ sung.

Thanh hành động mỏng bám cuối viewport trên desktop và nằm cuối luồng trên màn hình nhỏ. Thanh hiển thị trạng thái lưu cùng ba hành động: “Lưu bản nháp”, “Xem trước”, “Gửi xét duyệt”.

### Thông tin công trình

- Tiêu đề: bắt buộc để lưu bản nháp.
- Mô tả ngắn: bắt buộc khi gửi xét duyệt.
- Năm thực hiện: mặc định năm hiện tại, cho phép sửa.
- Gợi ý lĩnh vực: tùy chọn, dùng ngôn ngữ phổ thông như Robotics, IoT, Phần mềm, AI hoặc Khác.
- “Tôi không chắc, nhờ Ban quản trị phân loại” là lựa chọn mặc định hợp lệ.

Gợi ý lĩnh vực không tạo category và không quyết định layout công khai.

### Tác giả và người tham gia

- Người đăng được thêm mặc định.
- Có thể tìm và thêm thành viên CLB hoặc nhập người ngoài CLB.
- Vai trò và thứ tự tác giả là tùy chọn đối với dự án thông thường.
- Các thuật ngữ học thuật nâng cao chỉ xuất hiện khi người dùng chủ động chọn vai trò chi tiết.

### Tài liệu và nội dung bổ sung

Không hiển thị sẵn nhiều hàng input trống. Nút “Thêm tài nguyên” cho phép thêm một trong các loại:

- Hình ảnh.
- PDF.
- GitHub.
- Video.
- Website hoặc demo.
- Google Drive.
- Liên kết khác.

Mỗi tài nguyên là một hàng compact gồm loại, tên hiển thị, URL hoặc file, trạng thái upload và thao tác xóa. Nội dung chi tiết, công nghệ sử dụng, đơn vị tổ chức và thông tin chuyên môn khác nằm trong một disclosure đơn giản “Thêm thông tin chi tiết”.

### Validation

- Lưu nháp chỉ yêu cầu tiêu đề.
- Gửi xét duyệt yêu cầu tiêu đề, mô tả ngắn và ít nhất một người tham gia.
- Validation hiển thị cạnh trường, focus vào lỗi đầu tiên và tóm tắt các section có lỗi.
- Upload, URL và giới hạn độ dài phải dùng cùng quy tắc ở client và server.
- Khi rời trang với thay đổi chưa lưu, giao diện phải cảnh báo.

## 6. Form dành cho editor/admin

### Bố cục

Màn hình là một tài liệu biên tập hai cột trên cùng bề mặt:

- Cột trái khoảng 40%: snapshot thành viên gửi, chỉ đọc.
- Một đường dọc mảnh phân cách.
- Cột phải khoảng 60%: bản chuẩn bị xuất bản, có thể chỉnh sửa.

Không bọc từng trường hoặc section trong card. Trên mobile, hai cột chuyển thành hai tab “Bản thành viên” và “Bản xuất bản”.

### Bản thành viên

Hiển thị tiêu đề, mô tả, nội dung chi tiết, tác giả, tài nguyên, gợi ý lĩnh vực và thời điểm gửi. Có thể chuyển giữa các lần gửi để đối chiếu nhưng không sửa snapshot.

### Bản xuất bản

Cho phép biên tập:

- Tiêu đề, mô tả và nội dung chi tiết.
- Ảnh bìa.
- Loại nội dung, category và tags.
- Đơn vị và năm công bố.
- Tên, loại và thứ tự liên kết.

Trường chưa được biên tập dùng giá trị từ bản thành viên. Trường đã thay đổi có nhãn “Đã biên tập” và thao tác khôi phục về bản gửi gần nhất.

Admin có thêm quyền chỉnh tác giả, thứ tự, vai trò, người sở hữu và tài liệu gốc. Những thay đổi này phải được ghi lịch sử.

### Kiểm duyệt

Checklist compact nằm cùng luồng tài liệu hoặc trong một rail sticky, không dùng card nhiều màu:

- Nội dung đã rõ ràng.
- Đã gán category.
- Tác giả hợp lệ.
- Tài nguyên truy cập được.
- Không còn dữ liệu cần xác minh.
- Ảnh đại diện đã phù hợp hoặc chấp nhận ảnh mặc định.

Các hành động cuối trang:

- Lưu bản biên tập.
- Xem trước.
- Yêu cầu bổ sung.
- Không phê duyệt.
- Phê duyệt và xuất bản.

Xuất bản chỉ khả dụng khi các điều kiện bắt buộc đã đạt. Hành động từ chối và xuất bản cần xác nhận rõ ràng.

## 7. Phản hồi theo trường

Mỗi yêu cầu bổ sung gồm:

- Khóa trường hoặc section liên quan.
- Nội dung phản hồi.
- Mức độ bắt buộc hoặc đề xuất.
- Người tạo và thời gian tạo.
- Trạng thái đang mở hoặc đã xử lý.

Thành viên nhìn thấy phản hồi ngay cạnh nội dung liên quan. Khi gửi lại, hệ thống đánh dấu các trường đã thay đổi kể từ snapshot trước. Bản biên tập của media không bị tự động ghi đè; editor được chọn giữ nội dung đã biên tập hoặc nhận nội dung mới.

## 8. Mô hình dữ liệu khái niệm

### ShowcaseItem

Giữ dữ liệu bản nháp hiện hành, quyền sở hữu, trạng thái và dữ liệu công khai đã được chọn để render.

### SubmissionRevision

Snapshot bất biến được tạo mỗi lần thành viên gửi hoặc gửi lại, gồm toàn bộ nội dung, tác giả và tài nguyên tại thời điểm gửi.

### EditorialDraft

Bản ghi một-một với công trình, chứa các override của bản xuất bản. Chỉ lưu trường đã được biên tập; trường không có override dùng dữ liệu từ snapshot mới nhất.

Khi admin xuất bản, hệ thống tính bản hiệu lực từ snapshot mới nhất cộng các override, rồi ghi kết quả vào `ShowcaseItem` trong cùng transaction với việc chuyển trạng thái sang `PUBLISHED`. Vì vậy các trang công khai tiếp tục đọc dữ liệu chuẩn hóa từ `ShowcaseItem`, còn snapshot và editorial draft vẫn được giữ để đối chiếu và biên tập về sau.

### ReviewComment

Lưu phản hồi theo trường hoặc section, mức độ, người tạo và trạng thái xử lý.

### AuditEvent

Lưu các sự kiện quan trọng: gửi duyệt, yêu cầu bổ sung, gửi lại, chỉnh dữ liệu nhạy cảm, từ chối, xuất bản, mở lại và lưu trữ. Không ghi log theo từng lần gõ phím.

### Taxonomy

- `ItemType` chỉ giữ nhóm nội dung cấp cao: bài báo, dự án và thành tích.
- Category do editor/admin gán trước khi xuất bản.
- Gợi ý lĩnh vực của thành viên là dữ liệu tham khảo, không tự tạo category.
- Tags do editor/admin chuẩn hóa; có thể bắt đầu từ gợi ý của thành viên.
- Không tạo enum cho mọi thể loại dự án.

## 9. Trường hợp “Khác”

Khi thành viên chọn “Khác”:

- Hiện trường “Loại dự án của bạn”, tối đa 100 ký tự.
- Cho chọn các loại tài nguyên liên quan, không mở toàn bộ form nâng cao.
- Lưu dưới dạng dự án tổng quát cùng nhãn tự do.
- Admin có thể gán category hiện có hoặc giữ nhãn làm thông tin mô tả.
- Không tự động tạo category mới từ nội dung tự do.

## 10. Accessibility và responsive

- Mọi label liên kết với control bằng `htmlFor` và `id`.
- Toggle công bố trạng thái bằng `aria-pressed`; tab dùng semantics phù hợp.
- Nút icon có accessible name và vùng bấm tối thiểu 40–44px.
- Upload hỗ trợ click, bàn phím và trạng thái tiến trình; không dùng `div` click-only.
- Lỗi dùng `aria-describedby`, focus lỗi đầu tiên và có summary.
- Màu không phải tín hiệu trạng thái duy nhất.
- Hai cột admin chuyển thành tab trên mobile; thanh action không che nội dung hoặc focus.

## 11. Tách component

`ItemForm` hiện tại không tiếp tục là một component đơn hơn 1.200 dòng. Tách theo trách nhiệm:

- SubmissionEditorShell.
- BasicInformationFields.
- ContributorEditor.
- ResourceEditor.
- OptionalDetails.
- SubmissionActionBar.
- ReviewWorkspace.
- SourceRevisionView.
- EditorialFields.
- ReviewChecklist.
- FieldReviewComments.

State và validation dùng một nguồn dữ liệu thống nhất; component con không tự gọi server action riêng, ngoại trừ upload có boundary rõ ràng.

## 12. Kiểm thử và tiêu chí hoàn thành

- Bản nháp lưu được chỉ với tiêu đề.
- Không thể gửi duyệt nếu thiếu tiêu đề, mô tả hoặc người tham gia.
- Category không bắt buộc với thành viên nhưng bắt buộc trước khi xuất bản.
- Snapshot không thay đổi sau khi admin biên tập.
- Editorial override fallback đúng về snapshot gần nhất.
- `REVISION_REQUESTED` cho phép gửi lại; `REJECTED` không cho phép gửi lại nếu chưa mở lại.
- EDITOR không thể xuất bản hoặc sửa quyền sở hữu/tác giả.
- ADMIN có thể xuất bản khi checklist và validation hợp lệ.
- Phản hồi hiển thị đúng cạnh trường và có thể được đánh dấu đã xử lý.
- Keyboard navigation, focus error, mobile tabs và sticky action bar hoạt động đúng.
- Các route hiện tại tiếp tục hoạt động; dữ liệu cũ được migrate với fallback an toàn.

## 13. Ngoài phạm vi

- Không xây taxonomy động do AI tự tạo.
- Không tạo một form template riêng cho mọi loại dự án.
- Không thay đổi nội dung bài đã xuất bản mà không có audit event.
- Không triển khai collaborative editing thời gian thực.
- Không thay đổi URL công khai hiện tại ngoài cơ chế slug đã có.
