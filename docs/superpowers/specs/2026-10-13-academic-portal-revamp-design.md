# Academic Portal Revamp & Flexible Project Publishing Design

## 1. Overview & Context

Hệ thống NexusShowcase hiện tại sở hữu nền tảng bảo mật vững chắc (xác thực NextAuth v5 session-derived, database guard cho test, chu kỳ tài khoản an toàn). Tuy nhiên, trải nghiệm người dùng và luồng nghiệp vụ đăng bài đang gặp phải 3 vấn đề lớn:

1. **Đóng khung hàn lâm quá mức**: Form nộp bài bắt buộc các trường của một bài báo nghiên cứu khoa học (arXiv link, đơn vị phát hành/hội nghị, PDF 25MB, giảng viên hướng dẫn...). Các dự án kỹ thuật (Robotics, IoT, Web/App), các dataset thu thập được trên GitHub hoặc các công cụ nhỏ không thể điền được form này.
2. **Thiếu cơ chế phân quyền hiển thị (Public vs Private)**: Chưa có phân biệt bài viết công khai cho khách vãng lai (Guest) hay bài lưu hành nội bộ (chỉ thành viên đã đăng nhập tài khoản xem được).
3. **Giao diện rườm rà, mang chất "bán hàng" thay vì học thuật**: Sử dụng thanh cuộn phim (filmstrip), các khối đếm số liệu to đùng (dẫn đến việc xuất hiện số 0 trống trải khi một danh mục chưa có bài), animation màu mè và tốn quá nhiều diện tích cuộn trang.

Tài liệu này thiết kế lại toàn diện hệ thống theo hướng: **Tự do hóa luồng nộp bài dự án**, **Bổ sung cơ chế hiển thị Public/Private**, **Quản lý danh mục động ghim lên Navigation**, và **Trùng tu giao diện chuẩn Học thuật Tối giản (Academic Minimalist)**.

---

## 2. Core Requirements & Goals

### 2.1. Logic Đăng bài Mở (Unconstrained Content Model)
- Cho phép nộp mọi thể loại dự án: Robotics, Phần cứng, AI, Phần mềm, Web/App, Dataset, Công cụ, Bài báo nghiên cứu.
- Hạn chế tối đa dropdown ép buộc; ưu tiên các ô nhập tự do (free-text, tags).
- Hỗ trợ luồng phối hợp giữa **Nhóm kỹ thuật** (nộp nội dung thô + link Drive tư liệu ảnh/clip) và **Ban Truyền thông** (thiết kế và thay thế ảnh bìa chuẩn nhận diện thương hiệu CLB trước khi xuất bản).

### 2.2. Cơ chế Quyền hiển thị (Public vs Private)
- Mọi bài đăng hỗ trợ 2 chế độ:
  - `PUBLIC`: Khách vãng lai chưa đăng nhập và thành viên đều xem được trên trang chủ.
  - `PRIVATE`: Chỉ người dùng đã đăng nhập tài khoản vào hệ thống mới có quyền xem.
- Admin có nút công tắc 1-click chuyển đổi qua lại giữa `PUBLIC` và `PRIVATE` bất kỳ lúc nào.

### 2.3. Quản lý Danh mục Động & Quy tắc Zero Empty State
- Bảng `Category` quản lý tập trung, có cờ `isNavFeatured` để Admin chủ động đưa các danh mục nổi bật lên thanh menu chính.
- **Quy tắc Zero Empty State**: Chỉ những tab danh mục nổi bật (`isNavFeatured = true`) mà **có số lượng bài viết xuất bản > 0** mới được hiển thị trên thanh Navigation. Nếu một danh mục chưa có bài nào, nó sẽ tự động ẩn khỏi menu để tránh việc người dùng bấm vào ra trang trống rỗng gây cảm giác thiếu chuyên nghiệp.
- Thành viên nộp bài có thể chọn danh mục có sẵn hoặc đề xuất danh mục mới. Khi duyệt bài, Admin quyết định có đưa danh mục đề xuất vào hệ thống chính thức hay không, tránh tình trạng phình to và rác danh mục.

### 2.4. Trùng tu Giao diện Học thuật Tối giản (Academic Minimalist UI)
- Xóa bỏ vĩnh viễn:
  - Thanh cuộn phim (Filmstrip carousel / marquee ribbon).
  - Khối 3 ô đếm số lượng công trình trên trang chủ (loại bỏ số 0 gây phản cảm).
  - Toàn bộ animation, gradient rực rỡ và hiệu ứng bóng đổ kiểu e-commerce.
- Bố cục trang chủ cô đọng, mật độ thông tin cao, không gây mỏi tay khi cuộn trang.
- Các tab chuyên đề danh mục (`/category/[slug]`) có giao diện cực kỳ tối giản dạng danh mục kỹ thuật (Technical Directory / List) phục vụ tra cứu nhanh.

---

## 3. Architecture & Data Model

### 3.1. Prisma Schema Modifications

```prisma
enum ItemVisibility {
  PUBLIC    // Khách ngoài & thành viên đều xem được
  PRIVATE   // Chỉ tài khoản đã đăng nhập mới xem được
}

enum CategoryLayout {
  SHOWCASE_GRID   // Lưới card sản phẩm trực quan (Robotics, Dự án công nghệ)
  BIBLIOGRAPHY    // Thư mục bài báo học thuật & trích dẫn BibTeX (Bài báo khoa học)
  DATA_CATALOG    // Bảng tra cứu thông số kỹ thuật (Dữ liệu & Tài nguyên)
  HONOR_ROLL      // Bảng vàng vinh danh thành tích (Giải thưởng & Cống hiến)
}

model Category {
  id            String         @id @default(cuid())
  name          String         @unique // "Bài báo khoa học", "Robotics", "Datasets", "Giải thưởng"...
  slug          String         @unique // "publications", "robotics", "datasets", "awards"...
  description   String?
  layoutType    CategoryLayout @default(SHOWCASE_GRID)
  isNavFeatured Boolean        @default(false) // Ghim lên thanh Navigation Bar (Top 3)
  displayOrder  Int            @default(0)     // Thứ tự hiển thị trên thanh menu
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  items         ShowcaseItem[]

  @@map("categories")
}

model ShowcaseItem {
  id              String            @id @default(cuid())
  title           String
  slug            String            @unique
  summary         String
  content         String?           // Markdown chi tiết
  
  // Phân loại & Nhãn mở
  categoryId      String?
  category        Category?         @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  tags            String[]          @default([]) // Nhãn tự do: ["Robotics", "LiDAR", "Computer Vision"]

  // Trạng thái & Quyền hiển thị
  status          ItemStatus        @default(DRAFT) // DRAFT, PENDING_REVIEW, PUBLISHED, REJECTED
  visibility      ItemVisibility    @default(PRIVATE) // PUBLIC hoặc PRIVATE
  rejectionReason String?
  
  // Media & Tư liệu truyền thông
  thumbnailUrl    String?           // Ảnh bìa chính thức
  mediaDriveUrl   String?           // Link Google Drive ảnh/clip thô cho Ban Truyền thông

  // Thời gian & Ghim
  publishedYear   Int?              // Không bắt buộc ép buộc với project nhỏ
  publishedAt     DateTime?
  isPinned        Boolean           @default(false)
  pinnedAt        DateTime?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  creatorId       String
  creator         User              @relation("CreatedByUser", fields: [creatorId], references: [id], onDelete: Restrict)

  contributors    ItemContributor[]
  links           ItemLink[]
  attachments     ItemAttachment[]

  @@index([status, visibility])
  @@index([categoryId])
  @@map("showcase_items")
}

model ItemContributor {
  id                  String           @id @default(cuid())
  itemId              String
  item                ShowcaseItem     @relation(fields: [itemId], references: [id], onDelete: Cascade)
  userId              String?
  user                User?            @relation(fields: [userId], references: [id], onDelete: SetNull)
  externalName        String?
  externalAffiliation String?
  externalLink        String?
  customRoleTitle     String?          // Vai trò tự do: "Phần cứng", "AI Lead", "Data Curation"
  displayOrder        Int              @default(1)

  @@index([itemId])
  @@map("item_contributors")
}

model ItemLink {
  id        String       @id @default(cuid())
  itemId    String
  item      ShowcaseItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  label     String       // Nhãn tự gõ: "GitHub Code", "Tải Dataset", "Video Demo", "CAD 3D"...
  url       String
  type      String       @default("OTHER") // Giữ tương thích ngược

  @@index([itemId])
  @@map("item_links")
}
```

### 3.2. Initial Seed Categories
Khởi tạo sẵn 4 danh mục tiêu chuẩn được ghim lên Navigation:
1. `Bài báo khoa học` (`slug: "publications"`, `isNavFeatured: true`, `displayOrder: 1`)
2. `Dự án công nghệ` (`slug: "projects"`, `isNavFeatured: true`, `displayOrder: 2`)
3. `Dữ liệu & Tài nguyên` (`slug: "datasets"`, `isNavFeatured: true`, `displayOrder: 3`)
4. `Giải thưởng & Cống hiến` (`slug: "awards"`, `isNavFeatured: true`, `displayOrder: 4`)

---

## 4. Workflows & Business Logic

### 4.1. Luồng Nộp bài của Thành viên (Creator Submission)
Form tạo/chỉnh sửa bài (`ItemForm`):
1. **Thông tin cơ bản**:
   - `title`: Tên dự án / đề tài (Input text, max 200).
   - `summary`: Tóm tắt 1-2 câu ngắn gọn (Textarea, max 2,000).
   - `categoryId`: Chọn nhanh từ danh sách danh mục có sẵn.
   - `proposedCategory`: Ô nhập chữ tùy chọn nếu muốn đề xuất danh mục mới chưa có.
   - `tags`: Ô nhập nhãn tự do, phân tách bằng dấu phẩy (vd: `Robotics, STM32, LiDAR`).
2. **Media & Tư liệu cho Truyền thông**:
   - Nhóm có thể tự tải ảnh bìa lên qua `uploadFileAction` (nếu có sẵn).
   - Hoặc dán `mediaDriveUrl`: Link thư mục Google Drive chứa ảnh gốc, video thô, bản vẽ CAD để Ban Truyền thông hỗ trợ thiết kế.
3. **Liên kết (Links tự do)**:
   - Danh sách động: Mỗi liên kết chỉ cần 2 ô: `Nhãn (Label tự gõ)` + `Đường dẫn (URL an toàn)`.
4. **Nhóm thực hiện (Contributors)**:
   - Chọn thành viên trong CLB hoặc ghi tên người ngoài + ô nhập chữ tự do cho `Vai trò` (vd: "Phần cứng", "AI Lead").
5. **Nội dung chi tiết (Content)**:
   - Markdown editor tự do mô tả kiến trúc, kết quả thử nghiệm, cách cài đặt/sử dụng.
6. **Hành động**:
   - `Lưu bản nháp`: Lưu với `status: 'DRAFT'`.
   - `Gửi xét duyệt & truyền thông`: Lưu với `status: 'PENDING_REVIEW'`.

### 4.2. Luồng Phê duyệt & Phối hợp Ban Truyền thông (Admin / Media Pipeline)
Tại trang Quản trị duyệt bài (`/admin/reviews`):
1. **Ban Truyền thông (Media Editor)**:
   - Truy cập bài đang chờ duyệt.
   - Mở `mediaDriveUrl` của nhóm, lấy tư liệu thiết kế ảnh bìa chuẩn thương hiệu CLB Nexus.
   - Tải ảnh đè lên trường `thumbnailUrl`.
   - Chuốt lại câu từ tóm tắt (nếu cần).
2. **Admin xét duyệt**:
   - Kiểm tra nội dung kỹ thuật.
   - Xử lý danh mục đề xuất: Nếu bài có `proposedCategory`, Admin có thể bấm tạo thành Category chính thức trong hệ thống, hoặc gán bài về một Category hiện có.
   - Chọn chế độ hiển thị mặc định: `PUBLIC` hoặc `PRIVATE`.
   - Bấm `Phê duyệt & Xuất bản` (`status: 'PUBLISHED'`) hoặc `Yêu cầu chỉnh sửa` (`status: 'REJECTED'` kèm lý do).

### 4.3. Công tắc Chuyển đổi Public / Private (1-Click Toggle)
- Tạo Server Action [`toggleItemVisibilityAction(itemId: string)`](file:///D:/HCMUS/NexusShowcase/.worktrees/dev/src/actions/showcase-actions.ts):
  - Chỉ Admin mới có quyền gọi action này.
  - Đảo chiều `PUBLIC` $\leftrightarrow$ `PRIVATE` của bài viết đã xuất bản.
  - Kích hoạt `revalidatePath` ngay lập tức để giao diện cập nhật tức thì.

### 4.4. Quy tắc Lọc Dữ liệu cho Khách (Guest Query Filter)
Tất cả các query hiển thị công khai (Trang chủ, danh mục, trang chi tiết, RSS/API):
- Nếu người xem **chưa đăng nhập (Guest)**:
  ```ts
  where: {
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
  }
  ```
- Nếu người xem **đã đăng nhập (Member, Core Member, Admin)**:
  ```ts
  where: {
    status: 'PUBLISHED', // Thấy cả PUBLIC và PRIVATE
  }
  ```
- Nếu một Guest truy cập trực tiếp URL của một bài `PRIVATE`, server chuyển hướng sang trang `/login?callbackUrl=...` kèm thông báo bài viết yêu cầu đăng nhập nội bộ.

---

## 5. UI/UX Design Specifications (Academic Minimalist)

### 5.1. Bảng màu & Phong cách
- **Bảng màu trung tính**:
  - Background: Trắng tinh (`bg-white`) và xám rất nhẹ (`bg-slate-50`).
  - Text: Đen than (`text-slate-900`) và xám chì (`text-slate-600`).
  - Border: Viền mỏng 1px (`border-slate-200`).
  - Accent: Xanh đen học thuật (`#0F294A`).
  - Badge: Màu pastel nhẹ, viền mỏng; `[🔒 Nội bộ]` có icon khóa nhỏ; `[🌐 Công khai]` có icon quả địa cầu nhỏ.
- **Không animation**: Xóa toàn bộ hiệu ứng chuyển động, cuộn ngang, rung lắc.
- **Bo góc vừa phải**: `rounded-lg` hoặc `rounded-xl` chuẩn mực (bỏ `rounded-3xl` phồng to).

### 5.2. Cấu trúc Thanh Navigation Bar Chuẩn Mực
- Header cố định trên cùng, chiều cao vừa phải (60px), nền sạch sẽ, viền mảnh.
- **Thứ tự các phần tử trên Navigation Bar chính xác:**
  1. `[Logo]`: Logo CLB Nexus & Khoa CNTT - ĐHKHTN.
  2. `[Trang chủ]`: Liên kết về `/` (active state rõ nét).
  3. `[Thành viên]`: Liên kết về `/members` - danh bạ thành viên, ban chủ nhiệm, sinh viên nghiên cứu.
  4. `[Các tab nổi bật]`: **Tối đa 3 tab nổi bật nhất (Top 3)** do Admin ghim (`isNavFeatured = true`) VÀ thỏa mãn điều kiện có bài viết (`count > 0`), sắp xếp theo `displayOrder: 'asc'`. Giới hạn 3 tab giúp thanh menu không bao giờ bị tràn (overflow) trên màn hình laptop nhỏ.
  5. `[Bài đăng]`: Tab quản lý bài nộp (thay thế tên cũ "Dashboard", đúng 2 chữ), liên kết về `/dashboard`. Tab này chỉ xuất hiện khi người dùng **đã đăng nhập**.
  6. `[Liên hệ]`: Liên kết về `/contact` - thông tin liên lạc lab, địa chỉ, kênh trao đổi học thuật.
  7. `[Profile / Đăng nhập]`:
     - Nếu chưa đăng nhập: Nút `Đăng nhập` dẫn tới `/login`.
     - Nếu đã đăng nhập: Avatar / Tên người dùng kèm dropdown menu (Thông tin cá nhân, Đăng xuất, Admin Review nếu là Admin).

### 5.3. Trang chủ (`/`)
- **Xóa bỏ hoàn toàn**:
  - `FeaturedFilmstrip` (Component cuộn phim).
  - Khối 3 ô đếm số thống kê (`totalPapers`, `totalProjects`, `totalAchievements`).
- **Phần đầu trang (Compact Header)**:
  - 1 dòng tiêu đề trang nhã: *"CLB Nghiên cứu & Sáng tạo Nexus • Khoa CNTT - ĐHKHTN"*.
  - Thanh tìm kiếm và bộ lọc nhanh theo thẻ nhãn (tags).
- **Lưới danh mục công trình (Compact Grid)**:
  - Hiển thị ngay từ màn hình đầu tiên (người dùng không cần cuộn trang).
  - Thẻ bài viết tối giản:
    - Ảnh thumbnail tỉ lệ 16:9 sắc nét (hoặc icon nếu không có ảnh).
    - Tiêu đề đậm rõ ràng.
    - Tóm tắt 2 dòng.
    - Tags nhỏ: `#Robotics`, `#ComputerVision`.
    - Tác giả & Năm.
    - Huy hiệu `[🔒 Nội bộ]` hoặc `[🌐 Công khai]`.

### 5.4. Trang Danh mục Chuyên đề (`/category/[slug]`) Đa Layout
Trang tự động render layout tương ứng với trường `layoutType` của Category đó:
1. **`BIBLIOGRAPHY` (Bài báo khoa học)**:
   - Layout dạng thư mục trích dẫn học thuật (Academic Citation Index): Tên bài báo font Serif in đậm, danh sách Tác giả & Đơn vị, Kỷ yếu hội nghị / Tạp chí & Năm, nút Sao chép trích dẫn nhanh `[BibTeX]` / `[APA]` / `[IEEE]`, link tải PDF. Không dùng ảnh to choán chỗ.
2. **`SHOWCASE_GRID` (Dự án công nghệ & Robotics)**:
   - Layout dạng lưới card trực quan (Visual Showcase Grid): Ảnh bìa tỉ lệ 16:9 sắc nét, tags công nghệ (`#ROS2`, `#LiDAR`, `#STM32`), liên kết nhanh `[GitHub]`, `[Demo]`, `[CAD 3D]`.
3. **`DATA_CATALOG` (Dữ liệu & Tài nguyên)**:
   - Layout dạng bảng tra cứu thông số kỹ thuật (Data Catalog Table): Cột Tên dataset, Định dạng tệp (CSV, H5, Parquet, Zip), Kích thước/Số mẫu, Giấy phép bản quyền, Nút tải nhanh từ Google Drive / Hugging Face.
4. **`HONOR_ROLL` (Giải thưởng & Cống hiến)**:
   - Layout dạng bảng vàng vinh danh (Honor Timeline): Huy hiệu thành tích (Giải Nhất, Giải Nhì, Vô địch), tên Cuộc thi/Hội thảo, Nhóm sinh viên đạt giải, Năm đạt giải.

### 5.5. Trang Chi tiết Công trình (`/showcase/[slug]`)
- Layout dạng Technical Report:
  - Tiêu đề lớn, danh sách tác giả, ngày công bố.
  - Nếu là Admin: Hiển thị thanh công cụ Admin kèm nút công tắc:
    `[ 🌐 Công khai cho Guest ]` $\leftrightarrow$ `[ 🔒 Chỉ nội bộ CLB ]`.
  - Khối nút liên kết nhanh (Action Pills): `[Mã nguồn GitHub]`, `[Tải Dataset]`, `[Xem Demo]`, `[Tệp CAD]`, `[Tài liệu PDF]`.
  - Thân bài: Nội dung Markdown chuẩn với heading, hình ảnh có chú thích, khối code font JetBrains Mono.

### 5.6. Trang Danh bạ Thành viên (`/members`)
- Bố cục danh bạ học thuật (Academic Directory):
  - Nhóm theo vai trò / ban: Ban Cố vấn & Giảng viên, Ban Chủ nhiệm CLB, Nhóm Nghiên cứu & Kỹ thuật.
  - Card thành viên tối giản: Avatar, Họ tên, Vai trò trong CLB, Khóa/Chuyên ngành, Lĩnh vực quan tâm (Tags), Liên kết (GitHub, LinkedIn, Email).
  - Không hiệu ứng thừa, tải nhanh, trực quan.

### 5.7. Trang Thông tin Liên hệ (`/contact`)
- Bố cục liên hệ trang nhã:
  - Thông tin đơn vị: CLB Nghiên cứu & Sáng tạo Nexus, Khoa Công nghệ Thông tin, Trường ĐH Khoa học Tự nhiên - ĐHQG-HCM.
  - Văn phòng / Lab: Địa chỉ cơ sở 1 (227 Nguyễn Văn Cừ, P.4, Q.5) / cơ sở 2 (Linh Trung, TP. Thủ Đức).
  - Email học thuật / hợp tác: `contact@nexusclub.edu.vn` (hoặc email ban chủ nhiệm).
  - Khối biểu mẫu liên hệ / kết nối hợp tác nghiên cứu nhanh (Họ tên, Email, Tiêu đề, Nội dung nhắn, Nút gửi).

---

## 6. Testing & Quality Assurance

1. **Unit Tests**:
   - Kiểm tra `toggleItemVisibilityAction`: chỉ Admin được gọi, cập nhật đúng `PUBLIC` $\leftrightarrow$ `PRIVATE`.
   - Kiểm tra bộ lọc truy vấn: Guest không bao giờ đọc được bài `PRIVATE` hoặc chưa publish; Member xem được cả `PRIVATE` và `PUBLIC`.
   - Kiểm tra logic form nộp bài mới: chấp nhận tags tự do, links tự do, không bắt buộc các trường học thuật cũ.
2. **Security & Regression Tests**:
   - Đảm bảo các rào chắn bảo mật từ 7 Task trước (ID spoofing guard, test DB guard, CSRF/session validity) không bị ảnh hưởng.
3. **Build & Typecheck**:
   - `npx prisma validate`, `npx tsc --noEmit`, `npm run test:unit`, `npm run build` đạt 100% không lỗi.
