# Thiết Kế Hệ Thống NexusShowcase (Design Spec)

**Dự án:** NexusShowcase — Nền tảng trưng bày bài báo, dự án công nghệ và thành tích/cống hiến CLB  
**Ngày lập:** 10/10/2026  
**Trạng thái:** Chờ phê duyệt (Pending Review)

---

## 1. Giới thiệu & Mục tiêu (Overview & Goals)

### 1.1. Bối cảnh
Các câu lạc bộ học thuật và công nghệ (như CLB trực thuộc HCMUS) có nhiều hoạt động nghiên cứu khoa học, dự án phần mềm ứng dụng, và các thành tích/cống hiến phong phú. Hiện tại, những thành quả này thường bị phân tán trên mạng xã hội, tài liệu lưu trữ nội bộ hoặc các bài đăng rời rạc.

### 1.2. Mục tiêu hệ thống
**NexusShowcase** là nền tảng web tập trung cho phép:
1. **Trưng bày bài báo khoa học:** Đầy đủ thông tin tóm tắt, ảnh đại diện (thumbnail), video demo, liên kết xuất bản (arXiv, IEEE, v.v.), và file PDF toàn văn.
2. **Trưng bày dự án & mã nguồn:** Liên kết GitHub, demo trực tiếp, slide trình bày, kiến trúc kỹ thuật.
3. **Ghi nhận thành tích & cống hiến CLB đa dạng:** Không chỉ các cuộc thi bên ngoài (ICPC, Hackathon, NCKH) mà còn cả các vinh danh nội bộ, giải thưởng nội bộ, hoặc cống hiến xây dựng cơ sở hạ tầng/web/workshop cho CLB.
4. **Hồ sơ thành viên (Member Portfolio):** Mỗi thành viên có một trang cá nhân tổng hợp tất cả bài báo, dự án và thành tích họ đã tham gia hoặc dẫn dắt.
5. **Quy trình kiểm duyệt chặt chẽ:** Thành viên tự do đăng tải và quản lý nội dung của mình; Ban chủ nhiệm (Admin) kiểm duyệt trước khi công khai trên bảng tin chung.

---

## 2. Phân quyền & Đối tượng người dùng (User Roles & Permissions)

| Vai trò (Role) | Mô tả | Quyền hạn |
| :--- | :--- | :--- |
| **GUEST (Khách / Chờ duyệt)** | Khách vãng lai hoặc tài khoản mới đăng ký chưa được duyệt. | - Xem tất cả bài báo, dự án, thành tích đã xuất bản (`PUBLISHED`).<br>- Xem trang cá nhân công khai của thành viên.<br>- Đăng ký tài khoản (qua Email / Google). |
| **MEMBER (Thành viên CLB)** | Thành viên chính thức của CLB. | - Tất cả quyền của `GUEST`.<br>- Quản lý hồ sơ cá nhân (Avatar, Bio, GitHub, Scholar, LinkedIn).<br>- Được gắn tên làm đồng tác giả / thành viên tham gia trong các bài đăng.<br>- Xem danh mục thành quả mình đã tham gia trong Dashboard cá nhân.<br>- *Mặc định chưa có quyền tạo bài đăng mới* (tránh tình trạng spam bài). |
| **EDITOR (Người được ủy quyền đăng)** | Trưởng ban Chuyên môn (Học thuật/Kỹ thuật), Lead dự án, hoặc Member được cấp quyền (`canUpload = true`). | - Tất cả quyền của `MEMBER`.<br>- Tạo, chỉnh sửa bài đăng mới (`DRAFT`).<br>- Tải lên hình ảnh thumbnail, file PDF tài liệu, video embed link.<br>- Gửi bài đăng lên hệ thống để Admin duyệt (`PENDING_REVIEW`). |
| **ADMIN (Ban chủ nhiệm CLB)** | Quản trị viên cao nhất của hệ thống. | - Tất cả quyền của `EDITOR`.<br>- Cấp quyền đăng (`canUpload = true`) hoặc bổ nhiệm vai trò `EDITOR` cho thành viên.<br>- Phê duyệt hoặc từ chối bài đăng (`PENDING_REVIEW` -> `PUBLISHED` / `REJECTED`) kèm lý do.<br>- Phê duyệt tài khoản mới (`PENDING` -> `ACTIVE`).<br>- Chỉnh sửa hoặc gỡ bỏ bất kỳ bài đăng nào vi phạm. |

---

## 3. Kiến trúc Công nghệ (Technology Stack)

* **Framework:** **Next.js 15 (App Router, React 19, TypeScript)**
  * Tận dụng React Server Components (RSC) cho các trang Showcase công khai để tối ưu SEO, tốc độ tải trang và Open Graph metadata khi chia sẻ mạng xã hội.
  * Server Actions cho các thao tác thêm/sửa/xóa và kiểm duyệt dữ liệu có kiểm tra quyền hạn (RBAC).
* **Styling & Giao diện:** **Tailwind CSS + shadcn/ui + Lucide Icons**
  * Giao diện hiện đại, responsive hoàn toàn trên Mobile/Tablet/Desktop, hỗ trợ Dark/Light mode.
* **Cơ sở dữ liệu & ORM:** **Prisma ORM**
  * Cấu hình linh hoạt: Mặc định chạy SQLite cho môi trường local/dev; dễ dàng chuyển sang PostgreSQL qua biến môi trường `DATABASE_URL` cho production.
* **Xác thực (Authentication):** **Auth.js (NextAuth v5)**
  * Hỗ trợ xác thực mật khẩu chuẩn (Credentials với bcryptjs) và sẵn sàng tích hợp Google OAuth.
* **Lưu trữ tệp tin (File Storage):**
  * Local Storage Provider: Tự động lưu thumbnail và PDF vào thư mục `public/uploads/` phục vụ phát triển độc lập và self-hosted.
  * Thiết kế lớp trừu tượng (Storage Adapter Pattern) cho phép dễ dàng chuyển đổi sang S3 / Cloudinary / Supabase Storage mà không cần sửa code nghiệp vụ.
* **Media Player / Video Embed:**
  * Component phân tích URL tự động nhận diện và nhúng video responsive cho: YouTube, Loom, Google Drive, Vimeo.

---

## 4. Mô hình Dữ liệu (Prisma Schema Data Model)

```prisma
datasource db {
  provider = "sqlite" // Có thể chuyển sang "postgresql" bằng env
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  GUEST
  MEMBER
  EDITOR            // Trưởng ban / Lead dự án được ủy quyền
  ADMIN
}

enum UserStatus {
  PENDING
  ACTIVE
  SUSPENDED
}

enum ItemType {
  RESEARCH_PAPER    // Bài báo khoa học
  PROJECT           // Dự án / Sản phẩm công nghệ
  ACHIEVEMENT       // Giải thưởng / Thành tích / Cống hiến
}

enum ItemScope {
  INTERNAL          // Nội bộ CLB (Giải nội bộ, thành viên xuất sắc...)
  CLUB_CONTRIBUTION // Đóng góp xây dựng CLB (xây web, host workshop...)
  EXTERNAL          // Cuộc thi bên ngoài (ICPC, Hackathon, NCKH...)
  OPEN_SOURCE       // Dự án cộng đồng / Mã nguồn mở
}

enum ItemStatus {
  DRAFT             // Bản nháp của thành viên
  PENDING_REVIEW    // Đang chờ Admin duyệt
  PUBLISHED         // Đã duyệt, công khai
  REJECTED          // Bị từ chối (có lý do)
}

enum LinkType {
  PAPER_URL         // Link bài báo (arXiv, IEEE, ScienceDirect...)
  VIDEO_EMBED       // Video demo (YouTube, Loom, Drive...)
  GITHUB            // Mã nguồn GitHub
  LIVE_DEMO         // Trang web chạy thử trực tiếp
  SLIDES            // Slide thuyết trình
  CERTIFICATE       // Bằng khen / Chứng nhận
  OTHER             // Khác
}

model User {
  id               String          @id @default(cuid())
  email            String          @unique
  passwordHash     String?
  fullName         String
  studentId        String?         // Mã số sinh viên (tùy chọn)
  avatarUrl        String?
  bio              String?
  githubUrl        String?
  linkedinUrl      String?
  googleScholarUrl String?
  portfolioUrl     String?
  role             Role            @default(GUEST)
  canUpload        Boolean         @default(false) // Quyền upload riêng lẻ do Admin bật/tắt
  status           UserStatus      @default(PENDING)
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  createdItems     ShowcaseItem[]  @relation("CreatedByUser")
  contributions    ItemContributor[]

  @@map("users")
}

model ShowcaseItem {
  id              String            @id @default(cuid())
  title           String
  slug            String            @unique
  summary         String            // Mô tả ngắn gọn
  content         String?           // Nội dung chi tiết (Markdown)
  type            ItemType
  scope           ItemScope?        // Phân loại phạm vi (đặc biệt cho thành tích/dự án)
  issuer          String?           // Đơn vị công nhận / cấp chứng nhận (VD: CLB Nexus, Khoa CNTT...)
  thumbnailUrl    String?
  status          ItemStatus        @default(DRAFT)
  rejectionReason String?           // Lý do từ chối nếu status = REJECTED
  publishedYear   Int               // Năm công bố / đạt giải
  publishedAt     DateTime?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  creatorId       String
  creator         User              @relation("CreatedByUser", fields: [creatorId], references: [id], onDelete: Cascade)

  contributors    ItemContributor[]
  links           ItemLink[]
  attachments     ItemAttachment[]
  tags            ItemTag[]

  @@index([type, status])
  @@index([publishedYear])
  @@map("showcase_items")
}

model ItemContributor {
  id            String       @id @default(cuid())
  itemId        String
  userId        String
  roleInProject String?      // Ví dụ: Tác giả chính, Đồng tác giả, Lead Frontend, Nghiên cứu viên...
  displayOrder  Int          @default(0)

  item          ShowcaseItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([itemId, userId])
  @@map("item_contributors")
}

model ItemLink {
  id       String       @id @default(cuid())
  itemId   String
  label    String       // Tên nút bấm (Ví dụ: "Xem trên arXiv", "Mã nguồn GitHub")
  url      String
  type     LinkType     @default(OTHER)

  item     ShowcaseItem @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@map("item_links")
}

model ItemAttachment {
  id       String       @id @default(cuid())
  itemId   String
  fileName String
  fileUrl  String
  fileSize Int          // Dung lượng bytes
  mimeType String

  item     ShowcaseItem @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@map("item_attachments")
}

model Tag {
  id    String    @id @default(cuid())
  name  String    @unique
  slug  String    @unique
  items ItemTag[]

  @@map("tags")
}

model ItemTag {
  itemId String
  tagId  String

  item   ShowcaseItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  tag    Tag          @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([itemId, tagId])
  @@map("item_tags")
}
```

---

## 5. Thiết Kế Giao Diện & Các Trang Chức Năng (UI/UX Specification)

### 5.1. Khách Vãng Lai & Người Xem Công Khai (Public Pages)
1. **Trang Chủ (`/`)**:
   * **Hero Section:** Giới thiệu ngắn về CLB và sứ mệnh nghiên cứu/sáng tạo. Thống kê nhanh: Tổng số bài báo, dự án đã triển khai, giải thưởng/thành tích đạt được.
   * **Featured Showcase:** Các công trình tiêu biểu nhất được ghim nổi bật.
   * **Bộ lọc Danh mục & Tabs:** Tab chuyển nhanh giữa: *Tất cả*, *Bài báo nghiên cứu (Research Papers)*, *Dự án công nghệ (Projects)*, *Thành tích & Cống hiến (Achievements & Contributions)*.
   * **Thanh tìm kiếm & Bộ lọc nâng cao:** Lọc theo năm (`publishedYear`), phạm vi (`INTERNAL`, `EXTERNAL`, `CLUB_CONTRIBUTION`), thẻ chủ đề (Tag).
2. **Trang Chi Tiết Mục (`/showcase/[slug]`)**:
   * **Phần đầu:** Tiêu đề, phân loại, năm công bố, huy hiệu trạng thái/phạm vi, đơn vị công nhận (`issuer`).
   * **Danh sách tác giả:** Avatar và tên các thành viên tham gia, click vào dẫn thẳng về trang cá nhân của thành viên đó kèm vai trò (`roleInProject`).
   * **Khu vực Media:**
     * Khung hiển thị Video Demo nhúng (nếu có link video).
     * Ảnh Thumbnail sắc nét kèm chế độ phóng to ảnh lightbox.
   * **Khu vực Tác vụ (Quick Actions):** Các nút bấm nổi bật liên kết ra ngoài:
     * *Đọc bài báo gốc (arXiv/IEEE)*
     * *Xem mã nguồn GitHub*
     * *Mở Demo trực tiếp*
     * *Tải về PDF toàn văn*
   * **Nội dung bài viết:** Hiển thị bài viết chi tiết viết bằng Markdown (hỗ trợ bảng, công thức, mã code).
3. **Trang Hồ Sơ Thành Viên (`/members/[id]` hoặc `/members/[username]`)**:
   * Thông tin cá nhân: Tên, avatar, bio, MSSV (nếu bật công khai), các liên kết mạng xã hội (GitHub, Scholar, LinkedIn, Website).
   * Tab danh mục thành quả của thành viên:
     * *Bài báo đã công bố*
     * *Dự án đã tham gia*
     * *Thành tích & Đóng góp cho CLB*

### 5.2. Khu Vực Thành Viên (`/dashboard`)
1. **Quản lý bài viết & thành quả (`/dashboard/items`)**:
   * Danh sách các bài thành viên đã tạo hoặc được gắn tên tham gia.
   * Huy hiệu trạng thái rõ ràng: `Nháp`, `Chờ duyệt`, `Đã xuất bản`, `Bị từ chối`.
   * Nếu bài bị từ chối (`REJECTED`): Hiển thị hộp thông báo màu đỏ ghi rõ lý do từ chối từ Ban chủ nhiệm để tác giả biết và sửa đổi.
2. **Kiểm soát quyền Tạo bài mới (`/dashboard/items/new`)**:
   * **Điều kiện:** Chỉ người dùng có vai trò `EDITOR`, `ADMIN`, hoặc được cấp cờ `canUpload = true` mới nhìn thấy nút bấm *"Tạo bài mới"* và truy cập được vào trang tạo bài.
   * Thành viên `MEMBER` thông thường: Hiển thị giao diện thông tin cá nhân và danh sách bài đã tham gia, kèm banner thông báo: *"Bạn chưa được cấp quyền đăng bài trực tiếp. Hãy liên hệ Ban chủ nhiệm để được ủy quyền hoặc trở thành Editor."*
3. **Trình tạo & chỉnh sửa bài viết (`/dashboard/items/new` & `/dashboard/items/[id]/edit`)**:
   * Form trực quan chia thành các bước rõ ràng:
     * *Bước 1: Thông tin cơ bản* (Tiêu đề, tóm tắt, loại mục: Bài báo / Dự án / Thành tích, phạm vi: Nội bộ / Bên ngoài / Đóng góp CLB, đơn vị cấp, năm).
     * *Bước 2: Media & Tệp đính kèm* (Tải lên ảnh thumbnail; nhập link Video Demo YouTube/Drive/Loom; tải lên file PDF đính kèm).
     * *Bước 3: Tác giả & Đóng góp* (Chọn các thành viên trong CLB tham gia cùng và điền vai trò).
     * *Bước 4: Liên kết liên quan* (Thêm động danh sách links: GitHub, Slide, Paper URL, Website...).
     * *Bước 5: Nội dung Markdown chi tiết* (Trình soạn thảo có tab xem trước Live Preview).
   * Nút *"Lưu bản nháp"* và *"Gửi phê duyệt"*.

### 5.3. Khu Vực Quản Trị Viên (`/admin`)
1. **Kiểm duyệt bài đăng (`/admin/reviews`)**:
   * Danh sách các bài đang ở trạng thái `PENDING_REVIEW`.
   * Xem trước bài viết như giao diện thật.
   * Nút bấm **"Phê duyệt"** (chuyển sang `PUBLISHED`) hoặc **"Từ chối"** (mở popup nhập lý do gửi lại cho tác giả).
2. **Quản lý thành viên & Cấp quyền đăng (`/admin/members`)**:
   * Danh sách người dùng mới đăng ký ở trạng thái `PENDING` -> Nút duyệt nâng cấp quyền từ `GUEST` lên `MEMBER`.
   * **Công tắc cấp quyền đăng (Upload Permission Toggle):** Cho phép Admin bật/tắt nhanh quyền `canUpload` cho từng thành viên, hoặc nâng cấp thành viên lên vai trò `EDITOR` (Trưởng ban Học thuật/Kỹ thuật).
   * Phân quyền quản trị viên (`ADMIN`).

---

## 6. Xử lý Lỗi, Bảo Mật & Ràng Buộc Kỹ Thuật (Error Handling & Security)

1. **Kiểm tra dữ liệu đầu vào (Validation):**
   * Sử dụng thư viện `zod` để validate toàn bộ dữ liệu form và Server Actions ở cả client lẫn server.
2. **Kiểm tra File Upload an toàn:**
   * Thumbnail: Giới hạn định dạng `image/jpeg`, `image/png`, `image/webp`; dung lượng tối đa 5MB.
   * File PDF: Giới hạn định dạng `application/pdf`; dung lượng tối đa 25MB.
   * Tạo tên file ngẫu nhiên an toàn (UUID/CUID) tránh ghi đè và tấn công Path Traversal.
3. **Phân quyền truy cập & Chống đăng lậu (RBAC & Upload Authorization):**
   * Middleware Next.js kiểm tra phiên đăng nhập và vai trò người dùng trước khi vào `/dashboard/*` hoặc `/admin/*`.
   * **Chặn upload ở tầng Server Action / API:** Bất kỳ request tạo bài nào đều kiểm tra điều kiện `user.role === 'ADMIN' || user.role === 'EDITOR' || user.canUpload === true`. Nếu không thỏa mãn, trả về lỗi `403 Forbidden`.
   * Server Actions kiểm tra chặt chẽ quyền sở hữu khi sửa/xóa bài đăng (chỉ tác giả bài viết hoặc Admin mới có quyền thao tác).
4. **Bảo vệ nội dung:**
   * Sanitize nội dung Markdown chống các lỗ hổng XSS (Cross-Site Scripting).

---

## 7. Kế Hoạch Kiểm Thử & Tiêu Chí Hoàn Thành (Testing & Verification Strategy)

* **Unit & Validation Tests:** Kiểm tra schema Zod, logic parse URL video (YouTube, Drive, Loom), và logic phân loại item.
* **Database & CRUD Tests:** Kiểm tra việc tạo bài viết kèm đa liên kết (`ItemLink`), đồng tác giả (`ItemContributor`), và kiểm tra tính toàn vẹn quan hệ cơ sở dữ liệu.
* **RBAC & Authorization Tests:**
   * Guest không thể vào Dashboard hoặc Admin.
   * Member bình thường (chưa có quyền upload) không thấy form tạo bài và bị chặn nếu cố tình gọi API/Server Action tạo bài (`403 Forbidden`).
   * Admin bật `canUpload` hoặc gán role `EDITOR` -> Người dùng có thể tạo bài và gửi duyệt thành công.
   * Chỉ Admin mới thực hiện được hành động duyệt bài (`PUBLISHED`) hoặc từ chối (`REJECTED`).
* **UI & Workflow End-to-End Verification:**
   1. Đăng ký tài khoản -> Admin duyệt làm Member.
   2. Admin cấp quyền đăng (`canUpload: true`) hoặc chỉ định làm `EDITOR`.
   3. Member/Editor tạo bài báo nghiên cứu (Upload thumbnail, dán link YouTube demo, đính kèm link arXiv & file PDF) -> Lưu nháp -> Gửi duyệt.
   4. Admin đăng nhập -> Thấy thông báo bài chờ duyệt -> Duyệt bài.
   5. Người ngoài vào trang chủ -> Thấy bài hiển thị trên Showcase -> Mở chi tiết -> Thử mở link, xem video embed, tải PDF -> Click vào profile tác giả xem toàn bộ thành tích.
