# Thiết Kế Trang Chủ Cổng Viện Nghiên Cứu Khoa Học (Academic Lab Portal)

- **Ngày tạo**: 14/10/2026
- **Trạng thái**: Bản thảo thiết kế chờ duyệt (Pending User Review)
- **Hệ thống**: Robotics & IoT Lab — Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM

---

## 1. Bối cảnh & Vấn đề cần giải quyết

### 1.1. Hiện trạng
Trang chủ (`src/app/page.tsx`) trước đây hiển thị toàn bộ công trình trong một lưới 3 cột dọc (`ShowcaseCard`) với khung hình ảnh 16:9 cỡ lớn.

### 1.2. Nhược điểm
1. **Phá vỡ tính chất học thuật**: Các bài báo khoa học bị ép vào khung ảnh 16:9 giống blog tin tức hoặc sản phẩm e-commerce. Khi bài không có ảnh, khung placeholder xám trông thiếu chuyên nghiệp.
2. **Không khai thác được layout chuyên biệt**: Trong hệ thống, trang chuyên mục (`src/app/category/[slug]`) đã có layout ngang chuẩn mực (`BIBLIOGRAPHY`) cực kỳ đẹp và trang trọng, nhưng trang chủ lại ép dùng một loại thẻ chung làm giảm trải nghiệm đọc.
3. **Mục tiêu mới**: Chuyển đổi trang chủ thành **Cổng thông tin nghiên cứu khoa học (Academic Lab Portal)** chuẩn mực theo mô hình các viện nghiên cứu lớn (MIT CSAIL, Stanford AI Lab, Berkeley BAIR).

---

## 2. Kiến trúc & Cấu trúc Trang chủ mới

Trang chủ sẽ được tổ chức thành 4 phân khu chính:

### 2.1. Khu vực Hero & Thanh Tra cứu Trung tâm (Header & Central Search)
- **Panel thương hiệu**:
  - Khung ngoài: `rounded-xl bg-white border border-slate-200 shadow-xs`.
  - Chip nhận diện: `rounded-lg bg-[#0F294A] text-white font-bold` có đèn LED xanh ngọc (`bg-emerald-400 animate-pulse`).
  - Đơn vị chủ quản: `Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM`.
- **Tiêu đề học thuật**:
  - `Nghiên Cứu Khoa Học & Công Nghệ Robotics · IoT`.
- **Mô tả ngắn**:
  - Giới thiệu không gian công bố nghiên cứu của CLB Robotics & IoT HCMUS.
- **Thanh tìm kiếm học thuật trung tâm**:
  - Đặt ngay dưới tiêu đề, hỗ trợ tra cứu bài báo, dự án, robot, tác giả theo từ khóa.

### 2.2. Chế độ Tìm kiếm (Search Mode - khi có `?q=...`)
- Khi người dùng thực hiện tìm kiếm:
  - Hiển thị thanh thông báo từ khóa tìm kiếm kèm nút "Xóa bộ lọc".
  - Hiển thị danh sách kết quả tìm kiếm theo **Layout ngang học thuật**.

### 2.3. Chế độ Mặc định: 3 Phân khu Chuyên đề Chuẩn mực (Portal Sections)

#### Khối 1: Công Trình & Bài Báo Khoa Học Mới Xuất Bản (Recent Research Papers)
- **Tiêu đề phân khu**:
  - Icon: `BookOpen`.
  - Tiêu đề: `Công Trình & Bài Báo Khoa Học Xuất Bản`.
  - Mô tả: Các công trình nghiên cứu khoa học công bố tại hội thảo và tạp chí chuyên ngành.
  - Liên kết điều hướng: `Xem toàn bộ bài báo (N) →` dẫn tới `/category/bai-bao-khoa-hoc`.
- **Định dạng hiển thị**:
  - Áp dụng chuẩn **Layout ngang học thuật (Bibliography Layout)**:
    - Chip phân loại công trình (`TypeBadge`).
    - Năm xuất bản & Nơi công bố / Đơn vị tổ chức (`issuer`).
    - Tiêu đề bài báo lớn, trang trọng, click xem chi tiết.
    - Dòng tác giả đầy đủ: `Tác giả: Nguyễn Văn A, GVHD: TS. Trần Văn B...`.
    - Tóm tắt khoa học (Abstract) rõ ràng, chỉn chu (3 dòng).
    - Bộ công cụ học thuật: Nút **Trích dẫn BibTeX (`CitationModal`)**, Nút **Bài báo gốc**, Nút **Xem chi tiết**.

#### Khối 2: Dự Án Kỹ Thuật Robotics & Hệ Thống Nhúng Tiêu Biểu (Featured Robotics & IoT)
- **Tiêu đề phân khu**:
  - Icon: `Bot`.
  - Tiêu đề: `Dự Án Robotics & Hệ Thống Nhúng Tiêu Biểu`.
  - Mô tả: Hệ thống robot tự hành, phần cứng nhúng và giải pháp công nghệ của sinh viên CLB.
  - Liên kết điều hướng: `Xem toàn bộ dự án (N) →` dẫn tới `/category/robotics-iot`.
- **Định dạng hiển thị**:
  - Hiển thị 2–3 dự án tiêu biểu mới nhất với thông tin kỹ thuật, mã nguồn GitHub / Demo, và hình ảnh mô hình robot (nếu có).

#### Khối 3: Cột Mốc & Trung Tâm Tài Nguyên Mở (Open Resources & Highlights)
- Khối liên kết nhanh tới:
  - **Tập dữ liệu & AI Model mở**: Dẫn tới `/category/tap-du-lieu-ai`.
  - **Bảng vàng Thành tích & Giải thưởng**: Dẫn tới `/category/vinh-danh-giai-thuong`.
  - Thống kê các cột mốc nghiên cứu của Lab.

---

## 3. Kế hoạch Kiểm thử & Đảm bảo Chất lượng (QA)
- **Unit Tests**: Cập nhật file `tests/unit/home-page-query.test.ts` để kiểm thử cấu trúc phân khu Cổng Viện Nghiên Cứu, đảm bảo các link chuyên mục và layout ngang hoạt động chính xác.
- **TypeScript**: Biên dịch không lỗi (`npx tsc --noEmit`).
- **Build**: `next build` hoàn tất 100% không cảnh báo.
