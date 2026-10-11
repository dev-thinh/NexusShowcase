# Đặc tả thiết kế: Thanh cuộn phim công trình tiêu biểu & Quản lý ghim bài của Admin
# (Featured Showcase Filmstrip Carousel & Admin Pin Management)

- **Ngày tạo**: 2026-10-11
- **Trạng thái**: Đã duyệt (Approved)
- **Tác giả / Phụ trách**: Antigravity & Người dùng

---

## 1. Bối cảnh & Mục tiêu

Trang Khám phá (`/`, `src/app/page.tsx`) hiện tại có khối thống kê tổng quan (Institutional Stats Counters: Bài báo khoa học, Dự án công nghệ, Giải thưởng) và đi thẳng vào bộ lọc danh sách. Để nâng cao tính học thuật, tôn vinh các công trình xuất sắc nhất của CLB Nexus và tạo ấn tượng thị giác chuyên nghiệp, hệ thống cần bổ sung:
1. **Thanh cuộn phim công trình tiêu biểu (Academic Infinite Filmstrip Carousel)**:
   - Nằm ngay bên dưới khối đếm số lượng công trình và ngay phía trên thanh bộ lọc.
   - Hiển thị tối đa 10 công trình nổi bật nhất.
   - Hiệu ứng cuộn ngang liên tục dạng thước phim (filmstrip track), tự động dừng và phóng to thẻ bài khi người dùng rê chuột vào, click vào thẻ để mở trang chi tiết bài báo/dự án.
2. **Quy tắc bù đắp thông minh (Smart Hybrid Fill)**:
   - Ưu tiên hiển thị các bài được Admin ghim (`isPinned = true`).
   - Nếu số bài ghim rỗng (0 bài) hoặc ít hơn 10 bài: Tự động bù thêm các bài xuất bản mới nhất (`status = PUBLISHED`) cho đủ tối đa 10 thẻ.
   - Nếu tổng số bài trong cơ sở dữ liệu quá ít (< 4 bài): Hiển thị dạng lưới tĩnh (Static Highlight Grid) thay vì cuộn chạy.
3. **Cơ chế quản trị của Admin (Admin Pin Management)**:
   - Admin có thể Ghim / Bỏ ghim công trình trực tiếp từ trang chi tiết `/showcase/[slug]`.
   - Cơ chế giới hạn 10 bài theo quy tắc FIFO (First-In, First-Out): Khi đã có đủ 10 bài ghim, ghim thêm bài thứ 11 sẽ tự động gỡ ghim bài cũ nhất.
   - Khu vực quản lý danh sách các bài đang ghim trong trang Quản trị Admin.

---

## 2. Mô hình Dữ liệu (Database Schema)

Cập nhật model `ShowcaseItem` trong `prisma/schema.prisma`:

```prisma
model ShowcaseItem {
  id              String            @id @default(cuid())
  title           String
  slug            String            @unique
  summary         String
  content         String?
  type            ItemType
  scope           ItemScope?
  issuer          String?
  thumbnailUrl    String?
  status          ItemStatus        @default(DRAFT)
  rejectionReason String?
  publishedYear   Int
  publishedAt     DateTime?
  isPinned        Boolean           @default(false)
  pinnedAt        DateTime?
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
  @@index([isPinned, status])
  @@map("showcase_items")
}
```

---

## 3. Quy tắc nghiệp vụ & Server Actions

### 3.1. Server Action: `togglePinShowcaseItemAction(itemId: string)`
- **Xác thực quyền (RBAC)**: Chỉ người dùng có phiên đăng nhập hợp lệ và `role === 'ADMIN'` mới được thực hiện. Ném lỗi unauthorized nếu là `CORE_MEMBER` hoặc `GUEST`.
- **Trường hợp bỏ ghim (`isPinned === true`)**:
  - Cập nhật bài thành `isPinned: false, pinnedAt: null`.
  - Trả về `{ success: true, isPinned: false, message: 'Đã gỡ ghim khỏi trang chủ' }`.
- **Trường hợp ghim (`isPinned === false`)**:
  - Kiểm tra trạng thái bài: Phải là `status === 'PUBLISHED'`.
  - Đếm số bài hiện đang có `isPinned: true, status: 'PUBLISHED'`.
  - Nếu số bài $\ge 10$: Tìm bài có `pinnedAt` cũ nhất (hoặc `updatedAt` cũ nhất), cập nhật bài đó thành `isPinned: false, pinnedAt: null` (FIFO Eviction).
  - Cập nhật bài được chọn: `isPinned: true, pinnedAt: new Date()`.
  - Trả về `{ success: true, isPinned: true, message: 'Đã ghim bài lên trang chủ (Tối đa 10 bài)' }`.
- **Đồng bộ bộ nhớ đệm (Cache Revalidation)**:
  - `revalidatePath('/')` (cập nhật thanh cuộn phim trang chủ).
  - `revalidatePath('/showcase/[slug]')` (cập nhật trạng thái nút ghim trang chi tiết).
  - `revalidatePath('/admin')` & `revalidatePath('/admin/featured')`.

### 3.2. Truy vấn dữ liệu hiển thị trên trang chủ (`src/app/page.tsx`)
```ts
// 1. Lấy tối đa 10 bài được ghim trước
const pinnedItems = await prisma.showcaseItem.findMany({
  where: { status: 'PUBLISHED', isPinned: true },
  include: {
    contributors: {
      include: { user: true },
      orderBy: { displayOrder: 'asc' },
    },
  },
  orderBy: { pinnedAt: 'desc' },
  take: 10,
});

// 2. Tính số lượng cần bù thêm (nếu < 10)
const needed = 10 - pinnedItems.length;
let fillItems: typeof pinnedItems = [];

if (needed > 0) {
  const pinnedIds = pinnedItems.map((item) => item.id);
  fillItems = await prisma.showcaseItem.findMany({
    where: {
      status: 'PUBLISHED',
      id: { notIn: pinnedIds },
    },
    include: {
      contributors: {
        include: { user: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
    orderBy: [{ publishedYear: 'desc' }, { createdAt: 'desc' }],
    take: needed,
  });
}

// 3. Hợp nhất danh sách: các bài ghim đứng trước, bài bù đắp đứng sau
const filmstripItems = [...pinnedItems, ...fillItems];
```

---

## 4. Thiết kế Giao diện (UI/UX Specification)

Tuân thủ nghiêm ngặt theo tiêu chuẩn [`UI_DESIGN_RULES.md`](file:///D:/HCMUS/NexusShowcase/UI_DESIGN_RULES.md):
- Tone màu học thuật: Oxford Navy `#0F294A`, Academic Blue `#1A426F`, viền `border-slate-200`.
- Tuyệt đối không dùng emoji; dùng 100% icon từ Lucide React (`Pin`, `Sparkles`, `Calendar`, `Building2`, `Users`, `ArrowUpRight`, `CheckCircle2`, `Layers`).

### 4.1. Cấu trúc Khung Cuộn Phim (`FeaturedFilmstrip` - `src/components/featured-filmstrip.tsx`)
- **Vị trí**: Nằm giữa Section Hero (dưới khối 3 số liệu thống kê) và Section Danh mục bộ lọc chính.
- **Tiêu đề phân đoạn (Section Header)**:
  - Huy hiệu nhỏ: `HỘI ĐỒNG HỌC THUẬT TUYỂN CHỌN` (nền trắng/slate-100, viền slate-200, icon `Sparkles` màu hổ phách/navy).
  - Tiêu đề chính font Serif: *"Công Trình Nghiên Cứu &amp; Sáng Tạo Tiêu Biểu"*.
  - Chú thích: *"Tuyển tập tối đa 10 công trình khoa học và dự án công nghệ xuất sắc của thành viên CLB Nexus."*
- **Hiệu ứng hai bên lề (Edge Fading Masks)**:
  - Phía trái: `absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none`.
  - Phía phải: `absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none`.
- **Chuyển động dải phim (Continuous Infinite Track)**:
  - Track chứa: Dải flex ngang render 2 lượt danh sách thẻ: `[...items, ...items]`.
  - CSS Animation: `@keyframes filmstrip-roll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`.
  - Thời lượng chu kỳ: Khoảng `50s` đến `60s`, `linear infinite`.
  - Khi hover vào bất kỳ vị trí nào trên dải cuộn: Kích hoạt `hover:[animation-play-state:paused]`, cuộn phim dừng lại ngay lập tức.
  - Khi người dùng sử dụng thiết bị cảm ứng: Hỗ trợ cuộn trượt ngang tự nhiên (horizontal touch scroll with momentum).

### 4.2. Thẻ Công trình Cuộn Phim (`FilmstripCard`)
- Kích thước thẻ cố định: `w-[320px] sm:w-[360px] h-[390px] shrink-0`.
- Hiệu ứng tương tác:
  - Mặc định: Nền trắng, viền `border-slate-200`, bo góc `rounded-2xl`, bóng đổ `shadow-xs`.
  - Hover: `scale-[1.06] -translate-y-1 z-20 relative`, đổ bóng nổi khối `shadow-2xl shadow-slate-900/15`, viền đổi sang màu `#0F294A` đậm đà.
- Nội dung bên trong thẻ:
  1. **Hình thu nhỏ (Aspect 16/9)**: Ảnh thumbnail bài báo hoặc bìa học thuật chuẩn mực.
  2. **Huy hiệu trên ảnh**:
     - Góc trái: `TypeBadge` (Bài báo khoa học, Dự án...).
     - Góc phải: Nếu bài được ghim, hiển thị huy hiệu `Được ghim` (icon `Pin` màu vàng hổ phách `text-amber-600 bg-amber-50/90 border border-amber-200`). Nếu bài tự bù đắp, hiển thị `Mới nhất`.
  3. **Thông tin xuất bản**: Năm (`Calendar`), Đơn vị/Hội nghị (`Building2`).
  4. **Tiêu đề công trình**: Font Serif đậm, tối đa 2 dòng, cắt gọn trang nhã.
  5. **Tóm tắt ngắn (Excerpt)**: 2 dòng tóm lược nội dung nghiên cứu.
  6. **Tác giả chính**: Icon `Users`, tên tác giả đầu tiên và số lượng cộng sự.
  7. **Hành động click**: Toàn bộ thẻ bọc trong thẻ `Link href="/showcase/[slug]"`, góc thẻ xuất hiện icon `ArrowUpRight` khi hover.

### 4.3. Nút Ghim/Bỏ ghim dành cho Admin (`PinButton` - `src/components/pin-toggle-button.tsx`)
- Đặt tại:
  1. **Trang chi tiết công trình (`src/app/showcase/[slug]/page.tsx`)**:
     - Nằm trong thanh hành động học thuật của Admin (cạnh nút Duyệt/Từ chối hoặc trong header).
     - Nếu đã ghim: Nút `h-11 rounded-xl` nền hổ phách/navy, icon `Pin` ("Đang ghim trang chủ • Bấm để gỡ").
     - Nếu chưa ghim: Nút `h-11 rounded-xl` nền trắng viền slate-300, icon `Pin` ("Ghim lên trang chủ").
  2. **Trang Quản trị Admin (`src/app/admin/page.tsx` hoặc widget quản lý)**:
     - Thêm khối thống kê: *"Công trình đang ghim ({pinnedCount}/10)"*.
     - Bảng hiển thị danh sách các bài đang được ghim với nút bỏ ghim 1-click.

---

## 5. Xử lý các trường hợp biên (Edge Cases & Fallbacks)

1. **Database chỉ có dưới 4 bài đã duyệt**:
   - Thay vì chạy một thanh cuộn phim với quá ít thẻ bị lặp lại thưa thớt, hệ thống chuyển sang chế độ **Lưới bài nổi bật tĩnh (Static Showcase Row/Grid)** căn giữa đẹp mắt.
2. **Admin thao tác ghim liên tiếp quá 10 bài**:
   - Hệ thống tự động thu hồi trạng thái ghim của bài cũ nhất (FIFO) trong cùng một Prisma Transaction, đảm bảo số bài `isPinned: true` không bao giờ vượt quá 10.
3. **Bài đang ghim bị đổi trạng thái từ PUBLISHED sang REJECTED hoặc DRAFT**:
   - Khi Admin từ chối hoặc chuyển trạng thái bài viết, hệ thống tự động reset `isPinned: false, pinnedAt: null`.
4. **Trình duyệt bật chế độ giảm chuyển động (`prefers-reduced-motion`)**:
   - Tắt CSS animation xoay vòng, chuyển thanh phim sang dạng thanh cuộn ngang có thanh trượt scrollbar để người dùng tự cuộn tay.

---

## 6. Kế hoạch Kiểm thử & Xác nhận (Testing & Verification)

1. **Unit & Integration Tests (Vitest)**:
   - Viết test file `tests/featured-filmstrip.test.ts`:
     - Test `togglePinShowcaseItemAction` chỉ cho phép quyền `ADMIN`.
     - Test ghim bài thành công và chuyển `isPinned: true, pinnedAt: not null`.
     - Test gỡ ghim thành công.
     - Test quy tắc FIFO: Tạo 10 bài đã ghim, khi ghim bài thứ 11 thì bài có `pinnedAt` cũ nhất tự động chuyển về `isPinned: false`.
     - Test truy vấn hybrid: Lấy đúng 10 bài với ưu tiên bài ghim + bù đắp bài mới nhất không trùng lặp.
2. **Kiểm tra hồi quy toàn diện**:
   - Chạy `npm test` để xác nhận tất cả các bài kiểm tra hiện tại (35/35) và bài kiểm tra mới đều đạt (100% green).
3. **Kiểm tra trực quan trên trình duyệt**:
   - Kiểm tra hiển thị thanh cuộn phim trên Chrome/Edge ở các kích thước Desktop (1920x1080, 1440x900) và Mobile (390x844).
   - Kiểm tra hiệu ứng dừng cuộn và phóng to thẻ bài khi rê chuột.
   - Thử nghiệm tài khoản Admin bấm Ghim / Bỏ ghim và quan sát phản hồi tức thì.
