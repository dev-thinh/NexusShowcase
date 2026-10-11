# NEXUS SHOWCASE - BỘ QUY CHUẨN THIẾT KẾ UI/UX (DESIGN SYSTEM RULES)
> **Phiên bản:** 1.1.0  
> **Áp dụng:** Toàn bộ hệ thống NexusShowcase (Khoa CNTT - ĐH Khoa học Tự nhiên, ĐHQG-HCM)  
> **Nguyên tắc cốt lõi:** THỐNG NHẤT - RÕ RÀNG - KHOÁNG ĐẠT - DỄ SỬ DỤNG (Swiss Modernism Academic Theme)

---

## 1. NGUYÊN TẮC BẤT DI BẤT DỊCH (CORE MANDATES)

1. **Tuyệt đối KHÔNG sử dụng Emoji:**
   - Không được dùng bất kỳ emoji nào trong code giao diện, văn bản hệ thống, nút bấm hay tiêu đề.
   - Toàn bộ biểu tượng trực quan PHẢI dùng chung thư viện duy nhất: **Lucide React (`lucide-react`)**.
   - Mọi ký tự mũi tên thô sơ (như `→`, `<-`, `>>`) phải dùng icon Lucide tương ứng (`ArrowRight`, `ChevronRight`).

2. **Hệ thống Nền & Màu Sắc Học thuật (Academic Theme):**
   - **Màu nền chống chói (Soft Ambient Background):** Sử dụng tone màu xám học thuật trầm ấm `#EDF2F7` kết hợp với họa tiết chấm lưới kỹ thuật blueprint vi mô (`radial-gradient(#CBD5E1 0.85px)` tại bước nhảy 28px). Tuyệt đối không dùng nền trắng thuần gây chói mắt.
   - **Bề mặt Khối/Thẻ:** Sử dụng `bg-white` nổi bật tương phản nhẹ trên nền dot mesh.
   - **Primary Navy:** Màu xanh hải quân đậm chuyên sâu nghiên cứu (`#0F294A` / `navy-900`, hover `#1A3E6B`).
   - **Borders:** Toàn bộ thẻ, bảng, form, modal phải có đường viền rõ ràng `border border-slate-200`.
   - **Accent/Scholar Gold:** Màu hổ phách/vàng học thuật (`#B45309`, `amber-600`) cho giải thưởng, vinh danh, khu vực duyệt bài.
   - **Semantic Status Tokens:**
     - Đã xuất bản (PUBLISHED): `emerald` (`bg-emerald-50 text-emerald-800 border-emerald-200`).
     - Chờ duyệt (PENDING_REVIEW): `amber` (`bg-amber-50 text-amber-900 border-amber-200`).
     - Cần sửa đổi (REJECTED): `rose` (`bg-rose-50 text-rose-800 border-rose-200`).
     - Bản nháp (DRAFT): `slate` (`bg-slate-100 text-slate-800 border-slate-200`).

3. **Thanh Điều Hướng Động (Dynamic Active Navigation):**
   - Thanh điều hướng trên cùng (`NavbarNav`) bắt buộc phải nhận biết và làm nổi bật chính xác tab đang truy cập thông qua `usePathname()`.
   - **Kích thước Panel đồng bộ:** Toàn bộ các card/panel nút bấm trên thanh điều hướng đều được chuẩn hóa chiều cao `h-10` và `rounded-xl`.
   - **Màu sắc Tab Đang Hoạt Động (Focus/Active Tab):** Sử dụng tone màu xanh hải quân học thuật trầm ấm `#1A426F` (kèm viền `border-[#28578E]` và `shadow-xs`). Tone màu này sáng hơn nền đen chìm `#0F294A`, giữ được chiều sâu học thuật trang nhã và làm nổi bật rõ ràng vị trí trang.
   - **Phân biệt Nút Đăng nhập cho Khách (Guest State):** Nút Đăng nhập của khách sử dụng bề mặt thẻ trắng sáng `bg-white border-slate-300 text-slate-800` để phân tách hoàn toàn với nút Khám phá đang kích hoạt (Active tab `#1A426F`).

4. **Bố Cục Khoáng Đạt, Không Bị Thụt Quá Sâu (Wide Layout Rhythm):**
   - Chiều rộng layout chính của hệ thống được chuẩn hóa tại `max-w-7xl` kết hợp khoảng đệm biên linh hoạt `px-4 sm:px-6 lg:px-8`.
   - Không được bó layout quá hẹp vào giữa màn hình gây lãng phí khoảng trống hai bên.
   - Trang chi tiết công trình chuẩn hóa tại `max-w-6xl` để giữ độ dài dòng đọc lý tưởng (measure length) nhưng không bị gò bó.

5. **Phông Chữ Rõ Nét & Thang Kích Cỡ Dễ Đọc (Font Scale):**
   - Không dùng font quá bé (`text-[10px]` hay `text-[11px]` cho nội dung đọc).
   - **Base Font:** 15px - 16px cho trải nghiệm đọc thoải mái nhất.
   - **H1 (Page Title):** `font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900`
   - **H2 (Section Header):** `font-serif text-lg sm:text-xl font-bold text-slate-900`
   - **H3 (Card Title):** `font-serif text-lg sm:text-xl font-bold text-slate-900 line-clamp-2 leading-snug`
   - **Body Text:** `font-sans text-sm sm:text-base text-slate-600 leading-relaxed`
   - **Microcopy / Meta:** `font-sans text-xs sm:text-sm text-slate-500 font-medium`

6. **Ngôn Ngữ Giao Diện Tinh Gọn (Concise Microcopy):**
   - Loại bỏ các câu hướng dẫn thừa thãi, rườm rà mang tính chất cầm tay chỉ việc.
   - Dùng các nhãn (label) và tiêu đề trực diện, tự giải thích (self-explanatory), chuẩn phong cách học thuật quốc tế.

7. **Đầy đủ 100% Trạng Thái (States Coverage):**
   - Mọi trang phải có đầy đủ: Default, Hover, Active, Focus-visible, Loading (blocking with `Loader2`), Skeleton và Empty State (`EmptyState` component).

---

## 2. BẢNG TRA CỨU COMPONENT & CLASS TIÊU CHUẨN

| Thành phần | Class chuẩn Tailwind |
| :--- | :--- |
| **Nền trang chính** | `min-h-screen flex flex-col font-sans text-slate-900` (kết hợp CSS dot mesh) |
| **Container chính** | `container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl` |
| **Thẻ Card chuẩn** | `bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all` |
| **Nút bấm Chính (Primary Button)** | `px-4 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#1A3E6B] active:scale-[0.98] text-white text-sm font-bold transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed` |
| **Ô nhập liệu (Input / Select / Textarea)** | `px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F294A] focus:border-transparent transition-all` |
| **Tab điều hướng chủ động** | `h-10 px-4 rounded-xl bg-[#1A426F] text-white border border-[#28578E] shadow-xs font-bold` (Active) / `h-10 px-4 rounded-xl text-slate-700 hover:text-[#1A426F] hover:bg-slate-200/70 font-semibold` (Inactive) |
| **Hộp thông báo (Callout / Guidance)** | `p-3.5 rounded-xl border text-sm flex items-start gap-2.5` |
| **Modal Box** | `bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden` |

---

## 3. CHECKLIST KIỂM DUYỆT (PR CHECKLIST)

- [ ] Không có ký tự Emoji nào trong code.
- [ ] Không dùng mũi tên thô `->` hay `→` trong text; dùng icon Lucide `ArrowRight` hoặc `ChevronRight`.
- [ ] Bố cục trang sử dụng `max-w-7xl` (hoặc `max-w-6xl` cho bài đọc), không bị thụt vào quá hẹp.
- [ ] Thanh navbar hiển thị chính xác tab active khi chuyển trang.
- [ ] Nền trang áp dụng họa tiết chấm lưới học thuật chống chói mắt.
- [ ] Cỡ chữ nội dung đạt chuẩn `text-sm` đến `text-base`, tiêu đề đạt chuẩn `font-serif text-lg` trở lên.
- [ ] Văn bản hướng dẫn súc tích, không rườm rà.
- [ ] Đầy đủ trạng thái Loading skeleton và Empty state.
