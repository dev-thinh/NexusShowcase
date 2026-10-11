# Academic Research Lab UI/UX & Real Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Transform NexusShowcase into a premier academic research lab repository with authentic single-admin authentication (`admin01` / `admin123`), admin-driven member creation, Swiss Modernism 2.0 academic typography and styling, 1-click BibTeX/APA/IEEE citation generator, full-text PDF document handling, research domain filtering, universal academic footer, and scholar portfolio metrics.

**Architecture:** Next.js 15 App Router with React Server Components, Server Actions for mutations, Tailwind CSS + Google Fonts (`Crimson Pro`, `Inter`, `JetBrains Mono`) with Swiss Modernism 2.0 design tokens, NextAuth v5 credentials provider supporting username/email authentication, and Prisma ORM for PostgreSQL/SQLite persistence.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.7, Tailwind CSS 3.4, Prisma ORM 6.0, NextAuth v5 beta, bcryptjs, Zod, Vitest.

## Global Constraints

- **Sole Initial Account:** Exactly 1 initial admin account seeded: username `admin01`, password `admin123`, role `ADMIN`.
- **Zero Mock UI:** No 1-click test account buttons, no fake account cards on the login page, no mock data leftover.
- **Admin Member Creation:** Admin can create new member accounts with full name, email/username, student ID, role (`MEMBER` or `CORE_MEMBER`), and password.
- **Academic Standard:** Serif headlines (`Crimson Pro`), clean UI (`Inter`), monospace code/citation (`JetBrains Mono`), institutional navy (`#0F294A`), high contrast (WCAG AAA >= 7:1 for text).
- **No breaking changes:** All tests must pass, production build must succeed with zero errors.

---

### Task 1: Real-world Authentication & Seed Database (`admin01` / `admin123`)

**Files:**
- Modify: `src/lib/auth.ts:7-37`
- Modify: `src/app/login/login-form.tsx:1-150`
- Modify: `src/app/login/page.tsx:60-126`
- Modify: `prisma/seed.ts:1-70`
- Test: `tests/integration/auth.test.ts`

**Interfaces:**
- Consumes: Prisma `User` model, NextAuth v5 `CredentialsProvider`.
- Produces: Flexible username/email authentication allowing `admin01` or `admin01@nexus.hcmus.edu.vn`.

- [x] **Step 1: Write failing test in `tests/integration/auth.test.ts` for `admin01` login**

```typescript
// Add test verifying admin01 login credential lookup
it('should authorize admin01 with admin123', async () => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'admin01' },
        { email: 'admin01@nexus.hcmus.edu.vn' },
      ],
    },
  });
  expect(user).toBeDefined();
  expect(user?.role).toBe('ADMIN');
  const isMatch = await bcrypt.compare('admin123', user!.passwordHash!);
  expect(isMatch).toBe(true);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/integration/auth.test.ts`  
Expected: FAIL (User `admin01` does not exist in DB yet).

- [x] **Step 3: Update `src/lib/auth.ts` to allow username and email**

```typescript
const loginSchema = z.object({
  email: z.string().min(3),
  password: z.string().min(6),
});

// In authorize:
const identifier = parsed.data.email.trim().toLowerCase();
const user = await prisma.user.findFirst({
  where: {
    OR: [
      { email: identifier },
      { email: `${identifier}@nexus.hcmus.edu.vn` },
    ],
  },
});
```

- [x] **Step 4: Update `prisma/seed.ts` to seed ONLY `admin01`**

```typescript
// Clear existing mock data and create solely admin01
await prisma.itemAttachment.deleteMany();
await prisma.itemLink.deleteMany();
await prisma.itemContributor.deleteMany();
await prisma.itemTag.deleteMany();
await prisma.showcaseItem.deleteMany();
await prisma.tag.deleteMany();
await prisma.user.deleteMany();

const adminPasswordHash = await bcrypt.hash('admin123', 10);
await prisma.user.create({
  data: {
    email: 'admin01',
    fullName: 'Quản Trị Viên Học Thuật (Admin)',
    passwordHash: adminPasswordHash,
    role: 'ADMIN',
    status: 'ACTIVE',
    bio: 'Tài khoản Quản trị viên Phòng Lab Nghiên cứu Khoa học & CLB Nexus, Khoa CNTT - ĐH KHTN ĐHQG-HCM.',
  },
});
```

- [x] **Step 5: Run seed and run tests to verify**

Run: `npm run db:seed` and `npx vitest run tests/integration/auth.test.ts`  
Expected: PASS.

- [x] **Step 6: Remove mock accounts and test buttons from `src/app/login/login-form.tsx` and `src/app/login/page.tsx`**

Replace `QUICK_ACCOUNTS` and demo cards with a focused, academic login card:
- Username/Email field (placeholder: "admin01 hoặc email...")
- Password field with toggle visibility
- Submit button with loading state
- Security & Academic affiliation notice

- [x] **Step 7: Commit changes**

```bash
git add src/lib/auth.ts src/app/login/login-form.tsx src/app/login/page.tsx prisma/seed.ts tests/integration/auth.test.ts
git commit -m "feat(auth): configure sole admin01 account and remove mock login UI"
```

---

### Task 2: Admin Member Creation Server Action & Management UI

**Files:**
- Create: `src/components/admin-create-member-modal.tsx`
- Modify: `src/actions/admin-actions.ts`
- Modify: `src/app/admin/members/page.tsx`
- Create: `tests/integration/admin-create-member.test.ts`

**Interfaces:**
- Consumes: `prisma.user.create`, `bcrypt.hash`.
- Produces: `createMemberAction(adminId: string, input: CreateMemberInput)` server action, `AdminCreateMemberModal` component.

- [x] **Step 1: Write integration test for `createMemberAction`**

Create `tests/integration/admin-create-member.test.ts` testing:
1. Rejection if non-admin attempts to create member.
2. Successful creation of a new `MEMBER` and a new `CORE_MEMBER` with student ID and hashed password.
3. Verification that newly created member can authenticate.

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/integration/admin-create-member.test.ts`  
Expected: FAIL (`createMemberAction` not defined).

- [x] **Step 3: Implement `createMemberAction` in `src/actions/admin-actions.ts`**

```typescript
export interface CreateMemberInput {
  fullName: string;
  email: string;
  studentId?: string;
  role: 'MEMBER' | 'CORE_MEMBER';
  password?: string;
}

export async function createMemberAction(adminId: string, input: CreateMemberInput) {
  // Validate admin permission
  // Check for duplicate email/username
  // Hash password (default: 'member123')
  // Create user with status: 'ACTIVE'
  // Return { success: true, user }
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/integration/admin-create-member.test.ts`  
Expected: PASS.

- [x] **Step 5: Create `AdminCreateMemberModal` in `src/components/admin-create-member-modal.tsx`**

- Modal dialog with Form inputs:
  - Họ và tên (Full Name) - required
  - Tên đăng nhập / Email - required
  - Mã số sinh viên (MSSV) - optional
  - Phân quyền ban đầu: Radio/Select `MEMBER` (Thành viên thường) / `CORE_MEMBER` (Thành viên nòng cốt)
  - Mật khẩu khởi tạo: text field with default `member123`
  - Nút "Tạo tài khoản" with loading spinner and inline error handling.

- [x] **Step 6: Update `src/app/admin/members/page.tsx` with Create Member button and modal**

- Top action bar includes: "Tạo tài khoản thành viên mới" button.
- Clean academic table displaying active members, role badges, student ID, and role toggle.

- [x] **Step 7: Commit changes**

```bash
git add src/actions/admin-actions.ts src/components/admin-create-member-modal.tsx src/app/admin/members/page.tsx tests/integration/admin-create-member.test.ts
git commit -m "feat(admin): implement member creation action and management modal"
```

---

### Task 3: Academic Design System & Typography (Swiss Modernism 2.0)

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/navbar.tsx`
- Create: `src/components/academic-footer.tsx`

**Interfaces:**
- Consumes: Google Fonts (`Crimson Pro`, `Inter`, `JetBrains Mono`).
- Produces: Institutional tokens, serif typography classes, responsive `AcademicFooter`.

- [x] **Step 1: Import Google Fonts and configure CSS variables in `src/app/globals.css`**

Import fonts:
```css
@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
```
Define tokens:
- `--font-serif`: 'Crimson Pro', Georgia, serif;
- `--font-sans`: 'Inter', system-ui, sans-serif;
- `--font-mono`: 'JetBrains Mono', monospace;
- Institutional navy colors: `--navy-950: #081726`, `--navy-900: #0F294A`, `--navy-800: #1A3E6B`.

- [x] **Step 2: Update `tailwind.config.ts` with font families and academic colors**

Add `fontFamily`:
```typescript
fontFamily: {
  serif: ['Crimson Pro', 'Georgia', 'serif'],
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
},
colors: {
  navy: {
    50: '#F0F5FA',
    100: '#DFEAF5',
    700: '#1A3E6B',
    800: '#143155',
    900: '#0F294A',
    950: '#081726',
  },
}
```

- [x] **Step 3: Update `src/components/navbar.tsx`**

- Institutional logo and branding: "HCMUS Nexus Academic Lab" with scholarly seal icon.
- Navigation links styled with clean Swiss Modernism typographic hierarchy.
- Responsive mobile drawer or clean navigation layout.

- [x] **Step 4: Create `src/components/academic-footer.tsx`**

Institutional academic footer including:
- Official branding: Nexus Academic Showcase • Khoa Công nghệ Thông tin • ĐH Khoa học Tự nhiên - ĐHQG-HCM.
- Campus address: 227 Nguyễn Văn Cừ, Quận 5, TP. Hồ Chí Minh.
- Academic links: Google Scholar, Faculty of IT Portal (`fit.hcmus.edu.vn`), GitHub Lab.
- Citation integrity & Open Access research statement.

- [x] **Step 5: Test layout rendering and build**

Run: `npm run build` to verify font imports and CSS bundling.

- [x] **Step 6: Commit changes**

```bash
git add src/app/globals.css tailwind.config.ts src/app/layout.tsx src/components/navbar.tsx src/components/academic-footer.tsx
git commit -m "feat(design): implement Swiss Modernism 2.0 academic typography and footer"
```

---

### Task 4: Academic Citation Generator (BibTeX, APA, IEEE Modal)

**Files:**
- Create: `src/lib/citation.ts`
- Create: `tests/unit/citation.test.ts`
- Create: `src/components/citation-modal.tsx`
- Modify: `src/components/showcase-card.tsx`
- Modify: `src/app/showcase/[slug]/page.tsx`

**Interfaces:**
- Consumes: `ShowcaseItem` data (title, slug, publishedYear, issuer, contributors).
- Produces: `generateBibTeX(item)`, `generateAPA(item)`, `generateIEEE(item)`, and interactive `CitationModal`.

- [x] **Step 1: Write unit tests in `tests/unit/citation.test.ts`**

Test that:
1. `generateBibTeX` outputs standard BibTeX `@inproceedings` or `@article` with proper author formatting (`Lastname, Firstname and ...`), title, year, venue (`issuer`), and URL.
2. `generateAPA` outputs valid APA 7th string format.
3. `generateIEEE` outputs valid IEEE reference format.

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/citation.test.ts`  
Expected: FAIL (`citation.ts` does not exist).

- [x] **Step 3: Implement `src/lib/citation.ts`**

Format functions for BibTeX, APA 7, and IEEE referencing standard with clean string normalization.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/citation.test.ts`  
Expected: PASS.

- [x] **Step 5: Create `src/components/citation-modal.tsx`**

- Interactive tabs: **BibTeX**, **APA 7th**, **IEEE**.
- Formatted code block with syntax styling for BibTeX.
- One-click "Sao chép / Copy" button with clipboard write and instant visual feedback ("Đã sao chép!").
- "Tải file .bib / Download BibTeX" button for saving directly.

- [x] **Step 6: Integrate Citation button into `ShowcaseCard` and `showcase/[slug]/page.tsx`**

- Prominent "Trích dẫn / Cite" button alongside paper actions.

- [x] **Step 7: Commit changes**

```bash
git add src/lib/citation.ts tests/unit/citation.test.ts src/components/citation-modal.tsx src/components/showcase-card.tsx src/app/showcase/[slug]/page.tsx
git commit -m "feat(academic): implement 1-click BibTeX, APA, and IEEE citation generator"
```

---

### Task 5: Full-Text PDF & Attachments Support in Detail Page & Creation Form

**Files:**
- Modify: `src/actions/showcase-actions.ts`
- Modify: `src/components/item-form.tsx`
- Modify: `src/app/showcase/[slug]/page.tsx`
- Test: `tests/integration/showcase-actions.test.ts`

**Interfaces:**
- Consumes: `/api/upload` (supports PDF type), Prisma `item_attachments`.
- Produces: Full-text PDF viewer / download section and attachment upload during item creation.

- [x] **Step 1: Update `src/actions/showcase-actions.ts` to persist attachments**

```typescript
export interface AttachmentInput {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

// In createShowcaseItemAction:
attachments: {
  create: (input.attachments || []).map((a) => ({
    fileName: a.fileName,
    fileUrl: a.fileUrl,
    fileSize: a.fileSize,
    mimeType: a.mimeType,
  })),
}
```

- [x] **Step 2: Update `tests/integration/showcase-actions.test.ts` with attachment verification**

Verify that items created with attachments store and return attachments properly.

- [x] **Step 3: Run test to verify it passes**

Run: `npx vitest run tests/integration/showcase-actions.test.ts`  
Expected: PASS.

- [x] **Step 4: Update `src/components/item-form.tsx` with PDF document upload**

- Add PDF document upload drag-and-drop zone.
- Upload to `/api/upload` with `type: 'pdf'`.
- Display list of uploaded documents with file size and remove button.
- Pass `attachments` into `createShowcaseItemAction`.

- [x] **Step 5: Update `src/app/showcase/[slug]/page.tsx` to render Attachments section**

- Add dedicated section: "Tài Liệu Toàn Văn & Phụ Lục Nghiên Cứu (Full-Text Documents & Attachments)".
- Display PDF cards with document icon, file name, formatted size (e.g., `2.4 MB`), "Xem trực tuyến" and "Tải về PDF" buttons.

- [x] **Step 6: Commit changes**

```bash
git add src/actions/showcase-actions.ts src/components/item-form.tsx src/app/showcase/[slug]/page.tsx tests/integration/showcase-actions.test.ts
git commit -m "feat(documents): implement full-text PDF document upload and showcase section"
```

---

### Task 6: Research Domain Topic Filter & Academic Scholar Profile

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/members/[id]/page.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/admin/page.tsx`
- Modify: `src/app/admin/reviews/page.tsx`

**Interfaces:**
- Consumes: `AcademicFooter`, Prisma queries for domain tags and member publication metrics.
- Produces: Topic-based exploration and Academic CV-style portfolio.

- [x] **Step 1: Add Research Topics / Domains to `src/app/page.tsx`**

- Research domain pills:
  - Tất cả lĩnh vực (All)
  - Trí tuệ Nhân tạo & Thị giác Máy tính (Computer Vision)
  - Xử lý Ngôn ngữ Tự nhiên & LLM (NLP & Language Models)
  - AI Y tế & Y sinh (Medical AI)
  - Hệ thống & Mạng (Systems & Software)
  - IoT & Edge Computing
- Connect with query parameters (`?domain=...`) and search filtering.
- Add `AcademicFooter` to bottom of page.

- [x] **Step 2: Upgrade `/members/[id]/page.tsx` to Scholar Portfolio**

- Add Academic Metrics Bar:
  - Số bài báo khoa học đã xuất bản
  - Số dự án nghiên cứu & phát triển
  - Số giải thưởng & cống hiến học thuật
- Format author contributions using academic role badges (`Advisor`, `First Author`, `Co-Author`).
- Add ORCID / Google Scholar / GitHub links with institutional styling.
- Add `AcademicFooter`.

- [x] **Step 3: Add `AcademicFooter` to `/dashboard`, `/admin`, `/admin/reviews`, `/admin/members`**

Ensure every page on the application has consistent institutional branding and footer.

- [x] **Step 4: Commit changes**

```bash
git add src/app/page.tsx src/app/members/[id]/page.tsx src/app/dashboard/page.tsx src/app/admin/page.tsx src/app/admin/reviews/page.tsx
git commit -m "feat(profile): enhance scholar portfolio metrics, domain filter, and universal footer"
```

---

### Task 7: Comprehensive Verification & Test Suite Execution

**Files:**
- Modify: `tests/e2e/workflow.test.ts`
- Modify: Any outdated test fixtures

- [x] **Step 1: Update e2e tests to use `admin01` credentials**

Ensure all tests reflect the new credentials `admin01` and `admin123`.

- [x] **Step 2: Run all tests**

Run: `npm test`  
Expected: All tests pass (32/32 tests passed across 12 test files).

- [x] **Step 3: Run full production build**

Run: `npm run build`  
Expected: `Compiled successfully`, all 11 routes valid static/dynamic rendering.

---

### Task 8: Strict RBAC & Full Member Management Suite (Create, Delete, Role Toggle, Search/Filter)

**Files:**
- Modify: `src/lib/permissions.ts` (Admin forbidden from uploading; only `CORE_MEMBER` allowed)
- Modify: `src/actions/showcase-actions.ts` (rejection for non-Core Member and Admin)
- Modify: `src/actions/admin-actions.ts` (implement `deleteMemberAction` with safety checks)
- Create: `src/components/admin-delete-member-modal.tsx` (confirmation dialog with warnings)
- Create: `src/components/admin-member-table.tsx` (real-time search, role filter tabs, toggle and delete actions)
- Modify: `src/app/admin/members/page.tsx` (integrated `AdminMemberTable`)
- Modify: `src/components/navbar.tsx` (direct Admin links to `/admin/reviews`, `/admin/members`, `/admin`)
- Modify: `src/app/dashboard/page.tsx` (tailored Admin banner directing to Admin Desk)
- Test: `tests/integration/admin-delete-member.test.ts` (4 tests verifying deletion and security boundaries)
- Test: `tests/integration/showcase-actions.test.ts` (verified Admin cannot upload)

- [x] **Step 1: Enforce Strict RBAC in `canUserUpload`**  
  Restricted to `user.role === 'CORE_MEMBER'`. Verified via `tests/unit/permissions.test.ts`.

- [x] **Step 2: Implement Member Deletion (`deleteMemberAction`)**  
  Ensured admin check, self-deletion prevention, admin deletion prevention. Verified via `tests/integration/admin-delete-member.test.ts`.

- [x] **Step 3: Member Management UI with Search & Filters**  
  Implemented `AdminMemberTable` with search by name/MSSV/email and role tabs. Added `AdminDeleteMemberModal`.

- [x] **Step 4: End-to-end verification and production compilation**  
  All 32 tests passing. Production build succeeded on 11 routes.
