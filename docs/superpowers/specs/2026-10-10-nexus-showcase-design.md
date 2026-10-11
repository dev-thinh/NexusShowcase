# Thiết Kế Hệ Thống NexusShowcase (Design Spec)

**Dự án:** NexusShowcase — Nền tảng trưng bày bài báo khoa học, dự án công nghệ và thành tích/cống hiến CLB  
**Ngày lập:** 10/10/2026  
**Trạng thái:** Chờ phê duyệt (Pending Review)

---

## 1. Giới thiệu & Mục tiêu (Overview & Goals)

### 1.1. Bối cảnh
Các câu lạc bộ học thuật và phòng Lab nghiên cứu (như CLB/Lab trực thuộc trường ĐH Khoa học Tự nhiên - ĐHQG-HCM / HCMUS) có nhiều hoạt động nghiên cứu khoa học, dự án phần mềm và giải thưởng/cống hiến. 
Đặc thù hoạt động trong CLB/Lab:
* Các thành viên thường làm việc theo các nhóm động và thay đổi liên tục qua từng đợt nghiên cứu (ví dụ đợt này nhóm {A, B, C}, đợt sau {A, C, D}...).
* Các bài báo khoa học có cấu trúc tác giả chặt chẽ: Giảng viên hướng dẫn (Advisor/Supervisor), Tác giả chính (First Author), Đồng tác giả (Co-Author), Tác giả liên hệ (Corresponding Author).
* Có sự tham gia của các Giảng viên hướng dẫn hoặc cộng tác viên nghiên cứu bên ngoài không nhất thiết phải tạo tài khoản cá nhân trên trang web CLB.
* Thầy chủ nhiệm CLB là người bận rộn với công tác giảng dạy, giữ vai trò bảo đảm uy tín học thuật tối cao và không trực tiếp nhập liệu các biểu mẫu.

### 1.2. Mục tiêu hệ thống
**NexusShowcase** là nền tảng web tập trung giải quyết trọn vẹn các bài toán trên:
1. **Trưng bày bài báo khoa học chuẩn mực:** Hiển thị tóm tắt (abstract), ảnh đại diện (thumbnail), video demo (YouTube/Loom/Drive), liên kết xuất bản (arXiv, IEEE, ScienceDirect...), và file PDF toàn văn.
2. **Cơ chế tác giả & vai trò linh hoạt:** Hỗ trợ liên kết tài khoản thành viên trong CLB LẪN nhập thông tin giảng viên/cộng tác viên bên ngoài kèm chức danh học thuật chính xác và thứ tự tác giả.
3. **Trưng bày dự án & mã nguồn:** Liên kết GitHub, demo trực tiếp, slide thuyết trình, phân chia vai trò (Project Lead, Frontend, Backend, AI Engineer).
4. **Ghi nhận đa dạng thành tích & cống hiến:** Từ các cuộc thi bên ngoài (ICPC, Hackathon, NCKH) đến giải thưởng nội bộ và cống hiến xây dựng cơ sở hạ tầng/web/workshop cho CLB.
5. **Hồ sơ thành viên tự động (Automatic Member Portfolio):** Khi một bài báo/dự án được xuất bản, tất cả các thành viên CLB được gắn tên sẽ tự động có bài đó xuất hiện trên trang cá nhân của mình.
6. **Mô hình phân cấp quản trị & ủy quyền upload tối ưu:** Thầy chủ nhiệm duyệt bài, Thành viên nòng cốt (Core Member) đại diện nhóm upload, Thành viên thông thường chỉ xem và sở hữu portfolio.

---

## 2. Hệ Thống Phân Quyền 4 Cấp (User Roles & Permissions)

| Vai trò (Role) | Đối tượng | Quyền hạn & Trách nhiệm |
| :--- | :--- | :--- |
| **GUEST (Khách vãng lai)** | Người ngoài, sinh viên chưa gia nhập CLB. | - Xem các bài báo, dự án, thành tích đã xuất bản (`PUBLISHED`).<br>- Xem danh sách thành viên và trang cá nhân (Portfolio) công khai.<br>- Đăng ký tài khoản (qua Email / Google). |
| **MEMBER (Thành viên thường)** | Thành viên chính thức của CLB (mới gia nhập hoặc đàn em khóa dưới). | - Tất cả quyền của `GUEST`.<br>- Quản lý hồ sơ cá nhân (Avatar, Bio, GitHub, Scholar, LinkedIn).<br>- Được gắn tên làm tác giả/thành viên trong các bài báo và dự án.<br>- Xem danh mục thành quả mình đã tham gia trong Dashboard cá nhân.<br>- **Không có quyền tự tạo bài đăng mới** (tránh tình trạng spam bài hoặc đăng trùng lặp trong nhóm). |
| **CORE_MEMBER (Thành viên nòng cốt)** | Trưởng nhóm nghiên cứu, Lead dự án, anh/chị khóa trên được Thầy chủ nhiệm nâng cấp. | - Tất cả quyền của `MEMBER`.<br>- Đại diện nhóm nghiên cứu/dự án ({A, B, C}...) tạo bài viết mới (`DRAFT`).<br>- Tải lên hình ảnh thumbnail, file PDF tài liệu, liên kết video demo.<br>- Thêm danh sách tác giả (chọn thành viên CLB hoặc nhập giảng viên/cộng tác viên bên ngoài), sắp xếp thứ tự tác giả.<br>- Gửi bài lên hệ thống kiểm duyệt (`PENDING_REVIEW`). |
| **ADMIN (Thầy chủ nhiệm CLB)** | Giảng viên phụ trách / Thầy chủ nhiệm CLB. | - Người có thẩm quyền cao nhất.<br>- Duyệt tài khoản mới đăng ký (`PENDING` -> `MEMBER`).<br>- **Nâng cấp thành viên tin cậy lên `CORE_MEMBER`** (hoặc hạ cấp khi cần).<br>- **Phê duyệt hoặc từ chối bài đăng** (`PENDING_REVIEW` -> `PUBLISHED` / `REJECTED`) kèm nhận xét/lý do.<br>- Toàn quyền chỉnh sửa, gỡ bỏ bài đăng khi cần thiết. |

---

## 3. Kiến trúc Công nghệ (Technology Stack)

* **Framework:** **Next.js 15 (App Router, React 19, TypeScript)**
  * React Server Components (RSC) cho các trang Showcase công khai để tối ưu SEO, tốc độ tải trang cực nhanh và Open Graph metadata chuẩn mực cho bài báo khoa học.
  * Server Actions cho các thao tác đăng bài, kiểm duyệt và phân quyền (RBAC).
* **Styling & Giao diện:** **Tailwind CSS + shadcn/ui + Lucide Icons**
  * Giao diện hiện đại, tinh tế, chuẩn học thuật và công nghệ, hỗ trợ Dark/Light mode, tương thích 100% thiết bị di động.
* **Cơ sở dữ liệu & ORM:** **Prisma ORM**
  * Hỗ trợ chuyển đổi liền mạch: Mặc định SQLite cho môi trường local/dev; PostgreSQL cho môi trường production qua cấu hình `DATABASE_URL`.
* **Xác thực (Authentication):** **Auth.js (NextAuth v5)**
  * Xác thực mật khẩu bảo mật (Credentials + bcryptjs) và sẵn sàng kích hoạt Google OAuth.
* **Lưu trữ tệp tin (File Storage):**
  * Lớp trừu tượng Storage Adapter: Tự động lưu thumbnail và PDF vào thư mục `public/uploads/` (cho môi trường local/self-hosted) và có thể cắm nhanh sang Cloudinary / S3 / Supabase Storage mà không thay đổi mã nguồn nghiệp vụ.
* **Bộ nhúng Video thông minh (Smart Video Embed):**
  * Tự động nhận diện URL và nhúng iframe responsive chuẩn: YouTube, Loom, Google Drive, Vimeo.

---

## 4. Mô hình Dữ liệu (Prisma Schema Data Model)

```prisma
datasource db {
  provider = "sqlite" // Chuyển sang "postgresql" cho production qua DATABASE_URL
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  GUEST
  MEMBER
  CORE_MEMBER       // Thành viên nòng cốt / Nhóm trưởng được Thầy nâng cấp
  ADMIN             // Thầy chủ nhiệm CLB
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
  INTERNAL          // Vinh danh / Giải nội bộ CLB
  CLUB_CONTRIBUTION // Đóng góp xây dựng CLB (xây web, host workshop, lab server...)
  EXTERNAL          // Cuộc thi bên ngoài (ICPC, Hackathon, NCKH...)
  OPEN_SOURCE       // Dự án cộng đồng / Mã nguồn mở
}

enum ItemStatus {
  DRAFT             // Bản nháp của Core Member
  PENDING_REVIEW    // Đang chờ Thầy chủ nhiệm duyệt
  PUBLISHED         // Đã duyệt, hiển thị công khai
  REJECTED          // Bị từ chối (kèm lý do nhận xét)
}

enum ContributorRole {
  ADVISOR               // Người hướng dẫn / Giảng viên hướng dẫn
  FIRST_AUTHOR          // Tác giả thứ nhất / Tác giả chính
  CO_FIRST_AUTHOR       // Đồng tác giả thứ nhất
  CO_AUTHOR             // Đồng tác giả (Tác giả 2, 3...)
  CORRESPONDING_AUTHOR  // Tác giả liên hệ
  PROJECT_LEAD          // Trưởng nhóm dự án
  CONTRIBUTOR           // Thành viên tham gia / đóng góp
  CUSTOM                // Vai trò tùy chỉnh (dùng customRoleTitle)
}

enum LinkType {
  PAPER_URL         // Link bài báo (arXiv, IEEE, ScienceDirect...)
  VIDEO_EMBED       // Video demo (YouTube, Loom, Drive...)
  GITHUB            // Mã nguồn GitHub
  LIVE_DEMO         // Website / Web app chạy thử trực tiếp
  SLIDES            // Slide thuyết trình
  CERTIFICATE       // Bằng khen / Chứng nhận
  OTHER             // Khác
}

model User {
  id               String          @id @default(cuid())
  email            String          @unique
  passwordHash     String?
  fullName         String
  studentId        String?         // MSSV (tùy chọn)
  avatarUrl        String?
  bio              String?
  githubUrl        String?
  linkedinUrl      String?
  googleScholarUrl String?
  portfolioUrl     String?
  role             Role            @default(GUEST)
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
  summary         String            // Mô tả tóm tắt ngắn (Abstract)
  content         String?           // Nội dung chi tiết (Markdown)
  type            ItemType
  scope           ItemScope?        // Phạm vi ghi nhận
  issuer          String?           // Đơn vị cấp / công nhận (VD: CLB Nexus, Khoa CNTT...)
  thumbnailUrl    String?
  status          ItemStatus        @default(DRAFT)
  rejectionReason String?           // Nhận xét từ Thầy chủ nhiệm nếu từ chối
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
  id                  String           @id @default(cuid())
  itemId              String
  
  // Trường hợp 1: Tác giả là thành viên CLB (đã có tài khoản)
  userId              String?
  user                User?            @relation(fields: [userId], references: [id], onDelete: SetNull)

  // Trường hợp 2: Tác giả ngoài / Giảng viên hướng dẫn (chưa có tài khoản)
  externalName        String?          // Ví dụ: TS. Trần Văn B
  externalAffiliation String?          // Ví dụ: Bộ môn Khoa học Máy tính - HCMUS
  externalLink        String?          // Link Google Scholar hoặc Website cá nhân

  role                ContributorRole  @default(CONTRIBUTOR)
  customRoleTitle     String?          // Dùng khi role = CUSTOM hoặc chú thích phụ
  displayOrder        Int              @default(0) // Thứ tự tác giả (1, 2, 3...)

  item                ShowcaseItem     @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@index([itemId])
  @@index([userId])
  @@map("item_contributors")
}

model ItemLink {
  id       String       @id @default(cuid())
  itemId   String
  label    String       // Tên nút (VD: "Đọc trên arXiv", "Mã nguồn GitHub")
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
  fileSize Int          // Bytes
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

## 5. Thiết Kế Giao Diện & Trải Nghiệm Người Dùng (UI/UX Specification)

### 5.1. Trang Công Khai (Public Pages)
1. **Trang Chủ (`/`)**:
   * **Hero Section:** Tên và logo CLB Nexus, thông điệp nghiên cứu khoa học và phát triển sản phẩm. Thống kê tổng quan: Số lượng bài báo, dự án đã triển khai, giải thưởng/cống hiến.
   * **Bộ lọc Danh mục:** Tab lọc nhanh giữa *Tất cả*, *Bài báo khoa học*, *Dự án công nghệ*, *Thành tích & Cống hiến*.
   * **Bộ lọc nâng cao:** Lọc theo Năm công bố, Thẻ lĩnh vực (AI, Web, IoT...), và Phạm vi (Nội bộ / Bên ngoài).
   * **Thẻ bài viết (Showcase Card):** Hiển thị thumbnail sắc nét, tiêu đề, năm, danh sách tên tác giả ngắn gọn, huy hiệu loại bài.
2. **Trang Chi Tiết Mục (`/showcase/[slug]`)**:
   * **Khu vực Tác giả trang trọng:**
     * Hiển thị rõ danh sách tác giả theo đúng thứ tự (`displayOrder`).
     * Tác giả là Giảng viên hướng dẫn (`ADVISOR`) được hiển thị với huy hiệu trang trọng.
     * Tác giả là thành viên CLB: Có avatar, click vào dẫn đến trang cá nhân của thành viên.
     * Tác giả bên ngoài: Hiển thị tên kèm đơn vị công tác (`externalAffiliation`) và link Google Scholar (nếu có).
   * **Khu vực Video Demo:** Nhúng khung xem video trực tiếp (YouTube, Loom, Drive...) với tỉ lệ chuẩn 16:9.
   * **Khu vực Nút bấm Tác vụ (Action Bar):**
     * *"Đọc bài báo gốc (arXiv/IEEE)"*
     * *"Xem mã nguồn GitHub"*
     * *"Trang web chạy thử"*
     * *"Tải về PDF toàn văn"*
   * **Nội dung tóm tắt & chi tiết:** Định dạng Markdown hỗ trợ biểu thức, code block, hình ảnh.
3. **Trang Hồ Sơ Thành Viên (`/members/[id]`)**:
   * Header hồ sơ: Avatar, Họ tên, vai trò trong CLB, tiểu sử (bio), các link (GitHub, Scholar, LinkedIn).
   * **Tự động tổng hợp thành quả:**
     * Danh sách bài báo đã tham gia (kèm vai trò: Tác giả chính, Đồng tác giả...).
     * Danh sách dự án công nghệ đã xây dựng.
     * Danh sách giải thưởng & cống hiến CLB.

### 5.2. Dashboard Thành Viên (`/dashboard`)
1. **Dành cho Thành viên thường (`MEMBER`):**
   * Quản lý thông tin cá nhân (Profile, link mạng xã hội).
   * Xem danh sách các bài báo/dự án mình được gắn tên tham gia.
   * Banner thông tin: *"Bạn đang là Thành viên CLB. Để đề xuất hoặc đăng tải bài báo/dự án mới cho nhóm, vui lòng trao đổi với Thầy chủ nhiệm để được chỉ định làm Thành viên nòng cốt (Core Member)."*
2. **Dành cho Thành viên nòng cốt (`CORE_MEMBER`):**
   * Nút bấm nổi bật: **"+ Đăng tải bài mới"** (`/dashboard/items/new`).
   * Bảng quản lý bài viết do mình tạo:
     * Trạng thái rõ ràng: `Bản nháp`, `Đang chờ Thầy duyệt`, `Đã xuất bản`, `Cần chỉnh sửa`.
     * Nếu bị từ chối (`REJECTED`): Hộp thông báo màu cam/đỏ hiển thị chi tiết lời nhận xét từ Thầy chủ nhiệm để nhóm biết hướng sửa đổi.
3. **Form Soạn thảo & Tải bài (`/dashboard/items/new` & `/dashboard/items/[id]/edit`):**
   * **Bước 1: Thông tin chung:** Tiêu đề, tóm tắt, loại mục, phạm vi (nội bộ/bên ngoài), năm công bố.
   * **Bước 2: Media & Tệp đính kèm:** Upload ảnh thumbnail (kéo thả); dán URL video demo; upload file PDF bài báo.
   * **Bước 3: Danh sách Tác giả & Vai trò (Cực kỳ linh hoạt):**
     * Nút *"Thêm thành viên CLB"*: Gõ tìm kiếm tên thành viên và chọn vai trò (*Tác giả chính, Đồng tác giả, Lead dự án...*).
     * Nút *"Thêm tác giả ngoài / Giảng viên"*: Nhập tên, đơn vị công tác, vai trò (*Người hướng dẫn / Giảng viên hướng dẫn*).
     * Nút kéo-thả để đổi vị trí thứ tự xuất hiện của các tác giả.
   * **Bước 4: Liên kết ngoài:** Thêm linh hoạt các link (arXiv, GitHub, Live Demo, Slides...).
   * **Bước 5: Soạn thảo nội dung:** Hỗ trợ Markdown có khung xem trước trực tiếp (Live Preview).
   * Nút *"Lưu bản nháp"* và *"Gửi Thầy chủ nhiệm duyệt"*.

### 5.3. Bảng Quản Trị Của Thầy Chủ Nhiệm (`/admin`)
1. **Kiểm duyệt bài đăng (`/admin/reviews`):**
   * Danh sách các bài đang ở trạng thái `PENDING_REVIEW` từ các nhóm nghiên cứu.
   * Xem trước bài viết đầy đủ (đúng như giao diện công chúng xem).
   * Thao tác 1-click:
     * **"Phê duyệt (Publish)"** -> Bài viết xuất hiện ngay lập tức trên trang chủ và trang cá nhân của tất cả các tác giả.
     * **"Yêu cầu chỉnh sửa (Reject with Note)"** -> Nhập nhận xét/yêu cầu sửa gửi lại cho Core Member.
2. **Quản lý & Phân quyền Thành viên (`/admin/members`):**
   * Danh sách toàn bộ thành viên CLB với thanh tìm kiếm thời gian thực (tên, MSSV, email) và bộ lọc vai trò (`ALL`, `CORE_MEMBER`, `MEMBER`, `ADMIN`).
   * **Tạo tài khoản mới:** Modal tạo tài khoản cho thành viên kèm MSSV, vai trò và mật khẩu khởi tạo.
   * **Nâng cấp / hạ cấp:** Thăng hạng thành viên lên `CORE_MEMBER` để ủy quyền nộp bài đại diện nhóm, hoặc hạ về `MEMBER`.
   * **Xóa tài khoản:** Xóa tài khoản thành viên kèm hộp thoại xác nhận cảnh báo, cơ chế bảo vệ chống tự xóa tài khoản Admin và bảo vệ tài khoản Quản trị viên.

---

## 6. Xử lý Lỗi, Bảo Mật & Ràng Buộc Kỹ Thuật (Security & Error Handling)

1. **Phân quyền chặt chẽ nhiều tầng (Strict RBAC):**
   * Middleware chặn truy cập trái phép vào `/dashboard` hoặc `/admin`.
   * **Quyền đăng tải bài viết:** Chỉ người dùng có vai trò `CORE_MEMBER` mới được phép tạo hoặc nộp bài đại diện cho nhóm nghiên cứu. Thầy chủ nhiệm (`ADMIN`) không trực tiếp đăng bài mà chỉ có thẩm quyền thẩm định, duyệt bài và quản lý tài khoản thành viên. Người dùng `MEMBER` thông thường hoặc `GUEST` cố tình gọi API sẽ nhận thông báo lỗi từ chối quyền.
   * Chỉ tác giả tạo bài mới có quyền chỉnh sửa bản nháp trước khi được Thầy duyệt.
2. **Upload an toàn:**
   * Thumbnail: Kiểm tra MIME type ảnh (`image/jpeg`, `image/png`, `image/webp`), giới hạn 5MB.
   * File PDF: Kiểm tra MIME type (`application/pdf`), giới hạn 25MB.
   * Tạo tên file bằng mã hash/UUID ngẫu nhiên chống ghi đè và tấn công Path Traversal.
3. **Validation & Chống XSS:**
   * Sử dụng `zod` để validate toàn bộ dữ liệu đầu vào.
   * Sanitize nội dung Markdown chống các đoạn mã JavaScript độc hại.

---

## 7. Kế Hoạch Kiểm Thử (Testing & Verification Strategy)

* **Kiểm thử Phân quyền (RBAC Tests):**
  * `GUEST` không thể truy cập dashboard hoặc tạo bài.
  * `MEMBER` thông thường đăng nhập được vào dashboard nhưng không thấy nút tạo bài và không thể gọi Server Action tạo bài.
  * Thầy chủ nhiệm nâng cấp `MEMBER` lên `CORE_MEMBER` -> Thành viên đó lập tức có nút tạo bài.
* **Kiểm thử Danh sách Tác giả (Author & Contributor Tests):**
  * Tạo bài báo gồm: 1 Giảng viên hướng dẫn ngoài (TS. Nguyễn Văn A), 1 Tác giả chính (Core Member), 2 Đồng tác giả (Member B, Member C).
  * Kiểm tra thứ tự hiển thị đúng sắp xếp `displayOrder`.
  * Sau khi bài được Thầy duyệt xuất bản: Kiểm tra trang profile của Member B và Member C có tự động xuất hiện bài báo đó không.
* **Kiểm thử Duyệt bài (Review Flow Tests):**
  * Core Member nộp bài (`PENDING_REVIEW`).
  * Thầy chủ nhiệm duyệt -> Trạng thái đổi thành `PUBLISHED`, xuất hiện trên trang chủ.
  * Thầy chủ nhiệm từ chối -> Trạng thái đổi thành `REJECTED`, Core Member nhận được lý do từ chối để sửa lại.
* **Kiểm thử Media & Links:**
  * Nhúng link video YouTube -> Player hiển thị chuẩn xác.
  * Tải file PDF bài báo -> Link tải về hoạt động tốt.
