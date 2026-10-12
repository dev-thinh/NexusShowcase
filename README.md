# NexusShowcase - Academic Club Portfolio

Hệ thống trưng bày bài báo khoa học, đề tài nghiên cứu, dự án công nghệ và quản lý thành viên câu lạc bộ học thuật.

## 1. Công nghệ chính

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
- **UI & Styling**: React 19, Tailwind CSS, Lucide Icons
- **Cơ sở dữ liệu**: PostgreSQL, [Prisma ORM 6](https://www.prisma.io/)
- **Xác thực**: [NextAuth v5](https://authjs.dev/) (`@auth/core` 0.41.3+ / `next-auth@5.0.0-beta.32`)
- **Kiểm thử**: Vitest 2

---

## 2. Hướng dẫn cài đặt cục bộ (Local Setup)

### 2.1. Yêu cầu môi trường
- Node.js >= 20.x
- PostgreSQL cục bộ (mặc định cổng `5434` hoặc tùy chỉnh qua env)

### 2.2. Thiết lập cấu hình môi trường
Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

Cấu hình các biến trong `.env`:
```env
# Database kết nối cục bộ
DATABASE_URL="postgresql://nexus:nexus_secret_2026@localhost:5434/nexus_showcase?schema=public"

# NextAuth Secret (tối thiểu 32 ký tự ngẫu nhiên)
AUTH_SECRET="nexus-showcase-super-secret-key-32-chars-length"
NEXTAUTH_URL="http://localhost:3000"

# Tài khoản quản trị khởi tạo (Bootstrap Admin)
BOOTSTRAP_ADMIN_EMAIL="admin01"
BOOTSTRAP_ADMIN_PASSWORD="your_secure_local_admin_password"

# Cờ đặt lại dữ liệu (mặc định false; chỉ đặt true khi muốn xóa và tạo lại toàn bộ từ đầu)
RESET_DATABASE="false"

# Database dành riêng cho kiểm thử tự động (bắt buộc khác DATABASE_URL và phải chứa "test")
TEST_DATABASE_URL="postgresql://nexus:nexus_secret_2026@localhost:5434/nexus_showcase_test?schema=public"
```

> **Lưu ý bảo mật**: File `.env` đã được cấu hình trong `.gitignore` để tránh rò rỉ credential vào kho mã nguồn.

### 2.3. Khởi tạo cơ sở dữ liệu và dữ liệu ban đầu
```bash
# Đẩy schema lên database
npm run db:push

# Nạp dữ liệu khởi tạo (idempotent, không phá hủy dữ liệu hiện có nếu RESET_DATABASE="false")
npm run db:seed
```

### 2.4. Khởi chạy ứng dụng
```bash
npm run dev
```
Truy cập ứng dụng tại `http://localhost:3000`.

---

## 3. Kiến trúc bảo mật cục bộ (Local Security Hardening)

Hệ thống được thiết kế theo các nguyên tắc bảo mật:

1. **Ủy quyền dựa trên phiên làm việc (Session-derived authorization)**:
   - Tất cả Server Actions xác thực người dùng thông qua hàm `auth()` trên server.
   - Mã định danh người thực hiện (`currentUserId`, `creatorId`) hoàn toàn do server kiểm soát, không nhận từ client để ngăn ngừa giả mạo danh tính (ID spoofing).
2. **Biên giới DTO công khai (Public Data Boundary)**:
   - Các truy vấn hiển thị công khai sử dụng `select` giới hạn (`publicUserSelect`), tuyệt đối không gửi `passwordHash`, email, mã sinh viên hay `sessionVersion` ra ngoài client.
3. **Xác thực đầu vào tại Runtime (Zod Runtime Validation)**:
   - Toàn bộ tham số Server Action được kiểm tra bằng Zod schema: kiểm tra định dạng CUID, giới hạn độ dài chuỗi, khoảng năm hợp lệ, và giao thức URL an toàn (`http:`/`https:`).
4. **Quy trình tải tệp an toàn (Safe Local Uploads)**:
   - Kiểm tra magic byte signatures trực tiếp từ nội dung nhị phân (hỗ trợ JPEG, PNG, WebP, PDF).
   - Phần mở rộng file được xác định từ chữ ký nhị phân thực tế thay vì tin tưởng tên file client gửi lên.
   - Mã hóa tên file ngẫu nhiên và che giấu đường dẫn hệ thống nội bộ khi xảy ra lỗi I/O.
5. **Vòng đời tài khoản & Phiên làm việc (Account Lifecycle)**:
   - Khi Admin tạo thành viên mới, hệ thống tự sinh mật khẩu tạm thời ngẫu nhiên và hiển thị 1 lần cho Admin.
   - Thành viên mới có cờ `mustChangePassword=true` và bị buộc phải đổi mật khẩu khi đăng nhập trước khi sử dụng các chức năng.
   - Khi xóa thành viên, hệ thống thực hiện **Soft Delete** (`status: 'SUSPENDED'`, lưu `deletedAt`), bảo toàn công trình nghiên cứu và đóng góp học thuật của tác giả.
   - JWT callback kiểm tra trạng thái tài khoản và `sessionVersion` từ database; phiên làm việc lập tức bị vô hiệu hóa khi người dùng bị khóa hoặc đổi quyền/mật khẩu.
6. **Quy trình sửa và nộp lại bài bị từ chối (Rejected-item Resubmit Workflow)**:
   - Tác giả được phép chỉnh sửa bài viết ở trạng thái `DRAFT` hoặc `REJECTED` và gửi lại hội đồng xét duyệt (`PENDING_REVIEW`).
   - Tác giả thông thường không được phép chỉnh sửa bài đã xuất bản (`PUBLISHED`) trừ khi có quyền Quản trị viên (`ADMIN`).
7. **Bảo vệ cơ sở dữ liệu kiểm thử (Test Database Guard)**:
   - Kiểm tra `TEST_DATABASE_URL` bắt buộc phải được khai báo, không trùng với `DATABASE_URL`, và phải chứa chuỗi `"test"`. Ngăn chặn hoàn toàn việc test tự động xóa nhầm dữ liệu đang phát triển.
8. **Tiêu đề bảo mật trình duyệt (Browser Security Headers)**:
   - Cấu hình Content Security Policy (CSP), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, và `Permissions-Policy`. Cho phép nhúng video học thuật an toàn từ YouTube, Loom, Google Drive và Google Fonts.

---

## 4. Lệnh kiểm thử (Testing Scripts)

```bash
# Chạy toàn bộ Unit tests độc lập (không cần kết nối PostgreSQL)
npm run test:unit

# Chạy Integration tests (kích hoạt guard kiểm tra TEST_DATABASE_URL)
npm run test:integration

# Kiểm tra kiểu dữ liệu TypeScript toàn bộ dự án
npx tsc --noEmit

# Tạo bản build tối ưu cho production
npm run build
```
