# Members Directory Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the public members directory into three clear role groups, rank regular members by published contributions, and add paginated main and full-list views.

**Architecture:** Keep the existing Prisma roles as the public grouping source. Put member selection, deterministic contribution sorting, and page normalization in a focused server-side library; render all groups through shared card, section-heading, and pagination components. `/members` shows all ADMIN and CORE_MEMBER users plus six MEMBER users per page, while `/members/all` shows only MEMBER users with twelve per page.

**Tech Stack:** Next.js 15 App Router, React 19 server components, TypeScript, Prisma 6, Tailwind CSS, Lucide React, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-14-members-directory-redesign.md`

## Global Constraints

- Keep the role mapping exactly: `ADMIN` → `Ban Chủ Nhiệm`, `CORE_MEMBER` → `Nghiên cứu viên & Thành viên Kỳ cựu`, `MEMBER` → `Thành viên`.
- Do not add or migrate database roles.
- Rank by published contribution count descending, then full name ascending.
- `/members` shows six MEMBER records per page; `/members/all` shows twelve.
- ADMIN and CORE_MEMBER groups always show all matching active users on `/members`.
- Remove the visible `Nhân sự & Nghiên cứu viên`, the paragraph beginning `Mạng lưới sinh viên...`, `Danh bạ`, and the old statistics row.
- Header copy is exactly `Thành viên Robotics & IoT Lab` and `{total} thành viên`.
- The desktop `Users` header icon remains in the left gutter at approximately 64–72 px, matching the visual height of the former three-line stack; scale it down responsively on mobile.
- Do not add client-side state, an API route, or a dependency for pagination.
- Preserve the untracked file `public/uploads/thumbnails/8a17a862-d811-4be2-959f-ab1c2ee03694.png`; never stage it.

## File map

- Create `src/lib/member-directory.ts`: public member query shape, group labels, stable sorting, page parsing, and pagination.
- Create `src/components/member-card.tsx`: reusable equal-height public member card.
- Create `src/components/member-section-heading.tsx`: consistent section icon/title/count treatment.
- Create `src/components/member-pagination.tsx`: accessible server-link pagination.
- Modify `src/app/members/page.tsx`: redesigned header and three-group directory.
- Create `src/app/members/all/page.tsx`: dedicated paginated MEMBER-only list.
- Modify `tests/unit/members-page.test.ts`: page composition and copy regression coverage.
- Create `tests/unit/member-directory.test.ts`: executable sorting and page-boundary tests.

---

### Task 1: Member directory data contracts and pagination

**Files:**
- Create: `src/lib/member-directory.ts`
- Create: `tests/unit/member-directory.test.ts`

**Interfaces:**
- Produces: `MemberDirectoryEntry`, `MEMBER_GROUP_LABELS`, `sortMembersByContribution()`, `normalizeMemberPage()`, and `paginateMembers()`.
- Consumes: Prisma `Role`; no React or request objects.

- [ ] **Step 1: Write failing tests for role labels and deterministic ranking**

Create `tests/unit/member-directory.test.ts` with literal fixtures:

```ts
import { describe, expect, it } from 'vitest';
import {
  MEMBER_GROUP_LABELS,
  normalizeMemberPage,
  paginateMembers,
  sortMembersByContribution,
  type MemberDirectoryEntry,
} from '@/lib/member-directory';

const member = (
  id: string,
  fullName: string,
  contributions: number,
): MemberDirectoryEntry => ({
  id,
  fullName,
  avatarUrl: null,
  bio: null,
  githubUrl: null,
  linkedinUrl: null,
  googleScholarUrl: null,
  portfolioUrl: null,
  studentId: null,
  role: 'MEMBER',
  _count: { contributions },
});

describe('member directory', () => {
  it('maps the three public groups to the approved labels', () => {
    expect(MEMBER_GROUP_LABELS).toEqual({
      ADMIN: 'Ban Chủ Nhiệm',
      CORE_MEMBER: 'Nghiên cứu viên & Thành viên Kỳ cựu',
      MEMBER: 'Thành viên',
    });
  });

  it('orders published contributions descending and breaks ties by name', () => {
    const result = sortMembersByContribution([
      member('1', 'Minh', 2),
      member('2', 'An', 4),
      member('3', 'Bình', 4),
    ]);
    expect(result.map(({ id }) => id)).toEqual(['2', '3', '1']);
  });

  it.each([
    { raw: undefined, total: 3, expected: 1 },
    { raw: 'abc', total: 3, expected: 1 },
    { raw: '-2', total: 3, expected: 1 },
    { raw: '9', total: 3, expected: 3 },
  ])('normalizes page $raw to $expected', ({ raw, total, expected }) => {
    expect(normalizeMemberPage(raw, total)).toBe(expected);
  });

  it('returns one page slice and page metadata', () => {
    const result = paginateMembers(
      Array.from({ length: 8 }, (_, index) => member(String(index), `User ${index}`, 8 - index)),
      '2',
      6,
    );
    expect(result.items.map(({ id }) => id)).toEqual(['6', '7']);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.totalItems).toBe(8);
  });
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run: `npx vitest run tests/unit/member-directory.test.ts`

Expected: FAIL because `@/lib/member-directory` does not exist.

- [ ] **Step 3: Implement the pure directory helpers**

Create `src/lib/member-directory.ts`:

```ts
import type { Role } from '@prisma/client';
import type { PublicUser } from '@/lib/public-user';

export type PublicMemberRole = Extract<Role, 'ADMIN' | 'CORE_MEMBER' | 'MEMBER'>;

export type MemberDirectoryEntry = PublicUser & {
  studentId: string | null;
  role: PublicMemberRole;
  _count: { contributions: number };
};

export const MEMBER_GROUP_LABELS: Record<PublicMemberRole, string> = {
  ADMIN: 'Ban Chủ Nhiệm',
  CORE_MEMBER: 'Nghiên cứu viên & Thành viên Kỳ cựu',
  MEMBER: 'Thành viên',
};

export function sortMembersByContribution<T extends MemberDirectoryEntry>(members: T[]): T[] {
  return [...members].sort(
    (left, right) =>
      right._count.contributions - left._count.contributions ||
      left.fullName.localeCompare(right.fullName, 'vi'),
  );
}

export function normalizeMemberPage(rawPage: string | undefined, totalPages: number): number {
  const parsed = Number.parseInt(rawPage ?? '1', 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(parsed, Math.max(totalPages, 1));
}

export function paginateMembers<T>(items: T[], rawPage: string | undefined, pageSize: number) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = normalizeMemberPage(rawPage, totalPages);
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page, totalPages, totalItems };
}
```

- [ ] **Step 4: Run the helper tests and verify GREEN**

Run: `npx vitest run tests/unit/member-directory.test.ts`

Expected: 4 tests PASS.

- [ ] **Step 5: Commit the data contract**

```powershell
git add -- src/lib/member-directory.ts tests/unit/member-directory.test.ts
git commit -m "feat(members): add directory sorting and pagination"
```

---

### Task 2: Shared member presentation components

**Files:**
- Create: `src/components/member-card.tsx`
- Create: `src/components/member-section-heading.tsx`
- Create: `src/components/member-pagination.tsx`
- Modify: `tests/unit/members-page.test.ts`

**Interfaces:**
- Consumes: `MemberDirectoryEntry` and `PublicMemberRole` from `src/lib/member-directory.ts`.
- Produces: `MemberCard({ member, group })`, `MemberSectionHeading({ icon, title, count, tone })`, and `MemberPagination({ page, totalPages, basePath })`.

- [ ] **Step 1: Add failing component contract tests**

Append a test to `tests/unit/members-page.test.ts` that reads the real component sources and checks the user-visible/accessibility contracts:

```ts
it('uses shared accessible cards and server-link pagination', () => {
  const card = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/member-card.tsx'),
    'utf-8',
  );
  const pagination = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/member-pagination.tsx'),
    'utf-8',
  );

  expect(card).toContain('aria-label={`GitHub của ${member.fullName}`}');
  expect(card).toContain('aria-label={`LinkedIn của ${member.fullName}`}');
  expect(card).toContain('h-full');
  expect(card).toContain('mt-auto');
  expect(card).toContain('công trình');
  expect(pagination).toContain('aria-current={pageNumber === page ? \'page\' : undefined}');
  expect(pagination).toContain('Trang trước');
  expect(pagination).toContain('Trang sau');
});
```

- [ ] **Step 2: Run the component contract test and verify RED**

Run: `npx vitest run tests/unit/members-page.test.ts`

Expected: FAIL with missing `src/components/member-card.tsx`.

- [ ] **Step 3: Implement `MemberCard`**

Build a server component with these exact behaviors:

```tsx
import Link from 'next/link';
import { ArrowRight, FileText, Github, Linkedin } from 'lucide-react';
import {
  MEMBER_GROUP_LABELS,
  type MemberDirectoryEntry,
  type PublicMemberRole,
} from '@/lib/member-directory';

const tones: Record<PublicMemberRole, { avatar: string; accent: string }> = {
  ADMIN: { avatar: 'bg-purple-700 text-white', accent: 'text-purple-700' },
  CORE_MEMBER: { avatar: 'bg-[#0F294A] text-white', accent: 'text-[#0F294A]' },
  MEMBER: { avatar: 'bg-slate-100 text-slate-700', accent: 'text-emerald-700' },
};

export function MemberCard({
  member,
  group,
}: {
  member: MemberDirectoryEntry;
  group: PublicMemberRole;
}) {
  const tone = tones[group];
  return (
    <article className="panel-public h-full p-4 sm:p-5 flex flex-col">
      <div className="flex items-start gap-3.5">
        {member.avatarUrl ? (
          <img src={member.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
        ) : (
          <div aria-hidden="true" className={`w-12 h-12 rounded-full flex items-center justify-center font-bold shrink-0 ${tone.avatar}`}>
            {member.fullName.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Link href={`/members/${member.id}`} className="font-bold text-slate-900 hover:text-[#0F294A] line-clamp-2">
            {member.fullName}
          </Link>
          <p className={`mt-1 text-xs font-semibold ${tone.accent}`}>{MEMBER_GROUP_LABELS[group]}</p>
          {member.studentId && <p className="mt-1 text-xs font-mono text-slate-500">MSSV: {member.studentId}</p>}
        </div>
      </div>
      {member.bio && <p className="mt-4 text-sm leading-relaxed text-slate-600 line-clamp-3">{member.bio}</p>}
      <footer className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <FileText aria-hidden="true" className="w-4 h-4" />
          <span>{member._count.contributions} công trình</span>
          {member.githubUrl && (
            <a href={member.githubUrl} target="_blank" rel="noreferrer" aria-label={`GitHub của ${member.fullName}`}>
              <Github aria-hidden="true" className="w-4 h-4" />
            </a>
          )}
          {member.linkedinUrl && (
            <a href={member.linkedinUrl} target="_blank" rel="noreferrer" aria-label={`LinkedIn của ${member.fullName}`}>
              <Linkedin aria-hidden="true" className="w-4 h-4" />
            </a>
          )}
        </div>
        <Link href={`/members/${member.id}`} className="inline-flex items-center gap-1 font-bold text-[#0F294A]">
          Xem hồ sơ <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
        </Link>
      </footer>
    </article>
  );
}
```

Use `img` only when `avatarUrl` exists, with `alt=""` because the adjacent full name supplies the identity. Add `aria-hidden="true"` to decorative Lucide icons. Clamp bios consistently to three lines. Do not render blank student ID, bio, or social-link containers.

- [ ] **Step 4: Implement the section heading and pagination components**

`MemberSectionHeading` accepts a Lucide component type, title, count, and tone. It renders the icon in the established `heading-gutter-icon` position, followed by one row containing the title and compact count badge.

```tsx
import type { LucideIcon } from 'lucide-react';

export function MemberSectionHeading({
  icon: Icon,
  title,
  count,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  count: number;
  tone: string;
}) {
  return (
    <div className="heading-gutter flex items-center gap-2 mb-4">
      <Icon aria-hidden="true" className={`heading-gutter-icon w-6 h-6 ${tone}`} />
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <span className="px-2 py-0.5 rounded-md border border-slate-200 text-xs font-bold text-slate-600">
        {count}
      </span>
    </div>
  );
}
```

`MemberPagination` returns `null` for `totalPages <= 1`. Otherwise it renders a `<nav aria-label="Phân trang thành viên">` with:

```tsx
const hrefFor = (pageNumber: number) =>
  pageNumber === 1 ? basePath : `${basePath}?page=${pageNumber}`;
```

Render previous/next as non-clickable `<span aria-disabled="true">` at the boundaries and as `Link` otherwise. Render numbered links from `1` through `totalPages`; add `aria-current="page"` to the active number. Use existing navy action styles and 36–40 px minimum control height.

The numbered-link core must be literal and deterministic:

```tsx
{Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
  <Link
    key={pageNumber}
    href={hrefFor(pageNumber)}
    aria-current={pageNumber === page ? 'page' : undefined}
    className={pageNumber === page ? activePageClass : inactivePageClass}
  >
    {pageNumber}
  </Link>
))}
```

- [ ] **Step 5: Run tests and type-check the components**

Run:

```powershell
npx vitest run tests/unit/members-page.test.ts tests/unit/member-directory.test.ts
npx tsc --noEmit
```

Expected: all selected tests PASS and TypeScript exits 0.

- [ ] **Step 6: Commit shared member components**

```powershell
git add -- src/components/member-card.tsx src/components/member-section-heading.tsx src/components/member-pagination.tsx tests/unit/members-page.test.ts
git commit -m "feat(members): add shared directory components"
```

---

### Task 3: Redesign the main members page

**Files:**
- Modify: `src/app/members/page.tsx`
- Modify: `tests/unit/members-page.test.ts`

**Interfaces:**
- Consumes: `MemberCard`, `MemberSectionHeading`, `MemberPagination`, `MEMBER_GROUP_LABELS`, `sortMembersByContribution()`, and `paginateMembers()`.
- Produces: Next.js page signature `MembersDirectoryPage({ searchParams }: { searchParams: Promise<{ page?: string }> })`.

- [ ] **Step 1: Replace the existing page-source test with failing header and grouping expectations**

Update the first test in `tests/unit/members-page.test.ts`:

```ts
it('renders the approved header, hierarchy, and six-member preview', () => {
  const content = fs.readFileSync(
    path.resolve(process.cwd(), 'src/app/members/page.tsx'),
    'utf-8',
  );

  expect(content).toContain('Thành viên Robotics &amp; IoT Lab');
  expect(content).toContain('{members.length} thành viên');
  expect(content).not.toContain('Nhân sự &amp; Nghiên cứu viên');
  expect(content).not.toContain('Mạng lưới sinh viên');
  expect(content).not.toContain('Danh bạ');
  expect(content).toContain('w-12 h-12 sm:w-[68px] sm:h-[68px]');
  expect(content).toContain("MEMBER_GROUP_LABELS.ADMIN");
  expect(content).toContain("MEMBER_GROUP_LABELS.CORE_MEMBER");
  expect(content).toContain("MEMBER_GROUP_LABELS.MEMBER");
  expect(content).toContain('paginateMembers(regularMembers, params.page, 6)');
  expect(content).toContain('href="/members/all"');
});
```

- [ ] **Step 2: Run the page test and verify RED**

Run: `npx vitest run tests/unit/members-page.test.ts`

Expected: FAIL because the old title, description, group names, and unpaginated rendering remain.

- [ ] **Step 3: Rewrite the server page around the shared contracts**

Change the page signature and query parameters:

```tsx
export default async function MembersDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
```

Keep one `prisma.user.findMany` constrained to `status: 'ACTIVE'`, the existing public fields, `studentId`, and the filtered published contribution count. Split and sort each role:

```ts
const advisors = sortMembersByContribution(members.filter((member) => member.role === 'ADMIN'));
const experienced = sortMembersByContribution(members.filter((member) => member.role === 'CORE_MEMBER'));
const regularMembers = sortMembersByContribution(members.filter((member) => member.role === 'MEMBER'));
const regularPage = paginateMembers(regularMembers, params.page, 6);
```

Replace the header with one `heading-gutter` containing:

```tsx
<Users
  aria-hidden="true"
  className="heading-gutter-icon w-12 h-12 sm:w-[68px] sm:h-[68px] text-[#0F294A]"
/>
<div className="min-w-0">
  <h1>Thành viên Robotics &amp; IoT Lab</h1>
  <p>{members.length} thành viên</p>
</div>
```

Do not retain the eyebrow, long paragraph, or statistics row.

Render ADMIN and CORE_MEMBER sections only when their arrays are non-empty and map every entry through `MemberCard`. Render the MEMBER section with `regularPage.items`, followed by one action row containing `MemberPagination` and the `/members/all` link. Use a one/two/three-column responsive grid.

When `regularMembers.length === 0`, show `Chưa có thành viên được công bố.` and omit pagination. Preserve `Navbar`, `AcademicFooter`, `max-w-6xl`, and the existing page-level spacing conventions.

- [ ] **Step 4: Run main page tests and type-check**

Run:

```powershell
npx vitest run tests/unit/members-page.test.ts tests/unit/member-directory.test.ts
npx tsc --noEmit
```

Expected: selected tests PASS and TypeScript exits 0.

- [ ] **Step 5: Commit the redesigned main directory**

```powershell
git add -- src/app/members/page.tsx tests/unit/members-page.test.ts
git commit -m "feat(members): redesign directory hierarchy"
```

---

### Task 4: Add the full MEMBER-only directory

**Files:**
- Create: `src/app/members/all/page.tsx`
- Modify: `tests/unit/members-page.test.ts`

**Interfaces:**
- Consumes: the same directory helper and shared UI components as `/members`.
- Produces: Next.js page signature `AllMembersPage({ searchParams }: { searchParams: Promise<{ page?: string }> })` at `/members/all`.

- [ ] **Step 1: Add a failing route contract test**

Append to `tests/unit/members-page.test.ts`:

```ts
it('provides a MEMBER-only full directory with twelve records per page', () => {
  const fullPagePath = path.resolve(process.cwd(), 'src/app/members/all/page.tsx');
  expect(fs.existsSync(fullPagePath)).toBe(true);
  const content = fs.readFileSync(fullPagePath, 'utf-8');
  expect(content).toContain("role: 'MEMBER'");
  expect(content).toContain("status: 'ACTIVE'");
  expect(content).toContain('paginateMembers(members, params.page, 12)');
  expect(content).toContain('Tất cả thành viên');
  expect(content).not.toContain("role: 'ADMIN'");
  expect(content).not.toContain("role: 'CORE_MEMBER'");
});
```

- [ ] **Step 2: Run the route test and verify RED**

Run: `npx vitest run tests/unit/members-page.test.ts`

Expected: FAIL because `src/app/members/all/page.tsx` does not exist.

- [ ] **Step 3: Implement `/members/all`**

Create a server page that:

- Awaits `searchParams: Promise<{ page?: string }>`.
- Queries `prisma.user.findMany` with `where: { status: 'ACTIVE', role: 'MEMBER' }`.
- Selects `...publicUserSelect`, `studentId`, and filtered published contribution count.
- Calls `sortMembersByContribution()` then `paginateMembers(members, params.page, 12)`.
- Renders `Navbar`, a compact header with a back link to `/members`, title `Tất cả thành viên`, and subtitle `${members.length} thành viên`.
- Maps only the current page through `<MemberCard member={member} group="MEMBER" />` in the shared responsive grid.
- Renders `<MemberPagination page={page.page} totalPages={page.totalPages} basePath="/members/all" />` only when records exist.
- Shows `Chưa có thành viên được công bố.` when the list is empty.
- Ends with `AcademicFooter`.

- [ ] **Step 4: Verify the dedicated route**

Run:

```powershell
npx vitest run tests/unit/members-page.test.ts tests/unit/member-directory.test.ts
npx tsc --noEmit
```

Expected: selected tests PASS and TypeScript exits 0.

- [ ] **Step 5: Commit the full directory route**

```powershell
git add -- src/app/members/all/page.tsx tests/unit/members-page.test.ts
git commit -m "feat(members): add full paginated directory"
```

---

### Task 5: Visual consistency and complete verification

**Files:**
- Modify only if verification finds a scoped issue: `src/components/member-card.tsx`, `src/components/member-section-heading.tsx`, `src/components/member-pagination.tsx`, `src/app/members/page.tsx`, `src/app/members/all/page.tsx`
- Test only if a defect is found: `tests/unit/member-directory.test.ts`, `tests/unit/members-page.test.ts`

**Interfaces:**
- Consumes the completed directory pages and components.
- Produces a verified feature with no additional API or schema changes.

- [ ] **Step 1: Run focused tests**

Run:

```powershell
npx vitest run tests/unit/member-directory.test.ts tests/unit/members-page.test.ts tests/unit/sitewide-panel-audit.test.ts tests/unit/heading-gutter.test.ts
```

Expected: all focused tests PASS.

- [ ] **Step 2: Run the full unit suite**

Run: `npm run test:unit`

Expected: all unit tests PASS. Do not use bare `npm test` because this repository requires `TEST_DATABASE_URL` for integration suites.

- [ ] **Step 3: Run production build, then TypeScript sequentially**

Run:

```powershell
npm run build
npx tsc --noEmit
```

Expected: Next.js builds `/members` and `/members/all`, then TypeScript exits 0. Run these sequentially because both can touch `.next/types`.

- [ ] **Step 4: Review responsive and accessibility contracts**

Inspect the rendered pages at approximately 375 px, 768 px, and 1280 px widths. Confirm:

- The gutter icon scales down on mobile and is 68 px on desktop.
- Title/count remain on the content edge and no removed copy appears.
- Grids render one, two, and three columns respectively.
- `/members` shows no more than six MEMBER cards per page.
- ADMIN and CORE_MEMBER lists are not truncated.
- Card footers align and optional social controls do not leave empty placeholders.
- Every icon-only link has an accessible name and keyboard focus remains visible.
- Previous/next disabled states are not links, and current pages expose `aria-current="page"`.

- [ ] **Step 5: Check the final diff and commit any verification-only fixes**

Run:

```powershell
git diff --check
git status --short --branch
```

Confirm the thumbnail remains untracked and unstaged. If this task required no corrections, do not create an empty commit. If scoped corrections were required:

```powershell
git add -- src/components/member-card.tsx src/components/member-section-heading.tsx src/components/member-pagination.tsx src/app/members/page.tsx src/app/members/all/page.tsx tests/unit/member-directory.test.ts tests/unit/members-page.test.ts
git commit -m "fix(members): polish directory responsiveness"
```
