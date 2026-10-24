# NexusShowcase - Academic Club Portfolio

Để xem app với tốc độ production ngay từ lượt mở trang đầu, chạy `npm run preview`
(mặc định `http://127.0.0.1:3001`; đổi cổng bằng `npm run preview -- --port 3002`).
Lệnh này build toàn bộ route trước khi mở server, dùng `.next-preview` riêng để không
ghi đè server development. Sau khi sửa code, chạy lại lệnh để cập nhật bản preview.
`npm run dev` dành cho chỉnh sửa trực tiếp và có thể phải biên dịch route ở lượt đầu.

Kiểm tra các trang với trình duyệt mới, tắt cache: `npm run check:pages`.
Dùng `PERF_BASE_URL` để chọn URL local và `PERF_PAGE_BUDGET_MS` để đổi ngưỡng
(mặc định 2000 ms). Thêm `-- --admin` để đo cả trang quản trị bằng tài khoản
bootstrap đã cấu hình trong môi trường local. Bài kiểm tra chỉ đọc các trang,
không tạo/sửa/xóa dữ liệu; báo cáo ghi tại
`docs/superpowers/reports/performance/cold-pages.json`, liệt kê rõ trang bị bỏ qua.

Hệ thống trưng bày bài báo khoa học, đề tài nghiên cứu, dự án công nghệ và quản lý thành viên câu lạc bộ học thuật.

Cấu trúc hiện tại: `src/app` ghép route/layout; `src/features` sở hữu identity/assets/publications/members/submissions/review; `src/server` chứa DB/cache/observability và `src/shared` chứa primitive. Xem [architecture](docs/architecture.md), [tài liệu hiện hành/lịch sử](docs/superpowers/README.md) và [walkthrough refactor](docs/superpowers/reports/2026-10-21-refactor-walkthrough.md).

Kiểm tra không cần DB: `npm run check` (typecheck, unused, architecture, unit). Các lệnh riêng: `typecheck`, `check:unused`, `check:architecture`, `test:unit`. Với DB test riêng: `test:integration`, `test:e2e`, `db:verify-upgrade`. Harness dùng `.next-harness` riêng để không ghi chung output với dev server. `bench:navigation` dựng production fixtures 20/1000 bài, mặc định lưu `docs/superpowers/reports/navigation-viewport/metrics.json`; đặt `HARNESS_BENCHMARK_OUTPUT` để chọn báo cáo mới. Protocol2 đo heading tĩnh của trang chủ vì dữ liệu phía dưới chỉ tải khi cuộn gần tới; không so trực tiếp chỉ số home này với protocol cũ. [Số đo cũ và giới hạn](docs/superpowers/reports/refactor-performance.md).

CI dùng Node22, unit/typecheck/build trên Windows/Linux và PostgreSQL16 cho integration/browser tuần tự. Workflow chưa được chạy trên GitHub trong phiên local này. Upload local cần volume/storage bền vững; không xóa upload chỉ dựa trên import graph. Chính sách tải asset PRIVATE còn cần quyết định riêng; dữ liệu danh sách/metadata đã được kiểm tra visibility.

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
# Cài mới trên database trống; DB hiện có xem quy trình riêng bên dưới
npm run db:migrate

# Nạp dữ liệu khởi tạo (idempotent, không phá hủy dữ liệu hiện có nếu RESET_DATABASE="false")
npm run db:seed
```

DB đang có dữ liệu hoặc migration history cần đối chiếu trước khi deploy/resolve. Xem [quy trình database](docs/database-operations.md). `db:push` chỉ dành cho thử nghiệm schema cục bộ đã xác định rõ, không thay quy trình nâng cấp.

`npm run db:verify-upgrade` kiểm chứng cài mới và nâng cấp trong hai schema UUID của DB test; `npm run db:inventory` chỉ đọc history/identifier/asset của DB runtime. Docker test riêng: `docker compose -f docker-compose.test.yml up -d` rồi dùng URL test cổng5435 trong `.env.example`. Báo cáo không chứa connection string hoặc email thô.

Để thêm 20 bài mẫu công khai (10 Nghiên cứu khoa học, 10 Robotics & IoT) phục vụ kiểm tra chuyển tab và phân trang:
```bash
npm run db:seed:mock
```
Lệnh cần có admin đang hoạt động và `DATABASE_URL` trong `.env`. Có thể chạy lại mà không tạo trùng hoặc ghi đè bài hiện có.

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

---

## 5. Đăng bài theo section và Admin duyệt trực tiếp

- `CORE_MEMBER` và `ADMIN` có thể soạn bài; mỗi tác giả chỉ sửa bài của mình.
- Abstract/tóm tắt và ít nhất một người đóng góp bắt buộc khi gửi. Lưu nháp chỉ cần tiêu đề.
- Dự án không bắt buộc nội dung chi tiết. Bài nghiên cứu cần nội dung hoặc nguồn toàn văn.
- Nội dung gồm section có tên và các khối văn bản, ảnh/biểu đồ, video, PDF, liên kết. Định dạng được giới hạn để giữ bố cục nhất quán. HTML tùy ý không được thực thi.
- Liên kết/media trong section hiển thị trong nội dung. Tài nguyên đính kèm được quản lý riêng: tác giả đặt tên tùy ý rồi dán URL hoặc tải tệp bất kỳ (tối đa 25 MB/tệp). Các tài nguyên này hiển thị thành card không icon ở cột phải.
- Tệp tài nguyên chung lưu tại `storage/resources/`, được phục vụ qua `/uploads/resources/[filename]` dưới dạng tải xuống. Khi triển khai cần giữ thư mục này trên ổ lưu trữ bền vững cùng các tệp upload hiện có.
- Lưu file tải mới trên ImageKit bằng `ASSET_STORAGE=imagekit`; URL trong hệ thống không đổi. Xem [cấu hình và kiểm tra ImageKit](docs/imagekit-storage.md). Ảnh trống hoặc không đọc được dùng chung giao diện “Chưa có ảnh”.
- Admin xem bản nộp chỉ đọc và chọn xuất bản nội bộ/công khai, yêu cầu chỉnh sửa hoặc từ chối. Không còn bước Editor.

```text
Bản nháp -> Chờ duyệt -> Đã xuất bản
                   -> Cần chỉnh sửa -> Chờ duyệt
                   -> Từ chối
```

Tác giả có thể rút bài chờ duyệt về nháp. Mỗi lần gửi tạo `SubmissionRevision` bất biến. Khi sửa bài đã xuất bản, bản cập nhật lưu riêng ở `authorDraft`/`reviewStatus`; bản công khai vẫn giữ nguyên cho tới khi Admin duyệt. Quyết định duyệt dùng `reviewVersion` để ngăn thao tác trên bản cũ và xung đột.

### Cập nhật database

```bash
npx prisma generate
npx prisma migrate deploy
```

Migration mới chỉ thêm cột, chuyển Editor hiện hữu thành Core Member và gộp trạng thái chờ biên tập vào chờ duyệt. Enum/bảng biên tập cũ được giữ để bảo toàn lịch sử; không thể cấp quyền Editor mới. Các endpoint biên tập cũ ngừng nhận thay đổi.

Các kiểm thử database luôn dùng `TEST_DATABASE_URL` riêng. Kiểm thử luồng mới nằm trong `tests/integration/direct-approval.test.ts`.
