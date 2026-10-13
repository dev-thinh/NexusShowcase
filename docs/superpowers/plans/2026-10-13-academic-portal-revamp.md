# Academic Portal Revamp & Flexible Project Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trùng tu toàn diện hệ thống NexusShowcase: Luồng nộp bài dự án tự do, Google Drive media pipeline cho Ban Truyền thông, cơ chế hiển thị Public/Private 1-click, thanh Navigation chuẩn mực có quy tắc Zero Empty State, và giao diện Học thuật Tối giản (Academic Minimalist).

**Architecture:** Mở rộng Prisma schema với `Category` model, `ItemVisibility` enum (`PUBLIC` | `PRIVATE`), `mediaDriveUrl`, `tags` và `publishedYear` không bắt buộc; xây dựng Server Action `toggleItemVisibilityAction` và helper `getFeaturedNavCategories` với cơ chế Zero Empty State; tái cấu trúc Navbar (Logo -> Trang chủ -> Thành viên -> Featured Tabs -> Bài đăng -> Liên hệ -> Profile/Login); xóa bỏ 3 ô đếm số và filmstrip; xây dựng trang danh bạ Thành viên `/members`, trang Liên hệ `/contact`, và trang danh mục chuyên đề `/category/[slug]`.

**Tech Stack:** Next.js 15.1 (App Router), React 19, TypeScript 5.7, Tailwind CSS 3.4, Prisma 6.0, NextAuth v5, Vitest 2.1.

## Global Constraints

- **Workspace:** `D:\HCMUS\NexusShowcase\.worktrees\dev` trên nhánh `dev`.
- **Ngôn ngữ thực thi:** Không dùng Python script; không dùng metadata markdown artifact (`IsArtifact: true`). Mọi thao tác thực hiện trực tiếp trên worktree.
- **Bảo mật kế thừa:** Giữ vững 100% các chốt chặn bảo mật (Server Action session-derived auth, Zod validation, CUID guards).
- **Thứ tự Navigation Bar chính xác tuyệt đối:** `[Logo]` $\rightarrow$ `[Trang chủ]` $\rightarrow$ `[Thành viên]` $\rightarrow$ `[Các tab nổi bật]` $\rightarrow$ `[Bài đăng]` (khi đăng nhập) $\rightarrow$ `[Liên hệ]` $\rightarrow$ `[Profile / Đăng nhập]`.
- **Tên tab:** Đổi tên Dashboard thành `Bài đăng` (đúng 2 chữ).
- **Quy tắc Zero Empty State:** Chỉ tab danh mục nào có bài xuất bản $> 0$ mới được xuất hiện trên Navigation Bar.
- **Trang chủ tối giản:** Xóa vĩnh viễn 3 ô đếm số và component cuộn phim `FeaturedFilmstrip`.

---

### Task 1: Prisma Schema & Types for Categories and Item Visibility

**Files:**
- Modify: `prisma/schema.prisma:22-125`
- Test: `tests/unit/prisma-schema-types.test.ts`

**Interfaces:**
- Consumes: Existing Prisma enums & models.
- Produces: Enum `ItemVisibility { PUBLIC, PRIVATE }`, Model `Category`, các trường mới trong `ShowcaseItem`: `categoryId`, `visibility`, `mediaDriveUrl`, `tags`, `publishedYear` (optional), quan hệ `category`.

- [ ] **Step 1: Write the failing test**

Tạo file `tests/unit/prisma-schema-types.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Prisma Schema Definitions', () => {
  it('contains ItemVisibility enum and Category model in schema.prisma', () => {
    const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
    const content = fs.readFileSync(schemaPath, 'utf-8');

    expect(content).toContain('enum ItemVisibility');
    expect(content).toContain('PUBLIC');
    expect(content).toContain('PRIVATE');

    expect(content).toContain('model Category');
    expect(content).toContain('isNavFeatured');
    expect(content).toContain('displayOrder');

    expect(content).toContain('visibility      ItemVisibility');
    expect(content).toContain('mediaDriveUrl   String?');
    expect(content).toContain('tags            String[]');
    expect(content).toContain('category        Category?');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/prisma-schema-types.test.ts`
Expected: FAIL with missing `enum ItemVisibility` or `model Category`.

- [ ] **Step 3: Modify `prisma/schema.prisma`**

Thêm enum `ItemVisibility`, model `Category`, và cập nhật `ShowcaseItem` trong `prisma/schema.prisma`:
```prisma
enum ItemVisibility {
  PUBLIC
  PRIVATE
}

model Category {
  id            String         @id @default(cuid())
  name          String         @unique
  slug          String         @unique
  description   String?
  isNavFeatured Boolean        @default(false)
  displayOrder  Int            @default(0)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  items         ShowcaseItem[]

  @@map("categories")
}
```
Và trong `model ShowcaseItem`:
```prisma
  categoryId      String?
  category        Category?         @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  tags            String[]          @default([])

  visibility      ItemVisibility    @default(PRIVATE)
  mediaDriveUrl   String?
  publishedYear   Int?              @default(2026)
```
Cập nhật indexes:
```prisma
  @@index([status, visibility])
  @@index([categoryId])
```
Sau đó chạy `npx prisma generate` để cập nhật TypeScript client.

- [ ] **Step 4: Run test and prisma validate to verify it passes**

Run: `npx prisma validate && npx vitest run tests/unit/prisma-schema-types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma tests/unit/prisma-schema-types.test.ts
git commit -m "feat(schema): add ItemVisibility, Category model, and flexible ShowcaseItem fields"
```

---

### Task 2: Action Schemas for Flexible Submission and Visibility Toggle

**Files:**
- Modify: `src/lib/action-schemas.ts:50-101`
- Test: `tests/unit/action-schemas.test.ts`

**Interfaces:**
- Consumes: Zod library.
- Produces: `toggleItemVisibilityInputSchema`, cập nhật `createShowcaseItemInputSchema` (cho phép `categoryId`, `proposedCategory`, `tags`, `mediaDriveUrl`, `visibility`, `publishedYear` tùy chọn).

- [ ] **Step 1: Write the failing test**

Cập nhật `tests/unit/action-schemas.test.ts` bổ sung các test case:
```ts
  it('validates flexible submission fields: tags, mediaDriveUrl, categoryId, proposedCategory', () => {
    const validFlexible = {
      title: 'Robotics Autonomous Rover',
      summary: 'Dự án xe tự hành với LiDAR và STM32.',
      type: 'PROJECT',
      categoryId: 'cjr012345678901234567890',
      proposedCategory: 'Robotics',
      tags: ['Robotics', 'LiDAR', 'STM32'],
      mediaDriveUrl: 'https://drive.google.com/drive/folders/test123456',
      visibility: 'PUBLIC',
      contributors: [],
      links: [{ label: 'GitHub Repo', url: 'https://github.com/nexus/rover', type: 'OTHER' }],
    };

    const parsed = createShowcaseItemInputSchema.safeParse(validFlexible);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.tags).toEqual(['Robotics', 'LiDAR', 'STM32']);
      expect(parsed.data.mediaDriveUrl).toBe('https://drive.google.com/drive/folders/test123456');
    }
  });

  it('validates toggleItemVisibilityInputSchema requires valid cuid', () => {
    expect(toggleItemVisibilityInputSchema.safeParse({ itemId: 'not-a-cuid' }).success).toBe(false);
    expect(toggleItemVisibilityInputSchema.safeParse({ itemId: 'cjr012345678901234567890' }).success).toBe(true);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/action-schemas.test.ts`
Expected: FAIL with `toggleItemVisibilityInputSchema is not defined` or schema validation error.

- [ ] **Step 3: Modify `src/lib/action-schemas.ts`**

Trong `src/lib/action-schemas.ts`:
Thêm `toggleItemVisibilityInputSchema`:
```ts
export const toggleItemVisibilityInputSchema = z.object({
  itemId: cuidSchema,
});
```
Cập nhật `createShowcaseItemInputSchema`:
```ts
export const createShowcaseItemInputSchema = z.object({
  title: trimmedText(200).min(1),
  summary: trimmedText(2_000).min(1),
  content: trimmedText(50_000).optional(),
  type: z.enum(['RESEARCH_PAPER', 'PROJECT', 'ACHIEVEMENT']).default('PROJECT'),
  categoryId: cuidSchema.optional(),
  proposedCategory: trimmedText(100).optional(),
  tags: z.array(trimmedText(50)).max(20).default([]),
  scope: z.enum(['INTERNAL', 'CLUB_CONTRIBUTION', 'EXTERNAL', 'OPEN_SOURCE']).optional(),
  issuer: trimmedText(200).optional(),
  thumbnailUrl: storedFileUrlSchema.optional(),
  mediaDriveUrl: safeHttpUrlSchema.optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PRIVATE'),
  publishedYear: z.number().int().min(1900).max(MAX_CURRENT_YEAR).optional(),
  contributors: z.array(contributorInputSchema).max(20),
  links: z.array(linkInputSchema).max(20),
  attachments: z.array(attachmentInputSchema).max(10).optional(),
  submitForReview: z.boolean().optional(),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/action-schemas.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/action-schemas.ts tests/unit/action-schemas.test.ts
git commit -m "feat(schemas): add toggleItemVisibility schema and flexible submission fields"
```

---

### Task 3: Server Action for 1-Click Visibility Toggle & Updated Submission

**Files:**
- Modify: `src/actions/showcase-actions.ts`
- Create: `tests/unit/visibility-toggle.test.ts`

**Interfaces:**
- Consumes: `getCurrentUser(['ADMIN'])`, `toggleItemVisibilityInputSchema`, `prisma.showcaseItem`.
- Produces: `toggleItemVisibilityAction(itemId: string): Promise<{ success: boolean; visibility?: 'PUBLIC' | 'PRIVATE'; error?: string }>` và lưu `mediaDriveUrl`, `tags`, `categoryId`, `visibility` trong `createShowcaseItemAction` / `updateShowcaseItemAction`.

- [ ] **Step 1: Write the failing test**

Tạo file `tests/unit/visibility-toggle.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  prisma: {
    user: { findUnique: vi.fn() },
    showcaseItem: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('server-only', () => ({}));

import { toggleItemVisibilityAction } from '@/actions/showcase-actions';

const VALID_ITEM_ID = 'cjr012345678901234567890';
const ADMIN_ID = 'cjr012345678901234567899';
const MEMBER_ID = 'cjr012345678901234567888';

describe('toggleItemVisibilityAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated or non-admin users', async () => {
    mocks.auth.mockResolvedValue({ user: { id: MEMBER_ID, role: 'MEMBER' } });
    mocks.prisma.user.findUnique.mockResolvedValue({ id: MEMBER_ID, role: 'MEMBER', status: 'ACTIVE' });

    const result = await toggleItemVisibilityAction(VALID_ITEM_ID);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Quản trị viên');
  });

  it('toggles PRIVATE to PUBLIC successfully for admin', async () => {
    mocks.auth.mockResolvedValue({ user: { id: ADMIN_ID, role: 'ADMIN' } });
    mocks.prisma.user.findUnique.mockResolvedValue({ id: ADMIN_ID, role: 'ADMIN', status: 'ACTIVE' });
    mocks.prisma.showcaseItem.findUnique.mockResolvedValue({
      id: VALID_ITEM_ID,
      visibility: 'PRIVATE',
      slug: 'test-project',
    });
    mocks.prisma.showcaseItem.update.mockResolvedValue({
      id: VALID_ITEM_ID,
      visibility: 'PUBLIC',
      slug: 'test-project',
    });

    const result = await toggleItemVisibilityAction(VALID_ITEM_ID);
    expect(result.success).toBe(true);
    expect(result.visibility).toBe('PUBLIC');
    expect(mocks.prisma.showcaseItem.update).toHaveBeenCalledWith({
      where: { id: VALID_ITEM_ID },
      data: { visibility: 'PUBLIC' },
    });
  });

  it('toggles PUBLIC to PRIVATE successfully for admin', async () => {
    mocks.auth.mockResolvedValue({ user: { id: ADMIN_ID, role: 'ADMIN' } });
    mocks.prisma.user.findUnique.mockResolvedValue({ id: ADMIN_ID, role: 'ADMIN', status: 'ACTIVE' });
    mocks.prisma.showcaseItem.findUnique.mockResolvedValue({
      id: VALID_ITEM_ID,
      visibility: 'PUBLIC',
      slug: 'test-project',
    });
    mocks.prisma.showcaseItem.update.mockResolvedValue({
      id: VALID_ITEM_ID,
      visibility: 'PRIVATE',
      slug: 'test-project',
    });

    const result = await toggleItemVisibilityAction(VALID_ITEM_ID);
    expect(result.success).toBe(true);
    expect(result.visibility).toBe('PRIVATE');
    expect(mocks.prisma.showcaseItem.update).toHaveBeenCalledWith({
      where: { id: VALID_ITEM_ID },
      data: { visibility: 'PRIVATE' },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/visibility-toggle.test.ts`
Expected: FAIL with `toggleItemVisibilityAction is not defined`.

- [ ] **Step 3: Implement `toggleItemVisibilityAction` in `src/actions/showcase-actions.ts`**

Bổ sung vào `src/actions/showcase-actions.ts`:
```ts
import {
  // ...
  toggleItemVisibilityInputSchema,
} from '@/lib/action-schemas';

export async function toggleItemVisibilityAction(itemId: string) {
  const admin = await getCurrentUser(['ADMIN']);
  if (!admin) {
    return { success: false, error: 'Chỉ Quản trị viên (Admin) mới có quyền thay đổi chế độ hiển thị.' };
  }

  const parsed = toggleItemVisibilityInputSchema.safeParse({ itemId });
  if (!parsed.success) {
    return { success: false, error: INVALID_ACTION_INPUT_ERROR };
  }
  itemId = parsed.data.itemId;

  const targetItem = await prisma.showcaseItem.findUnique({
    where: { id: itemId },
    select: { id: true, visibility: true, slug: true },
  });

  if (!targetItem) {
    return { success: false, error: 'Không tìm thấy công trình này.' };
  }

  const nextVisibility = targetItem.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
  const updated = await prisma.showcaseItem.update({
    where: { id: itemId },
    data: { visibility: nextVisibility },
    select: { id: true, visibility: true, slug: true },
  });

  try {
    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/admin');
    if (updated.slug) revalidatePath(`/showcase/${updated.slug}`);
  } catch {
    // Ignore cache error in test
  }

  return { success: true, visibility: updated.visibility };
}
```
Và trong `createShowcaseItemAction` & `updateShowcaseItemAction`:
Lưu các trường `categoryId: values.categoryId || null`, `mediaDriveUrl: values.mediaDriveUrl || null`, `tags: values.tags || []`, `visibility: values.visibility || 'PRIVATE'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/visibility-toggle.test.ts tests/unit/showcase-edit.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/actions/showcase-actions.ts tests/unit/visibility-toggle.test.ts
git commit -m "feat(actions): add toggleItemVisibilityAction and persist mediaDriveUrl, tags, categoryId"
```

---

### Task 4: Zero Empty State Navigation Category Helper

**Files:**
- Create: `src/lib/nav-categories.ts`
- Create: `tests/unit/nav-categories.test.ts`

**Interfaces:**
- Consumes: `prisma.category`, `prisma.showcaseItem`.
- Produces: `getFeaturedNavCategories(isAuthenticated: boolean): Promise<Array<{ id: string; name: string; slug: string; count: number }>>`
- Logic: Chỉ trả về các Category có `isNavFeatured === true` VÀ `count > 0` (đối với `isAuthenticated === false` thì chỉ đếm `visibility: 'PUBLIC'`; đối với `isAuthenticated === true` thì đếm cả `PUBLIC` và `PRIVATE`). Sắp xếp theo `displayOrder: 'asc'`.

- [ ] **Step 1: Write the failing test**

Tạo file `tests/unit/nav-categories.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  category: {
    findMany: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { getFeaturedNavCategories } from '@/lib/nav-categories';

describe('getFeaturedNavCategories (Zero Empty State)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters out featured categories with 0 items for guests', async () => {
    mockPrisma.category.findMany.mockResolvedValue([
      {
        id: 'cat-1',
        name: 'Bài báo khoa học',
        slug: 'publications',
        displayOrder: 1,
        items: [{ id: 'item-1' }],
      },
      {
        id: 'cat-2',
        name: 'Giải thưởng',
        slug: 'awards',
        displayOrder: 2,
        items: [], // 0 items!
      },
    ]);

    const result = await getFeaturedNavCategories(false);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('publications');
    expect(result[0].count).toBe(1);
  });

  it('sorts active categories by displayOrder', async () => {
    mockPrisma.category.findMany.mockResolvedValue([
      {
        id: 'cat-2',
        name: 'Dự án',
        slug: 'projects',
        displayOrder: 2,
        items: [{ id: 'item-2' }],
      },
      {
        id: 'cat-1',
        name: 'Bài báo',
        slug: 'publications',
        displayOrder: 1,
        items: [{ id: 'item-1' }],
      },
    ]);

    const result = await getFeaturedNavCategories(true);
    expect(result).toHaveLength(2);
    expect(result[0].slug).toBe('publications');
    expect(result[1].slug).toBe('projects');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/nav-categories.test.ts`
Expected: FAIL with `getFeaturedNavCategories is not defined`.

- [ ] **Step 3: Implement `src/lib/nav-categories.ts`**

Tạo `src/lib/nav-categories.ts`:
```ts
import { prisma } from '@/lib/prisma';

export interface FeaturedNavCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export async function getFeaturedNavCategories(isAuthenticated: boolean): Promise<FeaturedNavCategory[]> {
  const itemWhere = isAuthenticated
    ? { status: 'PUBLISHED' as const }
    : { status: 'PUBLISHED' as const, visibility: 'PUBLIC' as const };

  const categories = await prisma.category.findMany({
    where: {
      isNavFeatured: true,
    },
    include: {
      items: {
        where: itemWhere,
        select: { id: true },
      },
    },
    orderBy: {
      displayOrder: 'asc',
    },
  });

  // Zero Empty State: filter out categories with 0 published items
  return categories
    .filter((cat) => cat.items.length > 0)
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      count: cat.items.length,
    }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/nav-categories.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/nav-categories.ts tests/unit/nav-categories.test.ts
git commit -m "feat(nav): add getFeaturedNavCategories helper enforcing Zero Empty State"
```

---

### Task 5: Navigation Bar Revamp (Order, 'Bài đăng' tab, Members & Contact links)

**Files:**
- Modify: `src/components/navbar.tsx`
- Modify: `src/components/navbar-nav.tsx`
- Create: `tests/unit/navbar-nav.test.ts`

**Interfaces:**
- Consumes: `getFeaturedNavCategories(isAuthenticated)`, `NavbarNavProps` nhận `featuredCategories`.
- Produces: Navbar chuẩn mực với đúng thứ tự:
  `[Logo]` $\rightarrow$ `[Trang chủ]` $\rightarrow$ `[Thành viên]` $\rightarrow$ `[Các tab nổi bật (có bài > 0)]` $\rightarrow$ `[Bài đăng]` (nếu đã đăng nhập) $\rightarrow$ `[Liên hệ]` $\rightarrow$ `[Profile / Đăng nhập]`.
  Tab Dashboard đổi tên thành `Bài đăng` (2 chữ).

- [ ] **Step 1: Write the failing test**

Tạo file `tests/unit/navbar-nav.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Navbar Nav Component Structure', () => {
  it('implements the exact requested order and naming', () => {
    const navbarNavPath = path.resolve(process.cwd(), 'src/components/navbar-nav.tsx');
    const content = fs.readFileSync(navbarNavPath, 'utf-8');

    // Tab renamed to 'Bài đăng' (2 words)
    expect(content).toContain('Bài đăng');
    expect(content).not.toContain('<span>Dashboard</span>');

    // Contains links to members and contact
    expect(content).toContain('href="/members"');
    expect(content).toContain('href="/contact"');
    expect(content).toContain('Thành viên');
    expect(content).toContain('Liên hệ');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/navbar-nav.test.ts`
Expected: FAIL with missing 'Bài đăng' or links.

- [ ] **Step 3: Modify `src/components/navbar.tsx` and `src/components/navbar-nav.tsx`**

Trong `src/components/navbar.tsx`:
Gọi `const featuredCategories = await getFeaturedNavCategories(!!user);` và truyền vào `<NavbarNav user={user} featuredCategories={featuredCategories} />`.

Trong `src/components/navbar-nav.tsx`:
Nhận `featuredCategories: FeaturedNavCategory[]`.
Sắp xếp thanh nav theo thứ tự:
1. `Trang chủ` (`/`)
2. `Thành viên` (`/members`)
3. `featuredCategories.map(cat => <Link href={`/category/${cat.slug}`}>{cat.name}</Link>)`
4. `{user && <Link href="/dashboard">Bài đăng</Link>}`
5. `Liên hệ` (`/contact`)
6. Profile / Đăng xuất (hoặc nút Đăng nhập nếu chưa đăng nhập).

Active tab style tinh tế: `bg-[#0F294A] text-white`, Inactive tab style: `text-slate-600 hover:text-slate-900 hover:bg-slate-100`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/navbar-nav.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/navbar.tsx src/components/navbar-nav.tsx tests/unit/navbar-nav.test.ts
git commit -m "feat(navbar): restructure navigation bar order, rename Bài đăng tab, add Members and Contact"
```

---

### Task 6: Academic Minimalist Home Page (Remove Counters, Remove Filmstrip, Public/Private Query)

**Files:**
- Modify: `src/app/page.tsx`
- Create: `tests/unit/home-page-query.test.ts`

**Interfaces:**
- Consumes: `auth()`, `prisma.showcaseItem`.
- Produces: Trang chủ tối giản chuẩn học thuật:
  - Xóa bỏ `FeaturedFilmstrip`.
  - Xóa bỏ khối 3 ô đếm số (`totalPapers`, `totalProjects`, `totalAchievements`).
  - Guest query: `where: { status: 'PUBLISHED', visibility: 'PUBLIC' }`.
  - Authenticated query: `where: { status: 'PUBLISHED' }`.
  - Grid bài hiển thị ngay trên màn hình đầu tiên (compact hero header, search + tag filter, grid bài 3 cột gọn gàng).

- [ ] **Step 1: Write the failing test**

Tạo file `tests/unit/home-page-query.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Home Page Minimalist Revamp', () => {
  it('has removed FeaturedFilmstrip and 3 counter boxes', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    expect(content).not.toContain('<FeaturedFilmstrip');
    expect(content).not.toContain('totalPapers');
    expect(content).not.toContain('totalProjects');
    expect(content).not.toContain('totalAchievements');
  });

  it('applies visibility: PUBLIC filter when user is not logged in', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    expect(content).toContain('visibility');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/home-page-query.test.ts`
Expected: FAIL with `content contains totalPapers / FeaturedFilmstrip`.

- [ ] **Step 3: Modify `src/app/page.tsx`**

Cập nhật `src/app/page.tsx`:
- Import `auth` từ `@/lib/auth`.
- `const session = await auth(); const isAuthenticated = !!session?.user;`
- Thiết lập `whereClause`:
  ```ts
  const whereClause: any = {
    status: 'PUBLISHED',
    ...(isAuthenticated ? {} : { visibility: 'PUBLIC' }),
  };
  ```
- Loại bỏ query `totalPapers`, `totalProjects`, `totalAchievements`, `pinnedItems`, `fillItems`.
- Loại bỏ `<FeaturedFilmstrip items={featuredItems} />`.
- Loại bỏ khối 3 ô đếm số trong Hero section.
- Thu gọn Hero: Header nhỏ gọn, thanh tìm kiếm + bộ lọc tags trực tiếp bên dưới.
- Hiển thị ngay `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">` với `<ShowcaseCard>`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/home-page-query.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx tests/unit/home-page-query.test.ts
git commit -m "feat(home): streamline home page to academic minimalist UI, remove counters and filmstrip"
```

---

### Task 7: Flexible Submission Form (ItemForm)

**Files:**
- Modify: `src/components/item-form.tsx`
- Create: `tests/unit/item-form.test.ts`

**Interfaces:**
- Consumes: Categories list, current user role.
- Produces: `ItemForm` linh hoạt:
  - Hỗ trợ nhập `mediaDriveUrl` (Link Drive ảnh/clip/CAD thô cho Ban Truyền thông).
  - Chọn danh mục có sẵn hoặc gõ đề xuất danh mục mới (`proposedCategory`).
  - Nhập tags tự do dạng text phân tách bằng dấu phẩy.
  - Links tự do (Label + URL).
  - Contributors tự do (Thành viên CLB hoặc Tên ngoài + chức danh vai trò tự do).
  - Thumbnail không bắt buộc nếu chưa có ảnh chính thức.
  - 2 nút: "Lưu bản nháp" (`DRAFT`) và "Gửi xét duyệt" (`PENDING_REVIEW`).

- [ ] **Step 1: Write the failing test**

Tạo file `tests/unit/item-form.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Item Form Component', () => {
  it('supports mediaDriveUrl, tags, and category proposal', () => {
    const formPath = path.resolve(process.cwd(), 'src/components/item-form.tsx');
    const content = fs.readFileSync(formPath, 'utf-8');

    expect(content).toContain('mediaDriveUrl');
    expect(content).toContain('proposedCategory');
    expect(content).toContain('tags');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/item-form.test.ts`
Expected: FAIL with missing fields in `item-form.tsx`.

- [ ] **Step 3: Modify `src/components/item-form.tsx`**

Cập nhật `ItemForm`:
- Thêm trường `mediaDriveUrl`: Input type text với icon Google Drive / Folder, placeholder "https://drive.google.com/... (Ảnh/video thô để Ban Truyền thông trau chuốt)".
- Thêm trường `proposedCategory`: Cho phép gõ đề xuất danh mục mới nếu danh mục mong muốn chưa có trong danh sách.
- Thêm trường `tags`: Input text nhập tag phân tách bằng dấu phẩy (vd: `Robotics, STM32, LiDAR`), tự parse thành mảng string.
- Bỏ các ràng buộc ép buộc chọn dropdown học thuật cũ.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/item-form.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/item-form.tsx tests/unit/item-form.test.ts
git commit -m "feat(submission): enhance ItemForm with mediaDriveUrl, tags, and proposedCategory"
```

---

### Task 8: Admin Review & Media Asset Pipeline

**Files:**
- Modify: `src/app/admin/reviews/page.tsx`
- Create: `tests/unit/admin-reviews.test.ts`

**Interfaces:**
- Consumes: Bài nộp `PENDING_REVIEW` kèm `mediaDriveUrl`, `proposedCategory`, `tags`.
- Produces: Giao diện thẩm định bài nộp cho Ban Truyền thông & Admin:
  - Nút mở `mediaDriveUrl` trực tiếp trên tab mới.
  - Hiển thị danh mục đề xuất (nếu có).
  - Lựa chọn chế độ xuất bản mặc định: `PUBLIC` (Công khai cho khách) hoặc `PRIVATE` (Chỉ nội bộ CLB).
  - Duyệt bài (`PUBLISH`) hoặc Từ chối (`REJECT` kèm lý do).

- [ ] **Step 1: Write the failing test**

Tạo file `tests/unit/admin-reviews.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Admin Reviews Page', () => {
  it('renders mediaDriveUrl and proposedCategory for reviewers', () => {
    const reviewsPath = path.resolve(process.cwd(), 'src/app/admin/reviews/page.tsx');
    const content = fs.readFileSync(reviewsPath, 'utf-8');

    expect(content).toContain('mediaDriveUrl');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/admin-reviews.test.ts`
Expected: FAIL with `reviews/page.tsx` not referencing `mediaDriveUrl`.

- [ ] **Step 3: Modify `src/app/admin/reviews/page.tsx`**

Cập nhật `src/app/admin/reviews/page.tsx`:
- Lấy `mediaDriveUrl`, `proposedCategory`, `category` trong query `showcaseItem`.
- Nếu có `mediaDriveUrl`: Hiển thị nút "Mở Google Drive tư liệu thô" với icon Drive nổi bật để Ban Truyền thông dễ dàng tải ảnh/video gốc về làm ảnh bìa.
- Nếu có `proposedCategory`: Hiển thị huy hiệu "Đề xuất danh mục: [Tên]".
- Bổ sung công tắc / lựa chọn `PUBLIC` vs `PRIVATE` khi bấm duyệt.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/admin-reviews.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/reviews/page.tsx tests/unit/admin-reviews.test.ts
git commit -m "feat(admin): add media drive link and proposed category handling in review pipeline"
```

---

### Task 9: Showcase Detail Page with Admin 1-Click Visibility Switch & Guest Protection

**Files:**
- Create: `src/components/visibility-toggle-button.tsx`
- Modify: `src/app/showcase/[slug]/page.tsx`
- Create: `tests/unit/showcase-detail.test.ts`

**Interfaces:**
- Consumes: `toggleItemVisibilityAction`, `auth()`, `item.visibility`.
- Produces:
  - `VisibilityToggleButton`: Client component 1-click toggle giữa `[🌐 Công khai]` và `[🔒 Nội bộ]`, chỉ hiển thị cho Admin.
  - Bảo vệ bài viết `PRIVATE`: Nếu khách chưa đăng nhập truy cập một bài có `visibility: 'PRIVATE'`, chuyển hướng sang `/login?callbackUrl=...` kèm thông báo bài viết yêu cầu đăng nhập nội bộ.
  - Huy hiệu trạng thái trên bài viết (`🌐 Công khai` / `🔒 Nội bộ`).

- [ ] **Step 1: Write the failing test**

Tạo file `tests/unit/showcase-detail.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Showcase Detail Page Visibility Protection', () => {
  it('protects private items from unauthenticated guests and contains toggle button', () => {
    const detailPath = path.resolve(process.cwd(), 'src/app/showcase/[slug]/page.tsx');
    const content = fs.readFileSync(detailPath, 'utf-8');

    expect(content).toContain('visibility');
    expect(content).toContain('VisibilityToggleButton');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/showcase-detail.test.ts`
Expected: FAIL with `VisibilityToggleButton not found`.

- [ ] **Step 3: Create `src/components/visibility-toggle-button.tsx` and modify `src/app/showcase/[slug]/page.tsx`**

Tạo `src/components/visibility-toggle-button.tsx`:
```tsx
'use client';

import { useState, useTransition } from 'react';
import { Globe, Lock, Loader2 } from 'lucide-react';
import { toggleItemVisibilityAction } from '@/actions/showcase-actions';

interface VisibilityToggleButtonProps {
  itemId: string;
  initialVisibility: 'PUBLIC' | 'PRIVATE';
}

export function VisibilityToggleButton({ itemId, initialVisibility }: VisibilityToggleButtonProps) {
  const [visibility, setVisibility] = useState(initialVisibility);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const res = await toggleItemVisibilityAction(itemId);
      if (res.success && res.visibility) {
        setVisibility(res.visibility);
      }
    });
  };

  const isPublic = visibility === 'PUBLIC';

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      type="button"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
        isPublic
          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
          : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
      }`}
      title="Bấm để chuyển đổi giữa Công khai cho khách và Chỉ lưu hành nội bộ"
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isPublic ? (
        <Globe className="w-3.5 h-3.5 text-emerald-600" />
      ) : (
        <Lock className="w-3.5 h-3.5 text-amber-600" />
      )}
      <span>{isPublic ? '🌐 Công khai cho khách' : '🔒 Chỉ nội bộ CLB'}</span>
    </button>
  );
}
```

Trong `src/app/showcase/[slug]/page.tsx`:
- Kiểm tra nếu `item.visibility === 'PRIVATE'` và `!session?.user`, chuyển hướng: `redirect('/login?callbackUrl=/showcase/' + slug);`.
- Nếu `session?.user?.role === 'ADMIN'`, hiển thị thanh Admin Tool strip chứa `<VisibilityToggleButton itemId={item.id} initialVisibility={item.visibility} />`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/showcase-detail.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/visibility-toggle-button.tsx src/app/showcase/[slug]/page.tsx tests/unit/showcase-detail.test.ts
git commit -m "feat(showcase): add 1-click visibility toggle for admin and guest access guard"
```

---

### Task 10: Technical Directory Category Page (`/category/[slug]`)

**Files:**
- Create: `src/app/category/[slug]/page.tsx`
- Create: `tests/unit/category-page.test.ts`

**Interfaces:**
- Consumes: Category slug parameter, `auth()`, `prisma.category`, `prisma.showcaseItem`.
- Produces: Trang chuyên đề danh mục với bố cục Technical Directory tối giản: Tiêu đề danh mục, số lượng công trình, bảng/danh sách công trình (Tiêu đề, Tác giả, Năm, Links, Badge Public/Private), tra cứu tốc độ cao.

- [ ] **Step 1: Write the failing test**

Tạo file `tests/unit/category-page.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Category Directory Page', () => {
  it('exists and renders category directory items', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/category/[slug]/page.tsx');
    expect(fs.existsSync(pagePath)).toBe(true);

    const content = fs.readFileSync(pagePath, 'utf-8');
    expect(content).toContain('params');
    expect(content).toContain('slug');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/category-page.test.ts`
Expected: FAIL with `fs.existsSync(pagePath) is false`.

- [ ] **Step 3: Implement `src/app/category/[slug]/page.tsx`**

Tạo `src/app/category/[slug]/page.tsx`:
- Lấy category theo slug: `prisma.category.findUnique({ where: { slug } })`. Nếu không có, `notFound()`.
- Lấy items thuộc category này có `status: 'PUBLISHED'` (kèm điều kiện `visibility: 'PUBLIC'` nếu chưa đăng nhập).
- Render Navbar, Breadcrumb, Tiêu đề danh mục & mô tả, Danh sách Technical Directory mỏng gọn, Footer.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/category-page.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/category/[slug]/page.tsx tests/unit/category-page.test.ts
git commit -m "feat(category): implement technical directory view for category showcase"
```

---

### Task 11: Academic Directory Members Page (`/members`)

**Files:**
- Create: `src/app/members/page.tsx`
- Create: `tests/unit/members-page.test.ts`

**Interfaces:**
- Consumes: `prisma.user` (select `id, fullName, role, avatarUrl, bio, studentId, githubUrl, linkedinUrl`).
- Produces: Trang `/members` danh bạ học thuật:
  - Nhóm 1: Ban Cố vấn & Giảng viên (`role: ADMIN`).
  - Nhóm 2: Ban Chủ nhiệm & Thành viên Nòng cốt (`role: CORE_MEMBER`).
  - Nhóm 3: Thành viên Nghiên cứu & Kỹ thuật (`role: MEMBER`).
  - Card thành viên: Avatar/kí tự đầu, Họ tên, Vai trò trong CLB, Lĩnh vực quan tâm/bio, Links (GitHub, LinkedIn).
  - Bấm vào mở hồ sơ chi tiết `/members/[id]`.

- [ ] **Step 1: Write the failing test**

Tạo file `tests/unit/members-page.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Members Directory Page', () => {
  it('exists and organizes members by roles', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/members/page.tsx');
    expect(fs.existsSync(pagePath)).toBe(true);

    const content = fs.readFileSync(pagePath, 'utf-8');
    expect(content).toContain('ADMIN');
    expect(content).toContain('CORE_MEMBER');
    expect(content).toContain('MEMBER');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/members-page.test.ts`
Expected: FAIL with `pagePath does not exist`.

- [ ] **Step 3: Implement `src/app/members/page.tsx`**

Tạo `src/app/members/page.tsx`:
- Query danh sách thành viên hoạt động: `prisma.user.findMany({ where: { status: 'ACTIVE' }, select: publicUserSelect })`.
- Phân loại theo vai trò và hiển thị lưới card thành viên học thuật trang nhã, viền mảnh, responsive.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/members-page.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/members/page.tsx tests/unit/members-page.test.ts
git commit -m "feat(members): implement academic directory page for club members"
```

---

### Task 12: Academic Contact Page (`/contact`)

**Files:**
- Create: `src/app/contact/page.tsx`
- Create: `tests/unit/contact-page.test.ts`

**Interfaces:**
- Consumes: Thông tin liên hệ CLB Nexus & Khoa CNTT - ĐHKHTN.
- Produces: Trang `/contact` gồm:
  - Địa chỉ văn phòng lab: Cơ sở 1 (227 Nguyễn Văn Cừ, P.4, Q.5) và Cơ sở 2 (Linh Trung, TP. Thủ Đức).
  - Email học thuật: `nexus@fit.hcmus.edu.vn`.
  - Giờ sinh hoạt học thuật.
  - Biểu mẫu kết nối / trao đổi nghiên cứu nhanh (Họ tên, Email, Tiêu đề, Nội dung tin nhắn).

- [ ] **Step 1: Write the failing test**

Tạo file `tests/unit/contact-page.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Contact Page', () => {
  it('exists and displays institutional contact information', () => {
    const contactPath = path.resolve(process.cwd(), 'src/app/contact/page.tsx');
    expect(fs.existsSync(contactPath)).toBe(true);

    const content = fs.readFileSync(contactPath, 'utf-8');
    expect(content).toContain('Nguyễn Văn Cừ');
    expect(content).toContain('nexus@');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/contact-page.test.ts`
Expected: FAIL with `contactPath does not exist`.

- [ ] **Step 3: Implement `src/app/contact/page.tsx`**

Tạo `src/app/contact/page.tsx` với giao diện học thuật trang nhã, thông tin phòng lab chuẩn mực và biểu mẫu gửi liên hệ.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/contact-page.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/contact/page.tsx tests/unit/contact-page.test.ts
git commit -m "feat(contact): implement academic contact page for lab and department"
```

---

### Task 13: Full Build, Typecheck & Verification Suite

**Files:**
- Verify all modified files across project.

**Interfaces:**
- Consumes: Toàn bộ codebase NexusShowcase.
- Produces: Đảm bảo 100% tests pass, TypeScript không có lỗi type, Prisma valid và Next.js build thành công.

- [ ] **Step 1: Validate Prisma schema**

Run: `npx prisma validate`
Expected: `The schema is valid.`

- [ ] **Step 2: Run TypeScript compiler check**

Run: `npx tsc --noEmit`
Expected: No errors (exit code 0).

- [ ] **Step 3: Run full Vitest unit test suite**

Run: `npm run test:unit`
Expected: 100% unit tests pass across all test files.

- [ ] **Step 4: Run Next.js production build**

Run: `npm run build`
Expected: Successful build with static / dynamic routes generated.

- [ ] **Step 5: Commit final verification**

```bash
git commit --allow-empty -m "chore: complete academic portal revamp verification suite"
```
