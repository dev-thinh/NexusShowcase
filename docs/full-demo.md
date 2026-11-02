# Bản demo đầy đủ

Mở **http://127.0.0.1:3002**. Đây là bản demo riêng, khác ứng dụng hiện tại ở cổng 3000. Không dùng mật khẩu bên dưới để đăng nhập bản 3000.

## Đăng nhập để xem

Mật khẩu chung cho tài khoản demo mới: **`NexusDemo2026!Start`**.

| Tài khoản demo | Tình huống nên xem |
| --- | --- |
| `admin@gmail.com` | Quản trị, danh sách thành viên, hàng chờ và duyệt bài, công khai/nội bộ, ghim bài |
| `core@gmail.com` | Dashboard có đủ trạng thái, soạn thảo/gửi duyệt, các bản cập nhật của bài đã xuất bản |
| `member1@gmail.com` | Thành viên thường: hồ sơ cá nhân và xem bài nội bộ |
| `member3@gmail.com` | Bắt đổi mật khẩu lần đầu; có thể chỉ mở xem rồi đóng phiên nếu muốn giữ tình huống này |
| `guest1@gmail.com` | Vai trò GUEST đang hoạt động |
| `member36@gmail.com` | PENDING: không được đăng nhập |
| `member37@gmail.com` | SUSPENDED: không được đăng nhập |
| `member40@gmail.com` | Đã xóa mềm: không được đăng nhập và không xuất hiện trong danh bạ công khai |
| `editor1@gmail.com` | Vai trò EDITOR cũ; không phải quyền duyệt bài hiện tại (chỉ ADMIN duyệt) |

Mỗi lần chạy `npm run demo`, hệ thống tạo lại Prisma Client và áp dụng migration còn thiếu vào database demo trước khi build. Bước này giữ nguyên dữ liệu hiện có và không chạy lại seed.

## Dữ liệu

- **60 tài khoản:** 2 ADMIN, 10 CORE_MEMBER, 40 MEMBER, 4 EDITOR, 4 GUEST. Có avatar và không avatar, giới thiệu ngắn/dài/trống, link hồ sơ, tài khoản chờ kích hoạt/bị khóa/xóa mềm.
- **56 bài**, gồm cả PROJECT và RESEARCH_PAPER: 32 PUBLISHED; mỗi trạng thái DRAFT, PENDING_REVIEW, REVISION_REQUESTED, READY_FOR_APPROVAL, REJECTED, ARCHIVED có 4 bài.
- Trong 32 bài đã xuất bản có bản cập nhật ở các trạng thái DRAFT, PENDING_REVIEW, REVISION_REQUESTED và REJECTED. Nội dung đang công bố giữ nguyên trong khi bản cập nhật có tiêu đề/nội dung khác để so sánh.
- Bài công khai và nội bộ, tối đa 3 bài ghim, ảnh có nhiều tỷ lệ và một số bài không thumbnail, nhiều tác giả và người hướng dẫn, PDF thật có thể mở, file nguồn mẫu có thể tải.
- Section nội dung có văn bản, hình minh họa, kết quả và liên kết; có snapshot nộp bài, phản hồi yêu cầu sửa và phản hồi đã xử lý, audit và bản biên tập cũ.
- **12 ảnh khoảnh khắc và 3 vị trí hướng nghiên cứu**; ảnh/avatar là hình minh họa kỹ thuật được tạo tại máy, có nhãn DEMO và không gọi ImageKit.
- READY_FOR_APPROVAL/EDITOR là tình huống tương thích dữ liệu cũ; luồng hiện tại dùng tác giả → admin. Loại ACHIEVEMENT cũ không được tạo vì hai danh mục hiện tại chỉ dùng PROJECT/RESEARCH_PAPER.

## Các trang nên mở

1. Không đăng nhập: `/`, `/members`, `/category/bai-bao-khoa-hoc`, `/category/robotics-iot`; thử phân trang, thumbnail, avatar và phóng to ảnh khoảnh khắc.
2. Admin: `/admin/members`, `/admin/reviews`, `/admin/content`; mở một bài để xem snapshot và các nút duyệt. Thao tác ở đây chỉ thay đổi demo.
3. Core: `/dashboard`; đổi các bộ lọc trạng thái. Core sở hữu đủ bảy trạng thái và đủ các bản cập nhật bài live. Bài lưu trữ/dữ liệu cũ có thể nằm trong danh sách tất cả; giao diện không nhất thiết có bộ lọc riêng cho mọi giá trị enum.
4. Bài mẫu đã xuất bản: `/showcase/demo-full-project-published-1` hoặc `/showcase/demo-full-research_paper-published-1`.
5. Đăng nhập member thường để so sánh quyền; đăng xuất rồi thử mở bài nội bộ để thấy yêu cầu đăng nhập.

Một số media được dùng lại ở nhiều bài/gallery công khai; tính riêng tư của một bài không làm file đã được công bố ở chỗ khác trở thành bí mật. Đây là dữ liệu giả, không phải thông tin/công trình/thành tích của người thật.

## Chạy lại sau này

```bash
npm run demo:prepare
npm run demo
```

`demo:prepare` cần `.env.database.local` đã cấu hình quyền quản trị PostgreSQL local, tạo database `nexus_showcase_demo` và runtime role riêng. `.env.demo.local` được tạo tự động, quyền 0600 và bị Git bỏ qua. Các guard chặn target ngoài local, DB không đúng tên, production process hoặc storage cloud.

`demo` build production vào `.next-demo`, chỉ mở `127.0.0.1:3002`, dùng secret và cookie riêng để không ghi đè đăng nhập ứng dụng chính kể cả cùng hostname. Nếu cổng đã có demo chạy, dùng phiên đó; không khởi động bản thứ hai cùng cổng.

Seed là **create-only**: chạy lại không tạo trùng, không đặt lại mật khẩu, nội dung hay các quan hệ đã chỉnh. Nếu bạn đã đổi mật khẩu một tài khoản demo, mật khẩu mới vẫn giữ nguyên; mật khẩu chung ở trên chỉ áp dụng cho tài khoản chưa đổi. Không xóa/reset DB hoặc sửa `.env` của ứng dụng hiện tại để chạy demo.

Kiểm tra thực hiện: unit/architecture/type checks; 103 integration tests gồm coverage và idempotency của dataset; production demo build; browser smoke cho guest, core, admin, ảnh/tài liệu, nội bộ, bắt đổi mật khẩu và tách cookie. DB và asset demo không được dùng để tuyên bố một deployment công khai đã được bảo mật.
