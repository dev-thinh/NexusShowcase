# Featured Showcase Filmstrip Carousel & Admin Pin Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng thanh cuộn phim học thuật (Infinite Filmstrip Carousel) hiển thị tối đa 10 công trình tiêu biểu trên trang khám phá (`/`), tích hợp cơ chế bù đắp thông minh (Smart Hybrid Fill) và chức năng cho phép Admin ghim/bỏ ghim bài viết trực tiếp từ trang chi tiết hoặc bảng quản trị với giới hạn FIFO 10 bài.

**Architecture:** Mở rộng schema Prisma của `ShowcaseItem` với `isPinned`, `pinnedAt` và index; bổ sung Server Action `togglePinShowcaseItemAction` có kiểm soát quyền Admin và giải thuật FIFO 10 bài; triển khai component `FeaturedFilmstrip` Client/Server hybrid với CSS Keyframes seamless roll, gradient edge masks, hover pause và card magnification; tích hợp vào `src/app/page.tsx` với truy vấn hybrid; bổ sung nút `PinToggleButton` trên `src/app/showcase/[slug]/page.tsx` và khối quản lý ghim trên `src/app/admin/page.tsx`.

**Tech Stack:** Next.js 15 (App Router), React 19, Tailwind CSS 3.4, Prisma ORM (PostgreSQL), Lucide React, Vitest.

## Global Constraints
- Tuân thủ nghiêm ngặt [`UI_DESIGN_RULES.md`](file:///D:/HCMUS/NexusShowcase/UI_DESIGN_RULES.md) (v1.1.0): Oxford Navy `#0F294A` làm tone chủ đạo, điểm xuyết `#1A426F`, viền `border-slate-200`, bo góc `rounded-2xl` cho thẻ, `rounded-xl` cho nút.
- Tuyệt đối KHÔNG sử dụng emoji trong UI; 100% biểu tượng dùng Lucide React (`Pin`, `Sparkles`, `Calendar`, `Building2`, `Users`, `ArrowUpRight`, `Loader2`).
- Giới hạn ghim tối đa 10 bài: Nếu bài thứ 11 được ghim, bài có `pinnedAt` cũ nhất sẽ tự động bị bỏ ghim (FIFO).
- Không cài thêm thư viện carousel ngoài (0 new runtime dependencies) để tránh rủi ro hydration và tương thích React 19 / Next.js 15.
- Tất cả các lệnh chạy trên Windows PowerShell (dùng `;` thay vì `&&`).
- Đảm bảo toàn bộ 35 bài test hiện tại và các bài test mới luôn PASS (`npm test`).

---

### Task 1: Database Schema Migration & Prisma Setup

**Files:**
- Modify: `prisma/schema.prisma:98-115`
- Test: `tests/integration/prisma-schema.test.ts`

**Interfaces:**
- Consumes: Prisma schema hiện tại.
- Produces: Trường `isPinned Boolean @default(false)`, `pinnedAt DateTime?`, và index `@@index([isPinned, status])` trên `ShowcaseItem`.

- [ ] **Step 1: Write the failing test for new schema fields**

Thêm test case kiểm tra trường `isPinned` và `pinnedAt` trong `tests/integration/prisma-schema.test.ts`:

```typescript
it('should support isPinned and pinnedAt on showcase items', async () => {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) throw new Error('Admin user required for test');

  const item = await prisma.showcaseItem.create({
    data: {
      title: 'Bài báo kiểm tra Ghim',
      slug: `test-pin-schema-${Date.now()}`,
      summary: 'Tóm tắt bài báo kiểm tra schema ghim',
      type: 'RESEARCH_PAPER',
      publishedYear: 2026,
      status: 'PUBLISHED',
      isPinned: true,
      pinnedAt: new Date(),
      creatorId: admin.id,
    },
  });

  expect(item.isPinned).toBe(true);
  expect(item.pinnedAt).not.toBeNull();

  // Cleanup
  await prisma.showcaseItem.delete({ where: { id: item.id } });
});
```

- [ ] **Step 2: Run test to verify it fails**

Chạy:
```powershell
npx vitest run tests/integration/prisma-schema.test.ts
```
Expected: FAIL (Type error hoặc Prisma Client chưa nhận diện trường `isPinned`).

- [ ] **Step 3: Update `prisma/schema.prisma` and push to database**

Cập nhật `prisma/schema.prisma`:
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

Chạy lệnh cập nhật database và tạo lại client:
```powershell
npx prisma db push; npx prisma generate
```

- [ ] **Step 4: Run test to verify it passes**

Chạy:
```powershell
npx vitest run tests/integration/prisma-schema.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add prisma/schema.prisma tests/integration/prisma-schema.test.ts; git commit -m "feat(db): add isPinned and pinnedAt fields to ShowcaseItem schema"
```

---

### Task 2: Pinning Server Action & FIFO Eviction Logic (TDD)

**Files:**
- Create: `tests/integration/showcase-pinning.test.ts`
- Modify: `src/actions/showcase-actions.ts`

**Interfaces:**
- Consumes: `prisma.showcaseItem`, `canUserReview(admin)`.
- Produces: `togglePinShowcaseItemAction(adminId: string, itemId: string): Promise<{ success: boolean; isPinned?: boolean; error?: string; message?: string }>`

- [ ] **Step 1: Write failing tests for pinning, unpinning, FIFO 10 limit, and permissions**

Tạo file `tests/integration/showcase-pinning.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { togglePinShowcaseItemAction } from '@/actions/showcase-actions';

describe('Showcase Pinning Action', () => {
  let adminUser: any;
  let regularUser: any;
  const createdItemIds: string[] = [];

  beforeAll(async () => {
    adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: `admin-pin-${Date.now()}@nexus.hcmus.edu.vn`,
          fullName: 'Admin Pin Test',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });
    }

    regularUser = await prisma.user.create({
      data: {
        email: `member-pin-${Date.now()}@nexus.hcmus.edu.vn`,
        fullName: 'Member Pin Test',
        role: 'MEMBER',
        status: 'ACTIVE',
      },
    });
  });

  afterAll(async () => {
    if (createdItemIds.length > 0) {
      await prisma.showcaseItem.deleteMany({
        where: { id: { in: createdItemIds } },
      });
    }
  });

  it('should forbid non-admin from pinning item', async () => {
    const item = await prisma.showcaseItem.create({
      data: {
        title: 'Bài báo test quyền',
        slug: `test-pin-perm-${Date.now()}`,
        summary: 'Tóm tắt',
        type: 'RESEARCH_PAPER',
        publishedYear: 2026,
        status: 'PUBLISHED',
        creatorId: adminUser.id,
      },
    });
    createdItemIds.push(item.id);

    const result = await togglePinShowcaseItemAction(regularUser.id, item.id);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Chỉ Quản trị viên');
  });

  it('should toggle pin and unpin successfully by admin', async () => {
    const item = await prisma.showcaseItem.create({
      data: {
        title: 'Bài báo test toggle pin',
        slug: `test-pin-toggle-${Date.now()}`,
        summary: 'Tóm tắt',
        type: 'RESEARCH_PAPER',
        publishedYear: 2026,
        status: 'PUBLISHED',
        creatorId: adminUser.id,
      },
    });
    createdItemIds.push(item.id);

    // Pin
    const pinRes = await togglePinShowcaseItemAction(adminUser.id, item.id);
    expect(pinRes.success).toBe(true);
    expect(pinRes.isPinned).toBe(true);

    const pinnedItem = await prisma.showcaseItem.findUnique({ where: { id: item.id } });
    expect(pinnedItem?.isPinned).toBe(true);
    expect(pinnedItem?.pinnedAt).not.toBeNull();

    // Unpin
    const unpinRes = await togglePinShowcaseItemAction(adminUser.id, item.id);
    expect(unpinRes.success).toBe(true);
    expect(unpinRes.isPinned).toBe(false);

    const unpinnedItem = await prisma.showcaseItem.findUnique({ where: { id: item.id } });
    expect(unpinnedItem?.isPinned).toBe(false);
    expect(unpinnedItem?.pinnedAt).toBeNull();
  });

  it('should enforce FIFO eviction when pinning exceeds 10 items', async () => {
    // Reset all pinned items to ensure clean state
    await prisma.showcaseItem.updateMany({
      data: { isPinned: false, pinnedAt: null },
    });

    // Create 10 pinned items with sequential pinnedAt
    const items: any[] = [];
    const baseTime = Date.now() - 100000;
    for (let i = 0; i < 10; i++) {
      const itm = await prisma.showcaseItem.create({
        data: {
          title: `Bài báo ghim số ${i + 1}`,
          slug: `test-pin-fifo-${i}-${Date.now()}`,
          summary: `Tóm tắt số ${i + 1}`,
          type: 'RESEARCH_PAPER',
          publishedYear: 2026,
          status: 'PUBLISHED',
          isPinned: true,
          pinnedAt: new Date(baseTime + i * 1000),
          creatorId: adminUser.id,
        },
      });
      items.push(itm);
      createdItemIds.push(itm.id);
    }

    const oldestItem = items[0];

    // Create the 11th item and pin it
    const item11 = await prisma.showcaseItem.create({
      data: {
        title: 'Bài báo thứ 11 cần ghim',
        slug: `test-pin-fifo-11-${Date.now()}`,
        summary: 'Tóm tắt 11',
        type: 'RESEARCH_PAPER',
        publishedYear: 2026,
        status: 'PUBLISHED',
        isPinned: false,
        creatorId: adminUser.id,
      },
    });
    createdItemIds.push(item11.id);

    const pin11Res = await togglePinShowcaseItemAction(adminUser.id, item11.id);
    expect(pin11Res.success).toBe(true);
    expect(pin11Res.isPinned).toBe(true);

    // Oldest item must now be unpinned
    const refreshedOldest = await prisma.showcaseItem.findUnique({ where: { id: oldestItem.id } });
    expect(refreshedOldest?.isPinned).toBe(false);

    // Total pinned items count must still be exactly 10
    const totalPinned = await prisma.showcaseItem.count({
      where: { isPinned: true, status: 'PUBLISHED' },
    });
    expect(totalPinned).toBe(10);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Chạy:
```powershell
npx vitest run tests/integration/showcase-pinning.test.ts
```
Expected: FAIL with "togglePinShowcaseItemAction is not defined".

- [ ] **Step 3: Implement `togglePinShowcaseItemAction` in `src/actions/showcase-actions.ts`**

Bổ sung hàm `togglePinShowcaseItemAction` vào cuối `src/actions/showcase-actions.ts`:

```typescript
export async function togglePinShowcaseItemAction(adminId: string, itemId: string) {
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin || !canUserReview(admin)) {
    return { success: false, error: 'Chỉ Quản trị viên (Admin) mới có quyền ghim công trình lên trang chủ.' };
  }

  const targetItem = await prisma.showcaseItem.findUnique({ where: { id: itemId } });
  if (!targetItem) {
    return { success: false, error: 'Không tìm thấy công trình này.' };
  }

  if (targetItem.status !== 'PUBLISHED') {
    return { success: false, error: 'Chỉ có thể ghim các công trình đã được xuất bản (PUBLISHED).' };
  }

  if (targetItem.isPinned) {
    // Unpin item
    await prisma.showcaseItem.update({
      where: { id: itemId },
      data: { isPinned: false, pinnedAt: null },
    });
    return { success: true, isPinned: false, message: 'Đã bỏ ghim công trình khỏi trang chủ.' };
  }

  // Pin item: check limit 10 FIFO
  const pinnedItems = await prisma.showcaseItem.findMany({
    where: { isPinned: true, status: 'PUBLISHED' },
    orderBy: { pinnedAt: 'asc' },
  });

  if (pinnedItems.length >= 10) {
    const oldest = pinnedItems[0];
    await prisma.showcaseItem.update({
      where: { id: oldest.id },
      data: { isPinned: false, pinnedAt: null },
    });
  }

  await prisma.showcaseItem.update({
    where: { id: itemId },
    data: { isPinned: true, pinnedAt: new Date() },
  });

  return { success: true, isPinned: true, message: 'Đã ghim công trình lên trang chủ (Tối đa 10 bài).' };
}
```

Đồng thời trong `reviewShowcaseItemAction`: nếu action là `REJECT`, tự động gỡ ghim:
```typescript
data: {
  status: isPublish ? 'PUBLISHED' : 'REJECTED',
  publishedAt: isPublish ? new Date() : undefined,
  rejectionReason: isPublish ? null : payload.reason || 'Nội dung cần chỉnh sửa bổ sung.',
  ...(isPublish ? {} : { isPinned: false, pinnedAt: null }),
}
```

- [ ] **Step 4: Run test to verify it passes**

Chạy:
```powershell
npx vitest run tests/integration/showcase-pinning.test.ts
```
Expected: PASS (Tất cả 3 test cases đều xanh).

- [ ] **Step 5: Commit**

```powershell
git add tests/integration/showcase-pinning.test.ts src/actions/showcase-actions.ts; git commit -m "feat(actions): implement togglePinShowcaseItemAction with 10-item FIFO limit"
```

---

### Task 3: Featured Filmstrip UI Component (`FeaturedFilmstrip`)

**Files:**
- Create: `src/components/featured-filmstrip.tsx`

**Interfaces:**
- Consumes: Mảng `items` gồm tối đa 10 đối tượng `ShowcaseItem` (kèm `contributors`).
- Produces: Client component `FeaturedFilmstrip` có hiệu ứng cuộn ngang 60fps mượt mà, dừng khi rê chuột, phóng to thẻ bài được hover, và tự chuyển sang hàng tĩnh nếu $< 4$ bài.

- [ ] **Step 1: Create `src/components/featured-filmstrip.tsx`**

Nội dung component:
```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { ItemType, ItemScope } from '@prisma/client';
import { TypeBadge } from '@/components/ui/badge';
import {
  Sparkles,
  Pin,
  Calendar,
  Building2,
  Users,
  ArrowUpRight,
  BookOpen,
} from 'lucide-react';

export interface FeaturedItemData {
  id: string;
  title: string;
  slug: string;
  summary: string;
  thumbnailUrl?: string | null;
  type: ItemType;
  scope?: ItemScope | null;
  issuer?: string | null;
  publishedYear: number;
  isPinned: boolean;
  contributors: Array<{
    id: string;
    user?: { id: string; fullName: string } | null;
    externalName?: string | null;
    role: string;
  }>;
}

interface FeaturedFilmstripProps {
  items: FeaturedItemData[];
}

export function FeaturedFilmstrip({ items }: FeaturedFilmstripProps) {
  if (!items || items.length === 0) return null;

  const isShortList = items.length < 4;

  return (
    <section className="py-8 bg-slate-50/70 border-b border-slate-200 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#0F294A] text-xs font-bold border border-slate-200 shadow-2xs mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>TIÊU ĐIỂM HỌC THUẬT</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-serif">
              Công Trình Nghiên Cứu &amp; Sáng Tạo Nổi Bật
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md">
            Tuyển chọn tối đa 10 công trình khoa học và dự án công nghệ xuất sắc của thành viên CLB Nexus.
          </p>
        </div>
      </div>

      {isShortList ? (
        /* Static Grid View when fewer than 4 items */
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <FilmstripCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ) : (
        /* Infinite Filmstrip Reel View */
        <div className="relative w-full group">
          {/* Edge Gradient Fading Masks */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-slate-50 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-slate-50 to-transparent z-10" />

          {/* Marquee Track (Double Render for Seamless Continuous Roll) */}
          <div className="flex gap-6 overflow-x-hidden py-4 px-4 scrollbar-none">
            <div className="flex gap-6 animate-filmstrip-roll group-hover:[animation-play-state:paused] shrink-0 will-change-transform">
              {items.map((item, idx) => (
                <FilmstripCard key={`orig-${item.id}-${idx}`} item={item} />
              ))}
            </div>
            <div
              className="flex gap-6 animate-filmstrip-roll group-hover:[animation-play-state:paused] shrink-0 will-change-transform"
              aria-hidden="true"
            >
              {items.map((item, idx) => (
                <FilmstripCard key={`dup-${item.id}-${idx}`} item={item} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function FilmstripCard({ item }: { item: FeaturedItemData }) {
  const authorNames = item.contributors
    .map((c) => c.user?.fullName || c.externalName)
    .filter(Boolean);
  const primaryAuthor = authorNames[0] || 'CLB Nexus';
  const remainingCount = authorNames.length > 1 ? authorNames.length - 1 : 0;

  return (
    <Link
      href={`/showcase/${item.slug}`}
      className="group/card block w-[310px] sm:w-[350px] shrink-0 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-2xl hover:border-[#0F294A] hover:scale-[1.06] -translate-y-0.5 hover:-translate-y-1.5 transition-all duration-300 ease-out overflow-hidden relative z-0 hover:z-20 flex flex-col h-[380px]"
    >
      {/* Thumbnail Aspect 16/9 */}
      <div className="aspect-[16/9] w-full bg-slate-100 relative overflow-hidden border-b border-slate-100 shrink-0">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200/80 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-[#0F294A] font-bold mb-1 font-serif border border-slate-200">
              NX
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Nexus Academic Showcase</span>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-2.5 left-2.5">
          <TypeBadge type={item.type} size="sm" />
        </div>

        {/* Pin or New Badge */}
        <div className="absolute top-2.5 right-2.5">
          {item.isPinned ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-xs">
              <Pin className="w-3 h-3 fill-white" />
              <span>Được ghim</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-slate-700 shadow-xs border border-slate-200">
              <span>Mới nhất</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {item.publishedYear}
            </span>
            {item.issuer && (
              <span className="flex items-center gap-1 font-medium truncate max-w-[190px]" title={item.issuer}>
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {item.issuer}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-slate-900 group-hover/card:text-[#0F294A] transition-colors line-clamp-2 leading-snug mb-2 font-serif">
            {item.title}
          </h3>

          {/* Summary Excerpt */}
          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {item.summary}
          </p>
        </div>

        {/* Footer Author & CTA */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 truncate max-w-[210px]">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-700 truncate">{primaryAuthor}</span>
            {remainingCount > 0 && (
              <span className="text-slate-400 shrink-0">+{remainingCount}</span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0F294A] group-hover/card:translate-x-0.5 transition-transform">
            <span>Chi tiết</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Add Tailwind animation keyframe in `tailwind.config.ts` or CSS**

Kiểm tra `tailwind.config.ts` và bổ sung keyframe animation `filmstrip-roll`:
```typescript
keyframes: {
  'filmstrip-roll': {
    '0%': { transform: 'translateX(0)' },
    '100%': { transform: 'translateX(-50%)' },
  },
},
animation: {
  'filmstrip-roll': 'filmstrip-roll 45s linear infinite',
},
```

- [ ] **Step 3: Verify build / type check**

Chạy:
```powershell
npx tsc --noEmit
```
Expected: PASS (không có lỗi type nào trong component mới).

- [ ] **Step 4: Commit**

```powershell
git add src/components/featured-filmstrip.tsx tailwind.config.ts; git commit -m "feat(ui): add FeaturedFilmstrip infinite carousel component"
```

---

### Task 4: Integrate Featured Filmstrip with Explore Page (`src/app/page.tsx`)

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `FeaturedFilmstrip`, Prisma `showcaseItem`.
- Produces: Explore page (`/`) hiển thị Filmstrip ngay dưới Stats Counters và trên Tabs Filter.

- [ ] **Step 1: Implement hybrid query for 10 items in `src/app/page.tsx`**

Cập nhật `src/app/page.tsx`:
1. Truy vấn các bài ghim (`isPinned: true, status: 'PUBLISHED'`) tối đa 10 bài.
2. Nếu số bài ghim `< 10`, truy vấn bù các bài xuất bản mới nhất không nằm trong danh sách ghim cho đủ 10 bài.
3. Import và đặt `<FeaturedFilmstrip items={featuredItems} />` ngay bên dưới `<section className="relative overflow-hidden py-14 sm:py-20 ...">` (Hero Stats) và ngay trước `<main className="container mx-auto ...">`.

- [ ] **Step 2: Verify page compilation and test pass**

Chạy:
```powershell
npx vitest run
```
Expected: PASS.

- [ ] **Step 3: Commit**

```powershell
git add src/app/page.tsx; git commit -m "feat(home): embed FeaturedFilmstrip with hybrid 10-item query on explore page"
```

---

### Task 5: Admin Pin Toggle Button on Detail Page & Admin Dashboard

**Files:**
- Create: `src/components/pin-toggle-button.tsx`
- Modify: `src/app/showcase/[slug]/page.tsx`
- Modify: `src/app/admin/page.tsx`

**Interfaces:**
- Consumes: `togglePinShowcaseItemAction`.
- Produces: 
  - `PinToggleButton` tương tác client gọi Server Action với loading state mượt mà.
  - Hiển thị nút Pin trên trang chi tiết khi user đăng nhập là `ADMIN`.
  - Khối widget quản lý các bài đang ghim trên trang Admin Dashboard.

- [ ] **Step 1: Create `src/components/pin-toggle-button.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pin, Loader2 } from 'lucide-react';
import { togglePinShowcaseItemAction } from '@/actions/showcase-actions';

interface PinToggleButtonProps {
  adminId: string;
  itemId: string;
  initialIsPinned: boolean;
  status: string;
}

export function PinToggleButton({
  adminId,
  itemId,
  initialIsPinned,
  status,
}: PinToggleButtonProps) {
  const [isPinned, setIsPinned] = useState(initialIsPinned);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (status !== 'PUBLISHED') {
    return null;
  }

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await togglePinShowcaseItemAction(adminId, itemId);
      if (res.success && res.isPinned !== undefined) {
        setIsPinned(res.isPinned);
        router.refresh();
      } else if (res.error) {
        alert(res.error);
      }
    } catch (e: any) {
      alert(e.message || 'Có lỗi xảy ra khi ghim công trình.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 h-11 px-4 sm:px-5 rounded-xl text-sm font-bold transition-all shadow-xs cursor-pointer ${
        isPinned
          ? 'bg-amber-500 hover:bg-amber-600 text-white border border-amber-600'
          : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300'
      }`}
      title={isPinned ? 'Bấm để gỡ ghim khỏi trang chủ' : 'Bấm để ghim lên thanh cuộn phim trang chủ'}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        <Pin className={`w-4 h-4 ${isPinned ? 'fill-white text-white' : 'text-slate-500'}`} />
      )}
      <span>{isPinned ? 'Đang ghim trang chủ' : 'Ghim trang chủ'}</span>
    </button>
  );
}
```

- [ ] **Step 2: Add `PinToggleButton` to `src/app/showcase/[slug]/page.tsx`**

Đặt `PinToggleButton` vào thanh điều hướng / action buttons của trang chi tiết khi `isAdmin === true`:
```tsx
{isAdmin && (
  <PinToggleButton
    adminId={session.user.id}
    itemId={item.id}
    initialIsPinned={item.isPinned}
    status={item.status}
  />
)}
```

- [ ] **Step 3: Add Featured Showcase Widget in `src/app/admin/page.tsx`**

Thêm ô thống kê số bài đang ghim và danh sách rút gọn trên trang Dashboard của Thầy Chủ nhiệm:
- Đếm số lượng: `prisma.showcaseItem.count({ where: { isPinned: true, status: 'PUBLISHED' } })`
- Hiển thị card: *"Công trình đang ghim ({pinnedCount}/10 bài)"*.

- [ ] **Step 4: Verify tests and type checks**

Chạy:
```powershell
npx vitest run; npx tsc --noEmit
```
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/components/pin-toggle-button.tsx src/app/showcase/[slug]/page.tsx src/app/admin/page.tsx; git commit -m "feat(admin): add PinToggleButton and admin dashboard featured management"
```

---

### Task 6: Full Verification & Visual Inspection

**Files:**
- All modified and created files.

- [ ] **Step 1: Run complete test suite**

Chạy:
```powershell
npm test
```
Expected: Toàn bộ tất cả các bài test (bao gồm 35 bài cũ + các bài test ghim mới) đều PASS 100%.

- [ ] **Step 2: Verify Next.js dev server status**

Gửi request kiểm tra `http://localhost:3000` và `http://localhost:3000/showcase/...` để đảm bảo không có bất kỳ lỗi 500 hay CSS hydration issue nào.

- [ ] **Step 3: Final commit & git status clean check**

```powershell
git status
```
Expected: Working tree clean.
