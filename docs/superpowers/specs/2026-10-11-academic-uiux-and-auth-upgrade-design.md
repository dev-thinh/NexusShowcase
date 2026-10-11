# Thiết Kế Nâng Cấp Hệ Thống NexusShowcase: Chuẩn Môi Trường Nghiên Cứu & Quản Trị Thành Viên Thực Tế

**Tài liệu:** Design Specification  
**Ngày lập:** 11/10/2026  
**Trạng thái:** Đã triển khai & Nghiệm thu toàn diện (Completed & Verified)

---

## 1. Mục Tiêu & Yêu Cầu Thiết Kế (Overview & Requirements)

### 1.1. Yêu cầu từ Người Dùng
1. **Loại bỏ toàn bộ Mock Data và các nút bấm giả lập:**
   - Xóa bỏ các nút đăng nhập 1-click demo/mock trong trang Login (`QUICK_ACCOUNTS`).
   - Xóa bỏ dữ liệu mẫu giả định, làm sạch database để sẵn sàng cho vận hành thực tế.
2. **Khởi tạo duy nhất 1 tài khoản Admin mặc định:**
   - Tên đăng nhập: `admin01`
   - Mật khẩu: `admin123`
   - Vai trò: `ADMIN` (Quản trị viên / Thầy Cố vấn Học thuật).
3. **Phân quyền Nghiêm ngặt (Strict RBAC):**
   - **Admin không đăng bài trực tiếp:** Admin chỉ có thẩm quyền duyệt/phê duyệt công trình nghiên cứu và quản lý thành viên.
   - **Chỉ Core Member mới có quyền nộp bài:** Sinh viên nòng cốt (`CORE_MEMBER`) được Thầy ủy quyền là vai trò duy nhất có thể nộp đề tài/công trình đại diện nhóm.
4. **Hệ thống Quản lý Thành viên Toàn diện (`/admin/members`):**
   - Tạo tài khoản thành viên mới (`createMemberAction`) kèm mật khẩu khởi tạo và MSSV.
   - Thăng hạng / hạ cấp linh hoạt giữa `MEMBER` và `CORE_MEMBER` (`updateUserRoleAction`).
   - Xóa tài khoản thành viên (`deleteMemberAction`) với cơ chế kiểm tra an toàn (chống tự xóa, chống xóa tài khoản Admin).
   - Bộ lọc tìm kiếm thời gian thực theo tên, email, MSSV và tab lọc vai trò.
5. **Nâng cấp toàn bộ UI/UX chuẩn Môi Trường Nghiên Cứu Khoa Học (Academic Research Lab):**
   - Ứng dụng phong cách **Swiss Modernism 2.0** theo khuyến nghị của `ui-ux-pro-max`.
   - Cặp font học thuật: **Crimson Pro** (Serif học thuật cho tiêu đề/bài báo), **Inter** (Sans-serif chuẩn mực cho giao diện), **JetBrains Mono** (Monospace cho BibTeX, DOI, code).
   - Bảng màu Viện Hàn Lâm: **Institutional Deep Navy** (`#0F294A`), Slate, Crisp Paper White, Gold/Amber cho giải thưởng.
   - Tính năng **Trích dẫn Khoa học 1-Click (BibTeX / APA / IEEE Generator)**.
   - Khối hiển thị **Tài Liệu Toàn Văn & Phụ Lục (PDF Documents & Attachments)** trên trang chi tiết và hỗ trợ upload PDF trong form đăng bài.
   - Bộ lọc **Chủ đề Nghiên cứu (Research Topics / Domains)** trên trang chủ.
   - **Universal Academic Footer** đồng bộ cho toàn bộ hệ thống (Khoa CNTT - ĐH KHTN ĐHQG-HCM).
   - Hồ sơ thành viên chuẩn **Academic Scholar Portfolio** với các thẻ chỉ số khoa học (Publication, Project, Award Metrics).

---

## 2. Kiến Trúc Xác Thực & Quản Lý Thành Viên (Auth & Member Management)

### 2.1. Xác thực linh hoạt (Username hoặc Email)
* **Vấn đề:** Hiện tại `auth.ts` sử dụng `z.string().email()`, sẽ từ chối chuỗi không có `@` như `admin01`.
* **Giải pháp:**
  * Cập nhật `loginSchema` trong `src/lib/auth.ts`:
    ```typescript
    const loginSchema = z.object({
      email: z.string().min(3),
      password: z.string().min(6),
    });
    ```
  * Truy vấn database hỗ trợ cả `admin01` lẫn địa chỉ email:
    ```typescript
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: parsed.data.email.trim().toLowerCase() },
          { email: `${parsed.data.email.trim().toLowerCase()}@nexus.hcmus.edu.vn` },
        ],
      },
    });
    ```
* **Tài khoản Admin mặc định duy nhất:**
  * `email`: `admin01`
  * `fullName`: `Quản Trị Viên Học Thuật (Admin)`
  * `role`: `ADMIN`
  * `status`: `ACTIVE`
  * Mật khẩu mã hóa bcrypt: `admin123`

### 2.2. Giao diện Đăng nhập Tinh giản & Chuyên nghiệp
* Loại bỏ hoàn toàn khối 3 tài khoản giả lập và nút 1-click test trong `src/app/login/login-form.tsx`.
* Giữ form đăng nhập thanh lịch, tập trung:
  * Trường "Tên đăng nhập hoặc Email" (hỗ trợ nhập `admin01` hoặc email).
  * Trường "Mật khẩu" với nút ẩn/hiện mật khẩu.
  * Thông báo hướng dẫn: Tài khoản do Thầy chủ nhiệm / Admin cấp phát trực tiếp.

### 2.3. Tính năng Admin Tạo Tài Khoản Mới (`/admin/members`)
* Nút bấm **"Tạo Tài Khoản Thành Viên"** kích hoạt `AdminCreateMemberModal`.
* Form tạo bao gồm:
  * **Họ và tên:** (Bắt buộc, VD: Nguyễn Văn A)
  * **Email / Tên đăng nhập:** (Bắt buộc, VD: `22120001@student.hcmus.edu.vn` hoặc `nguyenvana`)
  * **Mã số sinh viên:** (Tùy chọn, VD: `22120001`)
  * **Vai trò ban đầu:** `MEMBER` (Thành viên thường) hoặc `CORE_MEMBER` (Thành viên nòng cốt nộp bài)
  * **Mật khẩu khởi tạo:** (Mặc định gợi ý `member123`, tối thiểu 6 ký tự)
* Server Action: `createMemberAction(adminId, data)`
  * Xác thực quyền `ADMIN` của caller.
  * Kiểm tra trùng lặp email/username.
  * Băm mật khẩu bằng `bcrypt.hash(password, 10)`.
  * Khởi tạo bản ghi với `status: 'ACTIVE'`.

### 2.4. Tính năng Xóa Tài Khoản Thành Viên (`deleteMemberAction`)
* Nút bấm **"Xóa"** với icon thùng rác và hộp thoại xác nhận `AdminDeleteMemberModal`.
* Hiển thị cảnh báo rõ ràng kèm thông tin họ tên, email, MSSV của tài khoản cần xóa.
* Cơ chế bảo vệ an toàn (Safety Guardrails):
  * **Chống tự xóa:** Admin không thể tự xóa tài khoản của chính mình (`adminId === targetUserId`).
  * **Bảo vệ tài khoản Quản trị:** Hệ thống từ chối xóa bất kỳ tài khoản nào mang vai trò `ADMIN`.
  * **Xử lý ràng buộc cơ sở dữ liệu:** Tận dụng cascade delete cho tài liệu/liên kết do thành viên tạo, đồng thời set `userId: null` trong danh sách đóng góp để bảo toàn bài báo đã xuất bản của nhóm.

### 2.5. Bổ Nhiệm & Nâng Cấp Core Member (`updateUserRoleAction`)
* Nút chuyển đổi trạng thái `AdminRoleToggle` cho phép nâng lên `CORE_MEMBER` hoặc hạ xuống `MEMBER` tức thời.
* Thành viên sau khi được nâng cấp lên `CORE_MEMBER` sẽ có quyền truy cập vào chức năng tạo và nộp đề tài/công trình nghiên cứu.

### 2.6. Ma Trận Phân Quyền Nghiêm Ngặt (Strict RBAC Matrix)

| Chức Năng / Thẩm Quyền | GUEST (Khách) | MEMBER (Thành viên thường) | CORE_MEMBER (Thành viên nòng cốt) | ADMIN (Thầy Cố vấn / QTV) |
|---|:---:|:---:|:---:|:---:|
| Xem công trình đã xuất bản & trích dẫn BibTeX | ✅ | ✅ | ✅ | ✅ |
| Xem hồ sơ cá nhân / Scholar Portfolio | ❌ | ✅ | ✅ | ✅ |
| Tạo bản nháp & Nộp bài nghiên cứu đại diện nhóm | ❌ | ❌ | ✅ | ❌ *(Chỉ duyệt)* |
| Quản lý vòng đời bài nộp của nhóm mình | ❌ | ❌ | ✅ | ❌ *(Chỉ duyệt)* |
| Duyệt / Từ chối / Yêu cầu chỉnh sửa bài nộp | ❌ | ❌ | ❌ | ✅ |
| Tạo tài khoản thành viên mới | ❌ | ❌ | ❌ | ✅ |
| Nâng cấp / Hạ cấp Core Member | ❌ | ❌ | ❌ | ✅ |
| Xóa tài khoản thành viên khỏi CLB | ❌ | ❌ | ❌ | ✅ |

---

## 3. Thiết Kế UI/UX Môi Trường Nghiên Cứu (Academic Research Lab)

### 3.1. Thiết Kế Typography & Hệ Thống Màu Sắc
* **Font chữ:**
  * Headings, Paper Titles, Abstract: `Crimson Pro` (Google Fonts, serif cổ điển, chuẩn học thuật).
  * UI Navigation, Buttons, Cards, Forms: `Inter` (sans-serif rõ ràng, sạch sẽ, tỉ lệ chuẩn).
  * Citation Blocks, DOI, BibTeX, Code: `JetBrains Mono` (monospace lập trình & trích dẫn).
* **Bảng màu học thuật (Academic Tokens):**
  * Primary: Deep Navy `#0F294A` (màu trường ĐHQG-HCM, tượng trưng cho chiều sâu học thuật).
  * Accent / Award: Scholar Gold/Amber `#B45309` / `#D97706` (giải thưởng, vinh danh).
  * Emerald: Lab Innovation `#059669` (dự án, mã nguồn mở).
  * Background: Slate Ivory `#F8FAFC`, bề mặt Paper White `#FFFFFF`.
  * Muted: `#64748B`, Border: `#E2E8F0`.

### 3.2. Tính Năng Trích Dẫn Khoa Học 1-Click (BibTeX & Citation Modal)
* Trên trang chi tiết công trình (`/showcase/[slug]`) và thẻ bài viết (`ShowcaseCard`):
  * Thêm nút **"Trích dẫn / Cite"** với icon `Quote` / `BookOpen`.
  * Mở Modal hiển thị:
    * **Tab BibTeX:** Cú pháp chuẩn `@article{...}` hoặc `@inproceedings{...}` kèm tên tác giả, tiêu đề, năm, hội nghị (`issuer`), URL. Nút "Sao chép BibTeX" (Copy 1-click với thông báo Copied).
    * **Tab APA 7th:** Format trích dẫn chuẩn tâm lý & khoa học xã hội.
    * **Tab IEEE:** Format chuẩn hội kỹ sư điện & máy tính quốc tế.
    * Nút "Tải file .bib".

### 3.3. Khối Hiển Thị Toàn Văn & Tài Liệu PDF (Full-text PDF & Attachments)
* Cập nhật `src/app/showcase/[slug]/page.tsx`:
  * Hiển thị section **"Tài Liệu Toàn Văn & Phụ Lục Nghiên Cứu"**.
  * Liệt kê các tài liệu PDF kèm thông tin dung lượng file (KB/MB), định dạng MIME.
  * Các nút hành động: "Đọc trực tuyến" và "Tải về máy".
* Cập nhật `src/components/item-form.tsx`:
  * Bổ sung vùng upload tài liệu toàn văn PDF (tận dụng endpoint `/api/upload` đã hỗ trợ type `pdf`).
  * Lưu danh sách attachment vào database khi bài viết được khởi tạo.

### 3.4. Bộ Lọc Lĩnh Vực Nghiên Cứu (Research Domains / Topics)
* Bổ sung các nhóm lĩnh vực học thuật tiêu biểu:
  * Tất cả lĩnh vực (All Domains)
  * Trí tuệ Nhân tạo & Thị giác Máy tính (AI & Computer Vision)
  * Xử lý Ngôn ngữ Tự nhiên & LLM (NLP & Large Language Models)
  * AI Y tế & Chẩn đoán Hình ảnh (Healthcare AI)
  * Hệ thống Nhúng, IoT & Edge Computing
  * Kỹ thuật Phần mềm & Mạng máy tính (Software Systems)
* Tích hợp thanh lọc chủ đề mượt mà trên trang chủ.

### 3.5. Universal Academic Footer
* Tạo component `src/components/academic-footer.tsx` sử dụng trên tất cả các trang (`/`, `/showcase/[slug]`, `/members/[id]`, `/dashboard`, `/admin`):
  * Logo và tên chính thức: **Nexus Academic Showcase — CLB Học thuật Nexus**.
  * Đơn vị chủ quản: **Khoa Công nghệ Thông tin, Trường ĐH Khoa học Tự nhiên - ĐHQG-HCM**.
  * Địa chỉ: 227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh.
  * Liên kết học thuật: Cổng FIT HCMUS, Google Scholar Profile, GitHub Academic Org.

### 3.6. Trang Hồ Sơ Thành Viên Học Thuật (Scholar Portfolio)
* Nâng cấp `/members/[id]`:
  * 3 thẻ thống kê chỉ số học thuật: Số bài báo nghiên cứu, Số dự án công nghệ, Số giải thưởng đạt được.
  * Huy hiệu vai trò học thuật: Giảng viên hướng dẫn (`ADVISOR`), Trưởng nhóm nghiên cứu (`LEAD`), Tác giả chính (`FIRST_AUTHOR`).
  * Danh sách công trình phân nhóm mạch lạc, trình bày theo cấu trúc trích dẫn học thuật.

---

## 4. Kế Hoạch Triển Khai Chi Tiết (Implementation Stages)

1. **Giai đoạn 1: Chuẩn hóa Xác thực & Loại bỏ Mock Data**
   - Cập nhật `auth.ts` hỗ trợ tên đăng nhập `admin01`.
   - Làm sạch `seed.ts`, chỉ giữ lại duy nhất 1 tài khoản Admin `admin01` / `admin123`.
   - Viết server action `createMemberAction` trong `admin-actions.ts`.
   - Làm lại giao diện `login-form.tsx`, loại bỏ các nút giả lập mock accounts.
2. **Giai đoạn 2: Bổ sung Quản lý Tạo Thành viên cho Admin**
   - Thiết kế Modal và Form "Tạo Tài Khoản Thành Viên Mới" trên trang `/admin/members`.
   - Tích hợp gọi action `createMemberAction`, xử lý validation và hiển thị tức thì.
3. **Giai đoạn 3: Typography & Academic Design Tokens**
   - Cập nhật `globals.css` và `tailwind.config.ts` nạp Google Fonts `Crimson Pro`, `Inter`, `JetBrains Mono`.
   - Cấu hình bảng màu Institutional Deep Navy và các biến CSS học thuật.
4. **Giai đoạn 4: Tính năng Học thuật Chuyên sâu**
   - Xây dựng component `CitationModal` (BibTeX, APA, IEEE format).
   - Cập nhật trang chi tiết `/showcase/[slug]` hiển thị nút Trích dẫn, khối PDF đính kèm.
   - Nâng cấp `item-form.tsx` và `showcase-actions.ts` hỗ trợ upload file PDF đính kèm.
5. **Giai đoạn 5: Universal Footer & Scholar Profile**
   - Tạo `AcademicFooter` và tích hợp vào Layout / các trang.
   - Hoàn thiện trang `/members/[id]` với Academic Metrics.
   - Thêm bộ lọc Topic/Domain trên trang chủ.
6. **Giai đoạn 6: Phân Quyền Nghiêm Ngặt (Strict RBAC) & Hoàn Thiện Quản Lý Thành Viên** (ĐÃ HOÀN TẤT)
   - Cấm Admin nộp bài trực tiếp (`canUserUpload` chỉ cấp phép duy nhất cho `CORE_MEMBER`).
   - Xây dựng server action `deleteMemberAction` an toàn, chống tự xóa tài khoản Admin.
   - Xây dựng modal xác nhận xóa `AdminDeleteMemberModal` và bảng dữ liệu tương tác `AdminMemberTable` (tìm kiếm, lọc vai trò).
   - Thêm liên kết điều hướng trực tiếp trên thanh Navbar cho Admin ("Duyệt bài", "Thành viên", "Bàn làm việc").
7. **Giai đoạn 7: Kiểm Thử Toàn Diện & Nghiệm Thu Hệ Thống** (ĐÃ HOÀN TẤT)
   - Chạy toàn bộ 32 tests (12 test suites unit/integration/e2e) đạt 100% Pass.
   - Kiểm tra `npm run build` thành công trên toàn bộ 11 routes, 0 lỗi kiểu dữ liệu và 0 cảnh báo.
   - Tài khoản hạt nhân duy nhất: `admin01` / `admin123`. Sẵn sàng bàn giao vận hành thực tế.
