# Academic Lab Portal Homepage Implementation Plan

> **For Engineer Reference:**
> - User Goal: Chuyển đổi trang chủ thành Cổng Viện Nghiên Cứu Khoa Học (Academic Lab Portal), hiển thị bài báo khoa học bằng layout ngang (Bibliography) chuẩn mực, dự án robot tiêu biểu, và các hub chuyên mục.
> - Spec: `docs/superpowers/specs/2026-10-14-academic-lab-portal-homepage-design.md`

---

## Proposed Changes

### `src/app/page.tsx`
- Giữ nguyên Hero Section với Panel thương hiệu `#0F294A` và Tiêu đề học thuật.
- Đặt ô tìm kiếm trung tâm ngay bên dưới mô tả Hero.
- Query dữ liệu phân cấp:
  1. `researchPapers`: 3–4 bài báo xuất bản mới nhất (`type: 'RESEARCH_PAPER'`).
  2. `roboticsProjects`: 3–4 dự án công nghệ mới nhất (`type: 'PROJECT'`).
  3. `totalPapersCount`, `totalProjectsCount`: số lượng để hiển thị trên nút "Xem tất cả (N) →".
- Nếu có `searchQuery`:
  - Hiển thị danh sách kết quả tìm kiếm theo layout ngang học thuật.
- Nếu không có `searchQuery`:
  - **Khối 1**: Công trình & Bài báo khoa học xuất bản mới nhất (Hiển thị theo Layout ngang Bibliography cực đẹp với `CitationModal`, link bài báo gốc, tác giả, abstract).
  - **Khối 2**: Dự án Robotics & Hệ thống nhúng tiêu biểu (Hiển thị thẻ dự án công nghệ với liên kết demo/github).
  - **Khối 3**: Cột mốc & Trung tâm tài nguyên mở (Cards điều hướng nhanh tới `/category/tap-du-lieu-ai` và `/category/vinh-danh-giai-thuong`).

### `tests/unit/home-page-query.test.ts`
- Bổ sung unit tests kiểm tra:
  1. Có Khối bài báo khoa học xuất bản với layout ngang và CitationModal.
  2. Có Khối dự án Robotics & IoT tiêu biểu.
  3. Có các liên kết điều hướng sang `/category/bai-bao-khoa-hoc` và `/category/robotics-iot`.
  4. Không còn các thẻ `ShowcaseCard` 16:9 cồng kềnh trên trang chủ.

---

## Verification Plan

### Automated Tests
- Unit tests: `npm run test:unit`
- TypeScript: `npx tsc --noEmit`
- Next.js Build: `npm run build`

### Manual Verification
- Truy cập trang chủ `/`: Kiểm tra giao diện hiển thị 3 khối phân khu chuẩn Cổng Viện Nghiên Cứu.
- Kiểm tra bài báo khoa học hiển thị dạng ngang, bấm nút Trích dẫn BibTeX mở modal thành công.
- Kiểm tra nút "Xem tất cả bài báo →" chuyển đến `/category/bai-bao-khoa-hoc`.
- Kiểm tra ô tìm kiếm: Gõ từ khóa bấm Tìm, hiển thị danh sách kết quả dạng ngang.
