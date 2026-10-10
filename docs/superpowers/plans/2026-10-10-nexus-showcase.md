# NexusShowcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hoàn chỉnh nền tảng web NexusShowcase cho câu lạc bộ học thuật/nghiên cứu khoa học để trưng bày bài báo, dự án và thành tích với mô hình phân cấp 4 tầng (Admin/Thầy chủ nhiệm duyệt bài, Core Member đại diện nhóm đăng bài, Member thường sở hữu portfolio tự động).

**Architecture:** Ứng dụng Fullstack trên Next.js 15 (App Router, Server Actions, React 19) sử dụng Tailwind CSS, Prisma ORM (SQLite cho local dev, sẵn sàng PostgreSQL cho production), Auth.js v5 quản lý phiên đăng nhập và phân quyền RBAC, tích hợp trình nhúng video và lưu trữ file cục bộ (thumbnails, PDF).

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Prisma, Auth.js (NextAuth v5), Zod, bcryptjs, Vitest, Lucide React.

## Global Constraints
- Tất cả trang Showcase công khai sử dụng React Server Components (RSC) để tối ưu SEO.
- Server Actions phải luôn kiểm tra quyền hạn (RBAC) trước khi thực hiện thao tác cơ sở dữ liệu.
- Phân cấp vai trò: `ADMIN` (Thầy chủ nhiệm), `CORE_MEMBER` (Thành viên nòng cốt được Thầy nâng cấp, có quyền tạo bài), `MEMBER` (Thành viên thường, không được tạo bài nhưng có Portfolio), `GUEST` (Khách chỉ xem).
- Bảng `ItemContributor` hỗ trợ cả 2 chế độ: Thành viên có tài khoản trong CLB và Tác giả bên ngoài / Giảng viên hướng dẫn không có tài khoản.
- Không sử dụng placeholder (TBD, TODO). Toàn bộ mã nguồn và test phải được viết chi tiết.

---

### Task 1: Khởi tạo Project & Cấu hình Môi trường Kiểm thử

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Test: `tests/unit/setup.test.ts`

**Interfaces:**
- Produces: Môi trường Next.js 15 và Vitest sẵn sàng chạy lệnh `npm test` và `npm run dev`.

- [ ] **Step 1: Viết test kiểm tra cấu hình ban đầu**

Tạo file `tests/unit/setup.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';

describe('Project Environment Setup', () => {
  it('should verify test runner works correctly', () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận test runner chưa được cài đặt**

Run: `npx vitest run tests/unit/setup.test.ts`  
Expected: Lỗi thiếu Vitest hoặc chưa khởi tạo dự án.

- [ ] **Step 3: Khởi tạo package.json và cài đặt các phụ thuộc cốt lõi**

Tạo `package.json`:
```json
{
  "name": "nexus-showcase",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@prisma/client": "^6.0.0",
    "next-auth": "5.0.0-beta.25",
    "bcryptjs": "^2.4.3",
    "zod": "^3.24.1",
    "lucide-react": "^0.468.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.5"
  },
  "devDependencies": {
    "@types/node": "^22.10.1",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/bcryptjs": "^2.4.6",
    "typescript": "^5.7.2",
    "tailwindcss": "^3.4.16",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20",
    "prisma": "^6.0.0",
    "vitest": "^2.1.8",
    "tsx": "^4.19.2"
  }
}
```

Tạo `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Tạo `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["nodeModule", "node_modules"]
}
```

Tạo `next.config.ts`:
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '30mb',
    },
  },
};

export default nextConfig;
```

Tạo `src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #f8fafc;
  --foreground: #0f172a;
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: system-ui, -apple-system, sans-serif;
}
```

Tạo `src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NexusShowcase - Academic Club Portfolio',
  description: 'Trưng bày bài báo khoa học, dự án công nghệ và thành tích CLB',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
```

Tạo `src/app/page.tsx`:
```tsx
export default function HomePage() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-blue-600">NexusShowcase</h1>
      <p className="text-slate-600 mt-2">Nền tảng trưng bày bài báo và thành tích CLB</p>
    </main>
  );
}
```

- [ ] **Step 4: Cài đặt dependencies và chạy kiểm thử**

Run: `npm install; npm test`  
Expected: `1 passed`

- [ ] **Step 5: Commit task 1**

```bash
git add .
git commit -m "feat: initialize Next.js 15 project structure and Vitest configuration"
```

---

### Task 2: Cơ sở Dữ liệu Prisma & Seed Dữ liệu Mẫu

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`
- Create: `prisma/seed.ts`
- Test: `tests/integration/prisma-schema.test.ts`

**Interfaces:**
- Produces: `prisma` client từ `@/lib/prisma` hỗ trợ các bảng `User`, `ShowcaseItem`, `ItemContributor`, `ItemLink`, `ItemAttachment`, `Tag`.

- [ ] **Step 1: Viết test kiểm tra tính toàn vẹn quan hệ cơ sở dữ liệu**

Tạo `tests/integration/prisma-schema.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('Prisma Schema and Database Models', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should find seeded admin user', async () => {
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });
    expect(admin).toBeDefined();
    expect(admin?.role).toBe('ADMIN');
  });

  it('should create and retrieve a showcase item with contributor', async () => {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) throw new Error('Admin not found');

    const item = await prisma.showcaseItem.create({
      data: {
        title: 'Thử nghiệm mô hình Transformer trên ảnh y tế',
        slug: 'transformer-anh-y-te-test',
        summary: 'Tóm tắt bài báo nghiên cứu ứng dụng Transformer',
        type: 'RESEARCH_PAPER',
        status: 'PUBLISHED',
        publishedYear: 2026,
        creatorId: admin.id,
        contributors: {
          create: [
            {
              userId: admin.id,
              role: 'ADVISOR',
              displayOrder: 1,
            },
            {
              externalName: 'TS. Nguyễn Văn A',
              externalAffiliation: 'Khoa CNTT - HCMUS',
              role: 'ADVISOR',
              displayOrder: 2,
            },
          ],
        },
      },
      include: {
        contributors: true,
      },
    });

    expect(item.id).toBeDefined();
    expect(item.contributors.length).toBe(2);

    // Clean up
    await prisma.showcaseItem.delete({ where: { id: item.id } });
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại vì chưa tạo schema**

Run: `npm test tests/integration/prisma-schema.test.ts`  
Expected: Lỗi không tìm thấy `@/lib/prisma` hoặc Prisma client chưa sẵn sàng.

- [ ] **Step 3: Viết Prisma Schema và khởi tạo Prisma Client**

Tạo `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  GUEST
  MEMBER
  CORE_MEMBER
  ADMIN
}

enum UserStatus {
  PENDING
  ACTIVE
  SUSPENDED
}

enum ItemType {
  RESEARCH_PAPER
  PROJECT
  ACHIEVEMENT
}

enum ItemScope {
  INTERNAL
  CLUB_CONTRIBUTION
  EXTERNAL
  OPEN_SOURCE
}

enum ItemStatus {
  DRAFT
  PENDING_REVIEW
  PUBLISHED
  REJECTED
}

enum ContributorRole {
  ADVISOR
  FIRST_AUTHOR
  CO_FIRST_AUTHOR
  CO_AUTHOR
  CORRESPONDING_AUTHOR
  PROJECT_LEAD
  CONTRIBUTOR
  CUSTOM
}

enum LinkType {
  PAPER_URL
  VIDEO_EMBED
  GITHUB
  LIVE_DEMO
  SLIDES
  CERTIFICATE
  OTHER
}

model User {
  id               String          @id @default(cuid())
  email            String          @unique
  passwordHash     String?
  fullName         String
  studentId        String?
  avatarUrl        String?
  bio              String?
  githubUrl        String?
  linkedinUrl      String?
  googleScholarUrl String?
  portfolioUrl     String?
  role             Role            @default(GUEST)
  status           UserStatus      @default(PENDING)
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  createdItems     ShowcaseItem[]  @relation("CreatedByUser")
  contributions    ItemContributor[]

  @@map("users")
}

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
  @@map("showcase_items")
}

model ItemContributor {
  id                  String           @id @default(cuid())
  itemId              String
  userId              String?
  user                User?            @relation(fields: [userId], references: [id], onDelete: SetNull)

  externalName        String?
  externalAffiliation String?
  externalLink        String?

  role                ContributorRole  @default(CONTRIBUTOR)
  customRoleTitle     String?
  displayOrder        Int              @default(0)

  item                ShowcaseItem     @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@index([itemId])
  @@index([userId])
  @@map("item_contributors")
}

model ItemLink {
  id       String       @id @default(cuid())
  itemId   String
  label    String
  url      String
  type     LinkType     @default(OTHER)

  item     ShowcaseItem @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@map("item_links")
}

model ItemAttachment {
  id       String       @id @default(cuid())
  itemId   String
  fileName String
  fileUrl  String
  fileSize Int
  mimeType String

  item     ShowcaseItem @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@map("item_attachments")
}

model Tag {
  id    String    @id @default(cuid())
  name  String    @unique
  slug  String    @unique
  items ItemTag[]

  @@map("tags")
}

model ItemTag {
  itemId String
  tagId  String

  item   ShowcaseItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  tag    Tag          @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([itemId, tagId])
  @@map("item_tags")
}
```

Tạo `src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

Tạo `.env`:
```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="nexus-showcase-super-secret-key-32-chars-length"
NEXTAUTH_URL="http://localhost:3000"
```

Tạo `prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123456', 10);

  // 1. Thầy chủ nhiệm (Admin)
  const admin = await prisma.user.upsert({
    where: { email: 'advisor@hcmus.edu.vn' },
    update: {},
    create: {
      email: 'advisor@hcmus.edu.vn',
      fullName: 'TS. Nguyễn Văn Hướng Dẫn',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      bio: 'Thầy chủ nhiệm CLB Nexus - Giảng viên Khoa CNTT, ĐH KHTN.',
      portfolioUrl: 'https://fit.hcmus.edu.vn',
    },
  });

  // 2. Thành viên nòng cốt (Core Member)
  const coreMember = await prisma.user.upsert({
    where: { email: 'core.lead@student.hcmus.edu.vn' },
    update: {},
    create: {
      email: 'core.lead@student.hcmus.edu.vn',
      fullName: 'Lê Văn Trưởng Nhóm',
      studentId: '22120001',
      passwordHash,
      role: 'CORE_MEMBER',
      status: 'ACTIVE',
      bio: 'Trưởng ban Học thuật CLB Nexus, Nghiên cứu sinh viên mảng Computer Vision.',
      githubUrl: 'https://github.com',
    },
  });

  // 3. Thành viên thông thường (Member)
  const regularMember = await prisma.user.upsert({
    where: { email: 'member.student@student.hcmus.edu.vn' },
    update: {},
    create: {
      email: 'member.student@student.hcmus.edu.vn',
      fullName: 'Trần Thị Thành Viên',
      studentId: '23120002',
      passwordHash,
      role: 'MEMBER',
      status: 'ACTIVE',
      bio: 'Thành viên ban Kỹ thuật CLB Nexus khóa 2023.',
    },
  });

  // 4. Mẫu bài báo khoa học đã xuất bản
  const samplePaper = await prisma.showcaseItem.upsert({
    where: { slug: 'deep-learning-medical-imaging-nexus' },
    update: {},
    create: {
      title: 'Ứng Dụng Học Sâu Trong Phân Đoạn Ảnh Y Tế Đa Chiều',
      slug: 'deep-learning-medical-imaging-nexus',
      summary: 'Nghiên cứu ứng dụng mạng U-Net cải tiến kết hợp Transformer để phân đoạn tự động khối u trên ảnh MRI với độ chính xác Dice score đạt 0.92.',
      content: '## Giới thiệu\nNghiên cứu này đề xuất giải pháp...\n\n## Phương pháp\nSử dụng kiến trúc lai giữa CNN và Vision Transformer.',
      type: 'RESEARCH_PAPER',
      scope: 'EXTERNAL',
      issuer: 'Hội nghị Khoa học Công nghệ Trẻ 2026',
      status: 'PUBLISHED',
      publishedYear: 2026,
      publishedAt: new Date('2026-05-15'),
      creatorId: coreMember.id,
      contributors: {
        create: [
          {
            userId: admin.id,
            role: 'ADVISOR',
            displayOrder: 1,
          },
          {
            userId: coreMember.id,
            role: 'FIRST_AUTHOR',
            displayOrder: 2,
          },
          {
            userId: regularMember.id,
            role: 'CO_AUTHOR',
            displayOrder: 3,
          },
          {
            externalName: 'ThS. Hoàng Đức Minh',
            externalAffiliation: 'Bệnh viện Chợ Rẫy',
            role: 'ADVISOR',
            displayOrder: 4,
          },
        ],
      },
      links: {
        create: [
          {
            label: 'Đọc trên arXiv',
            url: 'https://arxiv.org/abs/sample',
            type: 'PAPER_URL',
          },
          {
            label: 'Mã nguồn GitHub',
            url: 'https://github.com/nexus-club/medical-imaging',
            type: 'GITHUB',
          },
          {
            label: 'Video Demo YouTube',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            type: 'VIDEO_EMBED',
          },
        ],
      },
    },
  });

  console.log('Seeded database successfully:', { admin: admin.email, samplePaper: samplePaper.title });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 4: Chạy sync schema, seed database và verify test**

Run: `npx prisma db push; npx tsx prisma/seed.ts; npm test tests/integration/prisma-schema.test.ts`  
Expected: `2 passed`

- [ ] **Step 5: Commit task 2**

```bash
git add prisma/ .env src/lib/prisma.ts tests/integration/prisma-schema.test.ts
git commit -m "feat: setup Prisma database schema, models and seeding script"
```

---

### Task 3: Xác thực Người dùng & Phân quyền RBAC (Auth.js v5)

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/lib/permissions.ts`
- Test: `tests/unit/permissions.test.ts`

**Interfaces:**
- Produces: 
  - `auth()` lấy session hiện tại.
  - `canUserUpload(user)`: trả về `true` nếu `role === 'ADMIN' || role === 'CORE_MEMBER'`.
  - `canUserReview(user)`: trả về `true` nếu `role === 'ADMIN'`.

- [ ] **Step 1: Viết test cho logic phân quyền RBAC**

Tạo `tests/unit/permissions.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { canUserUpload, canUserReview, isMemberOrHigher } from '@/lib/permissions';

describe('RBAC Permission Helpers', () => {
  it('should only allow ADMIN and CORE_MEMBER to upload', () => {
    expect(canUserUpload({ role: 'ADMIN' })).toBe(true);
    expect(canUserUpload({ role: 'CORE_MEMBER' })).toBe(true);
    expect(canUserUpload({ role: 'MEMBER' })).toBe(false);
    expect(canUserUpload({ role: 'GUEST' })).toBe(false);
    expect(canUserUpload(null)).toBe(false);
  });

  it('should only allow ADMIN to review/publish submissions', () => {
    expect(canUserReview({ role: 'ADMIN' })).toBe(true);
    expect(canUserReview({ role: 'CORE_MEMBER' })).toBe(false);
    expect(canUserReview({ role: 'MEMBER' })).toBe(false);
    expect(canUserReview(null)).toBe(false);
  });

  it('should check if user is official club member', () => {
    expect(isMemberOrHigher({ role: 'ADMIN' })).toBe(true);
    expect(isMemberOrHigher({ role: 'CORE_MEMBER' })).toBe(true);
    expect(isMemberOrHigher({ role: 'MEMBER' })).toBe(true);
    expect(isMemberOrHigher({ role: 'GUEST' })).toBe(false);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Run: `npm test tests/unit/permissions.test.ts`  
Expected: Lỗi không tìm thấy module `@/lib/permissions`.

- [ ] **Step 3: Cài đặt logic permissions và Auth.js v5**

Tạo `src/lib/permissions.ts`:
```typescript
import { Role } from '@prisma/client';

export interface UserSessionSubset {
  id?: string;
  role?: Role | string;
}

export function canUserUpload(user: UserSessionSubset | null | undefined): boolean {
  if (!user || !user.role) return false;
  return user.role === 'ADMIN' || user.role === 'CORE_MEMBER';
}

export function canUserReview(user: UserSessionSubset | null | undefined): boolean {
  if (!user || !user.role) return false;
  return user.role === 'ADMIN';
}

export function isMemberOrHigher(user: UserSessionSubset | null | undefined): boolean {
  if (!user || !user.role) return false;
  return user.role === 'ADMIN' || user.role === 'CORE_MEMBER' || user.role === 'MEMBER';
}
```

Tạo `src/lib/auth.ts`:
```typescript
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.passwordHash) return null;
        if (user.status !== 'ACTIVE') return null;

        const isPasswordMatch = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!isPasswordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as unknown as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
});
```

Tạo `src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```

- [ ] **Step 4: Chạy lại test permissions**

Run: `npm test tests/unit/permissions.test.ts`  
Expected: `3 passed`

- [ ] **Step 5: Commit task 3**

```bash
git add src/lib/permissions.ts src/lib/auth.ts src/app/api/auth/ tests/unit/permissions.test.ts
git commit -m "feat: implement RBAC permission logic and Auth.js credentials provider"
```

---

### Task 4: Media Parser, Slug Generator & Upload Handler

**Files:**
- Create: `src/lib/video-parser.ts`
- Create: `src/lib/slugify.ts`
- Create: `src/app/api/upload/route.ts`
- Test: `tests/unit/video-parser.test.ts`
- Test: `tests/unit/slugify.test.ts`

**Interfaces:**
- Produces: 
  - `parseVideoEmbedUrl(url: string)`: Chuyển đổi YouTube / Loom / Drive URL sang iframe embed link hoặc null.
  - `slugify(text: string)`: Sinh slug chuẩn tiếng Việt và không dấu.
  - `POST /api/upload`: Nhận FormData (file, type: 'thumbnail' | 'pdf'), lưu vào `public/uploads/{thumbnails|documents}/` và trả về URL.

- [ ] **Step 1: Viết test cho video embed parser và slug generator**

Tạo `tests/unit/video-parser.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { parseVideoEmbedUrl } from '@/lib/video-parser';

describe('Video Embed Parser', () => {
  it('should parse standard YouTube watch URL', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    expect(parseVideoEmbedUrl(url)).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('should parse shortened youtu.be URL', () => {
    const url = 'https://youtu.be/dQw4w9WgXcQ';
    expect(parseVideoEmbedUrl(url)).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('should parse Loom share URL', () => {
    const url = 'https://www.loom.com/share/abc123xyz456';
    expect(parseVideoEmbedUrl(url)).toBe('https://www.loom.com/embed/abc123xyz456');
  });

  it('should parse Google Drive preview URL', () => {
    const url = 'https://drive.google.com/file/d/1A2B3C4D5E/view?usp=sharing';
    expect(parseVideoEmbedUrl(url)).toBe('https://drive.google.com/file/d/1A2B3C4D5E/preview');
  });

  it('should return null for invalid or unsupported URLs', () => {
    expect(parseVideoEmbedUrl('https://example.com/not-a-video')).toBeNull();
  });
});
```

Tạo `tests/unit/slugify.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { slugify } from '@/lib/slugify';

describe('Slugify Generator', () => {
  it('should transform Vietnamese diacritics into url-friendly slug', () => {
    const title = 'Ứng Dụng Học Sâu Trong Phân Đoạn Ảnh Y Tế 2026!';
    expect(slugify(title)).toBe('ung-dung-hoc-sau-trong-phan-doan-anh-y-te-2026');
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Run: `npm test tests/unit/video-parser.test.ts tests/unit/slugify.test.ts`  
Expected: Lỗi không tìm thấy module `@/lib/video-parser` và `@/lib/slugify`.

- [ ] **Step 3: Hiện thực hóa video parser, slugify và upload handler**

Tạo `src/lib/video-parser.ts`:
```typescript
export function parseVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // YouTube standard & short
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const ytMatch = trimmed.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // Loom
  const loomRegex = /loom\.com\/share\/([a-zA-Z0-9]+)/;
  const loomMatch = trimmed.match(loomRegex);
  if (loomMatch && loomMatch[1]) {
    return `https://www.loom.com/embed/${loomMatch[1]}`;
  }

  // Google Drive
  const driveRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const driveMatch = trimmed.match(driveRegex);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }

  return null;
}
```

Tạo `src/lib/slugify.ts`:
```typescript
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
```

Tạo `src/app/api/upload/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { canUserUpload } from '@/lib/permissions';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !canUserUpload(session.user as any)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const type = formData.get('type') as string; // 'thumbnail' | 'pdf'

  if (!file) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  const isThumbnail = type === 'thumbnail';
  const maxBytes = isThumbnail ? 5 * 1024 * 1024 : 25 * 1024 * 1024;

  if (file.size > maxBytes) {
    return NextResponse.json({ error: `File quá lớn. Tối đa ${isThumbnail ? '5MB' : '25MB'}` }, { status: 400 });
  }

  const validMimes = isThumbnail
    ? ['image/jpeg', 'image/png', 'image/webp']
    : ['application/pdf'];

  if (!validMimes.includes(file.type)) {
    return NextResponse.json({ error: 'Định dạng file không hợp lệ' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || (isThumbnail ? 'png' : 'pdf');
  const safeFileName = `${crypto.randomUUID()}.${ext}`;
  const targetSubDir = isThumbnail ? 'thumbnails' : 'documents';
  const targetDir = path.join(process.cwd(), 'public', 'uploads', targetSubDir);

  await fs.mkdir(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, safeFileName);

  const bytes = await file.arrayBuffer();
  await fs.writeFile(targetPath, Buffer.from(bytes));

  const fileUrl = `/uploads/${targetSubDir}/${safeFileName}`;

  return NextResponse.json({
    url: fileUrl,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  });
}
```

- [ ] **Step 4: Chạy test video parser & slugify**

Run: `npm test tests/unit/video-parser.test.ts tests/unit/slugify.test.ts`  
Expected: `6 passed`

- [ ] **Step 5: Commit task 4**

```bash
git add src/lib/video-parser.ts src/lib/slugify.ts src/app/api/upload/route.ts tests/unit/video-parser.test.ts tests/unit/slugify.test.ts
git commit -m "feat: add video embed parser, slugify utility, and secure file upload endpoint"
```

---

### Task 5: Server Actions & Nghiệp Vụ Showcase (CRUD, Đa Tác Giả, Kiểm Duyệt)

**Files:**
- Create: `src/actions/showcase-actions.ts`
- Create: `src/actions/admin-actions.ts`
- Test: `tests/integration/showcase-actions.test.ts`

**Interfaces:**
- Produces: 
  - `createShowcaseItem(data)`: Tạo bài nháp hoặc gửi duyệt, lưu `contributors` (cả nội bộ lẫn ngoại bộ) và `links`.
  - `updateShowcaseItem(id, data)`: Cập nhật bài viết nếu là creator hoặc Admin.
  - `reviewShowcaseItem(id, { action: 'PUBLISH' | 'REJECT', reason?: string })`: Dành riêng cho Admin.
  - `upgradeMemberRole(userId, newRole: 'CORE_MEMBER' | 'MEMBER')`: Dành riêng cho Admin.

- [ ] **Step 1: Viết test cho Showcase Server Actions**

Tạo `tests/integration/showcase-actions.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createShowcaseItemAction, reviewShowcaseItemAction } from '@/actions/showcase-actions';

describe('Showcase Server Actions', () => {
  let adminUser: any;
  let coreUser: any;
  let regularUser: any;

  beforeAll(async () => {
    adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    coreUser = await prisma.user.findFirst({ where: { role: 'CORE_MEMBER' } });
    regularUser = await prisma.user.findFirst({ where: { role: 'MEMBER' } });
  });

  it('should forbid regular member from creating showcase item', async () => {
    const result = await createShowcaseItemAction(regularUser.id, {
      title: 'Bài báo trái phép của member thường',
      summary: 'Tóm tắt bài báo',
      type: 'RESEARCH_PAPER',
      publishedYear: 2026,
      contributors: [],
      links: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Bạn không có quyền đăng tải bài viết');
  });

  it('should allow core member to create showcase item with mixed contributors', async () => {
    const result = await createShowcaseItemAction(coreUser.id, {
      title: 'Hệ thống Nhận diện Khuôn mặt CLB',
      summary: 'Dự án áp dụng FaceNet và YOLO',
      type: 'PROJECT',
      publishedYear: 2026,
      contributors: [
        {
          userId: coreUser.id,
          role: 'PROJECT_LEAD',
          displayOrder: 1,
        },
        {
          userId: regularUser.id,
          role: 'CONTRIBUTOR',
          displayOrder: 2,
        },
        {
          externalName: 'ThS. Lê Hoàng',
          externalAffiliation: 'FPT Software',
          role: 'ADVISOR',
          displayOrder: 3,
        },
      ],
      links: [
        {
          label: 'GitHub Repo',
          url: 'https://github.com/test/face-recog',
          type: 'GITHUB',
        },
      ],
      submitForReview: true,
    });

    expect(result.success).toBe(true);
    expect(result.item?.status).toBe('PENDING_REVIEW');
    expect(result.item?.contributors.length).toBe(3);

    // Admin duyệt bài
    const reviewResult = await reviewShowcaseItemAction(adminUser.id, result.item!.id, {
      action: 'PUBLISH',
    });
    expect(reviewResult.success).toBe(true);
    expect(reviewResult.status).toBe('PUBLISHED');

    // Dọn dẹp
    await prisma.showcaseItem.delete({ where: { id: result.item!.id } });
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Run: `npm test tests/integration/showcase-actions.test.ts`  
Expected: Lỗi thiếu `@/actions/showcase-actions`.

- [ ] **Step 3: Viết Showcase Actions và Admin Actions**

Tạo `src/actions/showcase-actions.ts`:
```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { canUserUpload, canUserReview } from '@/lib/permissions';
import { slugify } from '@/lib/slugify';
import { ItemType, ItemScope, ContributorRole, LinkType } from '@prisma/client';

export interface ContributorInput {
  userId?: string | null;
  externalName?: string | null;
  externalAffiliation?: string | null;
  externalLink?: string | null;
  role: ContributorRole;
  customRoleTitle?: string | null;
  displayOrder: number;
}

export interface LinkInput {
  label: string;
  url: string;
  type: LinkType;
}

export interface CreateShowcaseItemInput {
  title: string;
  summary: string;
  content?: string;
  type: ItemType;
  scope?: ItemScope;
  issuer?: string;
  thumbnailUrl?: string;
  publishedYear: number;
  contributors: ContributorInput[];
  links: LinkInput[];
  submitForReview?: boolean;
}

export async function createShowcaseItemAction(userId: string, input: CreateShowcaseItemInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !canUserUpload(user)) {
    return { success: false, error: 'Bạn không có quyền đăng tải bài viết. Vui lòng liên hệ Thầy chủ nhiệm để được nâng cấp.' };
  }

  let slug = slugify(input.title);
  const existing = await prisma.showcaseItem.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  const status = input.submitForReview ? 'PENDING_REVIEW' : 'DRAFT';

  const item = await prisma.showcaseItem.create({
    data: {
      title: input.title,
      slug,
      summary: input.summary,
      content: input.content,
      type: input.type,
      scope: input.scope,
      issuer: input.issuer,
      thumbnailUrl: input.thumbnailUrl,
      status,
      publishedYear: input.publishedYear,
      creatorId: user.id,
      contributors: {
        create: input.contributors.map((c) => ({
          userId: c.userId || null,
          externalName: c.externalName || null,
          externalAffiliation: c.externalAffiliation || null,
          externalLink: c.externalLink || null,
          role: c.role,
          customRoleTitle: c.customRoleTitle || null,
          displayOrder: c.displayOrder,
        })),
      },
      links: {
        create: input.links.map((l) => ({
          label: l.label,
          url: l.url,
          type: l.type,
        })),
      },
    },
    include: {
      contributors: true,
      links: true,
    },
  });

  return { success: true, item };
}

export async function reviewShowcaseItemAction(
  adminId: string,
  itemId: string,
  payload: { action: 'PUBLISH' | 'REJECT'; reason?: string }
) {
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin || !canUserReview(admin)) {
    return { success: false, error: 'Chỉ Thầy chủ nhiệm (Admin) mới có quyền kiểm duyệt bài.' };
  }

  const isPublish = payload.action === 'PUBLISH';
  const updated = await prisma.showcaseItem.update({
    where: { id: itemId },
    data: {
      status: isPublish ? 'PUBLISHED' : 'REJECTED',
      publishedAt: isPublish ? new Date() : undefined,
      rejectionReason: isPublish ? null : payload.reason || 'Nội dung cần chỉnh sửa bổ sung.',
    },
  });

  return { success: true, status: updated.status };
}
```

Tạo `src/actions/admin-actions.ts`:
```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { canUserReview } from '@/lib/permissions';
import { Role } from '@prisma/client';

export async function updateUserRoleAction(adminId: string, targetUserId: string, newRole: Role) {
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin || !canUserReview(admin)) {
    return { success: false, error: 'Chỉ Thầy chủ nhiệm mới có quyền phân quyền thành viên.' };
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
  });

  return { success: true, user: updatedUser };
}
```

- [ ] **Step 4: Chạy test kiểm thử Showcase Server Actions**

Run: `npm test tests/integration/showcase-actions.test.ts`  
Expected: `2 passed`

- [ ] **Step 5: Commit task 5**

```bash
git add src/actions/ tests/integration/showcase-actions.test.ts
git commit -m "feat: implement showcase creation with mixed authors and admin review server actions"
```

---

### Task 6: Giao Diện Showcase Công Khai (Trang Chủ & Chi Tiết Mục)

**Files:**
- Create: `src/components/navbar.tsx`
- Create: `src/components/showcase-card.tsx`
- Create: `src/components/video-player.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/showcase/[slug]/page.tsx`

**Interfaces:**
- Consumes: `prisma.showcaseItem` với các quan hệ `contributors`, `links`, `tags`.
- Produces: Trang chủ lọc theo category/year/search và trang xem chi tiết bài báo/dự án/thành tích chuẩn SEO.

- [ ] **Step 1: Tạo Navbar chung và Component Video Player**

Tạo `src/components/navbar.tsx`:
```tsx
import Link from 'next/link';
import { auth } from '@/lib/auth';

export async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
            N
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">NexusShowcase</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/" className="text-slate-600 hover:text-blue-600 transition-colors">
            Khám phá
          </Link>
          {session?.user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
              >
                Dashboard
              </Link>
              {(session.user as any).role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="px-3 py-1.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold transition-colors"
                >
                  Admin
                </Link>
              )}
            </div>
          ) : (
            <Link
              href="/api/auth/signin"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              Đăng nhập
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
```

Tạo `src/components/video-player.tsx`:
```tsx
import { parseVideoEmbedUrl } from '@/lib/video-parser';

export function VideoPlayer({ url, title }: { url: string; title: string }) {
  const embedUrl = parseVideoEmbedUrl(url);
  if (!embedUrl) return null;

  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-black">
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full border-0"
      />
    </div>
  );
}
```

Tạo `src/components/showcase-card.tsx`:
```tsx
import Link from 'next/link';
import { ItemType, ItemScope } from '@prisma/client';

interface Contributor {
  id: string;
  user?: { id: string; fullName: string } | null;
  externalName?: string | null;
  role: string;
}

interface ShowcaseCardProps {
  item: {
    id: string;
    title: string;
    slug: string;
    summary: string;
    thumbnailUrl?: string | null;
    type: ItemType;
    scope?: ItemScope | null;
    publishedYear: number;
    contributors: Contributor[];
  };
}

export function ShowcaseCard({ item }: ShowcaseCardProps) {
  const typeLabelMap = {
    RESEARCH_PAPER: 'Bài báo nghiên cứu',
    PROJECT: 'Dự án công nghệ',
    ACHIEVEMENT: 'Thành tích & Cống hiến',
  };

  const typeColorMap = {
    RESEARCH_PAPER: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    PROJECT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ACHIEVEMENT: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <Link
      href={`/showcase/${item.slug}`}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-blue-300 transition-all overflow-hidden"
    >
      <div className="aspect-[16/9] w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-slate-400 font-medium text-sm flex items-center gap-1">
            Nexus Showcase
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${typeColorMap[item.type]}`}>
            {typeLabelMap[item.type]}
          </span>
          <span className="text-xs text-slate-500 font-medium">{item.publishedYear}</span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
          {item.title}
        </h3>
        <p className="text-sm text-slate-600 mt-2 line-clamp-3 leading-relaxed flex-1">
          {item.summary}
        </p>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Tác giả:</span>
          <span className="truncate">
            {item.contributors
              .map((c) => c.user?.fullName || c.externalName)
              .filter(Boolean)
              .join(', ') || 'CLB Nexus'}
          </span>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Cập nhật Trang Chủ (`src/app/page.tsx`) với đầy đủ tính năng lọc và Hero Section**

Tạo `src/app/page.tsx`:
```tsx
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { ShowcaseCard } from '@/components/showcase-card';
import { ItemType } from '@prisma/client';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; year?: string; q?: string }>;
}) {
  const params = await searchParams;
  const typeFilter = params.type as ItemType | undefined;
  const yearFilter = params.year ? parseInt(params.year) : undefined;
  const searchQuery = params.q;

  const whereClause: any = {
    status: 'PUBLISHED',
  };

  if (typeFilter && ['RESEARCH_PAPER', 'PROJECT', 'ACHIEVEMENT'].includes(typeFilter)) {
    whereClause.type = typeFilter;
  }
  if (yearFilter) {
    whereClause.publishedYear = yearFilter;
  }
  if (searchQuery) {
    whereClause.OR = [
      { title: { contains: searchQuery } },
      { summary: { contains: searchQuery } },
    ];
  }

  const [items, totalPapers, totalProjects, totalAchievements] = await Promise.all([
    prisma.showcaseItem.findMany({
      where: whereClause,
      include: {
        contributors: {
          include: { user: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: [{ publishedYear: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.showcaseItem.count({ where: { status: 'PUBLISHED', type: 'RESEARCH_PAPER' } }),
    prisma.showcaseItem.count({ where: { status: 'PUBLISHED', type: 'PROJECT' } }),
    prisma.showcaseItem.count({ where: { status: 'PUBLISHED', type: 'ACHIEVEMENT' } }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50/50 to-white py-16 border-b border-slate-200">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-4">
            🚀 Câu Lạc Bộ Nexus — ĐH Khoa Học Tự Nhiên
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Nơi Trưng Bày Công Trình & Thành Tích
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Tổng hợp bài báo khoa học, giải thưởng và các sản phẩm công nghệ tiên phong của các thế hệ thành viên CLB.
          </p>

          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-8 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div>
              <div className="text-2xl font-bold text-indigo-600">{totalPapers}</div>
              <div className="text-xs text-slate-500 font-medium">Bài Báo Khoa Học</div>
            </div>
            <div className="border-x border-slate-100">
              <div className="text-2xl font-bold text-emerald-600">{totalProjects}</div>
              <div className="text-xs text-slate-500 font-medium">Dự Án Công Nghệ</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{totalAchievements}</div>
              <div className="text-xs text-slate-500 font-medium">Giải Thưởng / Cống Hiến</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Showcase Feed */}
      <main className="container mx-auto px-4 py-10 max-w-6xl flex-1">
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
          <div className="flex flex-wrap gap-2">
            <a
              href="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !typeFilter ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Tất cả
            </a>
            <a
              href="/?type=RESEARCH_PAPER"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === 'RESEARCH_PAPER' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Bài báo nghiên cứu
            </a>
            <a
              href="/?type=PROJECT"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === 'PROJECT' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Dự án công nghệ
            </a>
            <a
              href="/?type=ACHIEVEMENT"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === 'ACHIEVEMENT' ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Thành tích & Cống hiến
            </a>
          </div>

          <form method="GET" action="/" className="flex items-center gap-2">
            <input
              type="text"
              name="q"
              defaultValue={searchQuery || ''}
              placeholder="Tìm kiếm công trình..."
              className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800">
              Lọc
            </button>
          </form>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-500">
            Chưa có công trình nào phù hợp với bộ lọc này.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ShowcaseCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Tạo Trang Chi Tiết Mục (`src/app/showcase/[slug]/page.tsx`)**

Tạo `src/app/showcase/[slug]/page.tsx`:
```tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { VideoPlayer } from '@/components/video-player';
import Link from 'next/link';

export default async function ShowcaseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await prisma.showcaseItem.findUnique({
    where: { slug },
    include: {
      contributors: {
        include: { user: true },
        orderBy: { displayOrder: 'asc' },
      },
      links: true,
      attachments: true,
    },
  });

  if (!item || item.status !== 'PUBLISHED') {
    notFound();
  }

  const videoLink = item.links.find((l) => l.type === 'VIDEO_EMBED');
  const paperLink = item.links.find((l) => l.type === 'PAPER_URL');
  const githubLink = item.links.find((l) => l.type === 'GITHUB');
  const liveDemoLink = item.links.find((l) => l.type === 'LIVE_DEMO');

  const roleNameMap: Record<string, string> = {
    ADVISOR: 'Người hướng dẫn',
    FIRST_AUTHOR: 'Tác giả chính',
    CO_FIRST_AUTHOR: 'Đồng tác giả 1',
    CO_AUTHOR: 'Đồng tác giả',
    CORRESPONDING_AUTHOR: 'Tác giả liên hệ',
    PROJECT_LEAD: 'Trưởng nhóm dự án',
    CONTRIBUTOR: 'Thành viên tham gia',
    CUSTOM: 'Đóng góp',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-10 max-w-4xl flex-1">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 mb-6">
          ← Quay lại danh mục
        </Link>

        <header className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              {item.type}
            </span>
            <span className="text-sm font-medium text-slate-500">Năm công bố: {item.publishedYear}</span>
            {item.issuer && (
              <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                {item.issuer}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
            {item.title}
          </h1>

          <p className="mt-4 text-base text-slate-600 leading-relaxed font-normal">
            {item.summary}
          </p>

          {/* Quick Action Links */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-3">
            {paperLink && (
              <a
                href={paperLink.url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                📄 Đọc bài báo gốc
              </a>
            )}
            {githubLink && (
              <a
                href={githubLink.url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
              >
                💻 Mã nguồn GitHub
              </a>
            )}
            {liveDemoLink && (
              <a
                href={liveDemoLink.url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
              >
                🌐 Mở Demo trực tiếp
              </a>
            )}
          </div>
        </header>

        {/* Video Demo Embed */}
        {videoLink && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Video Demo</h2>
            <VideoPlayer url={videoLink.url} title={item.title} />
          </div>
        )}

        {/* Danh sách Tác giả & Vai trò */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Danh sách Tác giả & Thành viên tham gia</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {item.contributors.map((c) => {
              const name = c.user?.fullName || c.externalName || 'Thành viên ẩn danh';
              const roleDisplay = roleNameMap[c.role] || c.customRoleTitle || c.role;

              return (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-blue-600/10 text-blue-600 font-bold flex items-center justify-center text-sm">
                    {name.charAt(0)}
                  </div>
                  <div className="flex-1 truncate">
                    {c.user ? (
                      <Link
                        href={`/members/${c.user.id}`}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors block truncate"
                      >
                        {name}
                      </Link>
                    ) : (
                      <span className="font-bold text-slate-900 block truncate">{name}</span>
                    )}
                    <div className="text-xs text-slate-500">
                      <span className="font-semibold text-blue-700">{roleDisplay}</span>
                      {c.externalAffiliation && <span> • {c.externalAffiliation}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nội dung chi tiết */}
        {item.content && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm prose max-w-none">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Nội dung chi tiết</h2>
            <div className="text-slate-700 leading-relaxed whitespace-pre-line">{item.content}</div>
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Kiểm tra build Next.js**

Run: `npm run build`  
Expected: Build thành công trang chủ và showcase detail.

- [ ] **Step 5: Commit task 6**

```bash
git add src/components/ src/app/page.tsx src/app/showcase/
git commit -m "feat: implement public showcase homepage with category filters and detailed item view"
```

---

### Task 7: Hồ Sơ Cá Nhân & Tự Động Tổng Hợp Portfolio Thành Viên

**Files:**
- Create: `src/app/members/[id]/page.tsx`
- Test: `tests/integration/member-portfolio.test.ts`

**Interfaces:**
- Consumes: Bảng `User` và quan hệ `contributions` -> `ShowcaseItem` với điều kiện `status === 'PUBLISHED'`.
- Produces: Trang portfolio cá nhân tự động phân loại thành: Bài báo đã tham gia, Dự án công nghệ, Thành tích & Cống hiến CLB.

- [ ] **Step 1: Viết test cho logic tổng hợp portfolio**

Tạo `tests/integration/member-portfolio.test.ts`:
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('Member Automatic Portfolio', () => {
  it('should find items where member is tagged as contributor', async () => {
    const regularMember = await prisma.user.findFirst({ where: { role: 'MEMBER' } });
    if (!regularMember) throw new Error('Member not found');

    const contributions = await prisma.itemContributor.findMany({
      where: {
        userId: regularMember.id,
        item: { status: 'PUBLISHED' },
      },
      include: {
        item: true,
      },
    });

    expect(contributions.length).toBeGreaterThan(0);
    expect(contributions[0].item.title).toContain('Ảnh Y Tế');
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận dữ liệu đã có từ seed**

Run: `npm test tests/integration/member-portfolio.test.ts`  
Expected: `1 passed`

- [ ] **Step 3: Tạo Trang Hồ Sơ Thành Viên (`src/app/members/[id]/page.tsx`)**

Tạo `src/app/members/[id]/page.tsx`:
```tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { ShowcaseCard } from '@/components/showcase-card';

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      contributions: {
        where: {
          item: { status: 'PUBLISHED' },
        },
        include: {
          item: {
            include: {
              contributors: {
                include: { user: true },
                orderBy: { displayOrder: 'asc' },
              },
            },
          },
        },
        orderBy: { item: { publishedYear: 'desc' } },
      },
    },
  });

  if (!user) notFound();

  const publishedItems = user.contributions.map((c) => c.item);
  const papers = publishedItems.filter((i) => i.type === 'RESEARCH_PAPER');
  const projects = publishedItems.filter((i) => i.type === 'PROJECT');
  const achievements = publishedItems.filter((i) => i.type === 'ACHIEVEMENT');

  const roleTitleMap: Record<string, string> = {
    ADMIN: 'Thầy Chủ Nhiệm CLB',
    CORE_MEMBER: 'Thành Viên Nòng Cốt (Core Member)',
    MEMBER: 'Thành Viên CLB (Member)',
    GUEST: 'Khách',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-10 max-w-5xl flex-1">
        {/* Profile Header */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-blue-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-md">
            {user.fullName.charAt(0)}
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{user.fullName}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {roleTitleMap[user.role] || user.role}
              </span>
            </div>

            {user.studentId && <p className="text-xs text-slate-400 font-medium mb-2">MSSV: {user.studentId}</p>}
            <p className="text-sm text-slate-600 max-w-xl leading-relaxed mb-4">{user.bio || 'Chưa cập nhật tiểu sử.'}</p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm">
              {user.githubUrl && (
                <a href={user.githubUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  GitHub
                </a>
              )}
              {user.googleScholarUrl && (
                <a href={user.googleScholarUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  Google Scholar
                </a>
              )}
              {user.linkedinUrl && (
                <a href={user.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Member Showcase Portfolios */}
        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>📄 Bài báo khoa học đã tham gia</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                {papers.length}
              </span>
            </h2>
            {papers.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Chưa có bài báo khoa học nào.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {papers.map((p) => (
                  <ShowcaseCard key={p.id} item={p} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>💻 Dự án công nghệ đã xây dựng</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                {projects.length}
              </span>
            </h2>
            {projects.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Chưa có dự án nào.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((p) => (
                  <ShowcaseCard key={p.id} item={p} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>🏆 Giải thưởng & Đóng góp cho CLB</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
                {achievements.length}
              </span>
            </h2>
            {achievements.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Chưa có giải thưởng hoặc cống hiến nào.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((a) => (
                  <ShowcaseCard key={a.id} item={a} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Chạy test và build**

Run: `npm run build`  
Expected: Build thành công router `/members/[id]`.

- [ ] **Step 5: Commit task 7**

```bash
git add src/app/members/[id]/ tests/integration/member-portfolio.test.ts
git commit -m "feat: implement automatic member portfolio aggregation with academic sections"
```

---

### Task 8: Dashboard Thành Viên & Trình Tạo Bài Nộp (Core Member Submission Form)

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/app/dashboard/items/new/page.tsx`
- Create: `src/components/item-form.tsx`

**Interfaces:**
- Consumes: `createShowcaseItemAction` từ `@/actions/showcase-actions`, API `/api/upload`.
- Produces: Giao diện dashboard cá nhân và form đăng bài hỗ trợ chọn thành viên CLB lẫn tác giả ngoài/giảng viên.

- [ ] **Step 1: Tạo Giao diện Dashboard Thành Viên (`src/app/dashboard/page.tsx`)**

Tạo `src/app/dashboard/page.tsx`:
```tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import Link from 'next/link';
import { canUserUpload } from '@/lib/permissions';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/api/auth/signin');

  const userId = session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      createdItems: {
        orderBy: { createdAt: 'desc' },
      },
      contributions: {
        include: { item: true },
      },
    },
  });

  if (!user) redirect('/api/auth/signin');

  const isUploader = canUserUpload(user);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-10 max-w-5xl flex-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Bảng điều khiển thành viên</h1>
            <p className="text-sm text-slate-500">Xin chào, {user.fullName} ({user.role})</p>
          </div>

          {isUploader ? (
            <Link
              href="/dashboard/items/new"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm inline-flex items-center gap-2 self-start"
            >
              + Đăng tải bài mới cho nhóm
            </Link>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 max-w-md">
              💡 Bạn đang là thành viên thường. Để đăng bài đại diện cho nhóm nghiên cứu, vui lòng liên hệ Thầy chủ nhiệm để được nâng cấp lên <strong>Core Member</strong>.
            </div>
          )}
        </div>

        {/* Danh sách bài do thành viên tạo */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Các bài bạn đã khởi tạo ({user.createdItems.length})</h2>
          {user.createdItems.length === 0 ? (
            <p className="text-sm text-slate-500 italic">Bạn chưa tạo bài viết nào.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {user.createdItems.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>Năm: {item.publishedYear}</span>
                      <span>•</span>
                      <span>Loại: {item.type}</span>
                    </div>
                    {item.status === 'REJECTED' && item.rejectionReason && (
                      <div className="mt-2 p-2 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-800">
                        <strong>Lý do từ chối:</strong> {item.rejectionReason}
                      </div>
                    )}
                  </div>
                  <div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold ${
                        item.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'PENDING_REVIEW'
                          ? 'bg-amber-100 text-amber-800'
                          : item.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Tạo Form Đăng Bài Nộp (`src/components/item-form.tsx`)**

Tạo `src/components/item-form.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createShowcaseItemAction, ContributorInput, LinkInput } from '@/actions/showcase-actions';
import { ItemType, ItemScope, ContributorRole, LinkType } from '@prisma/client';

export function ItemForm({
  currentUserId,
  clubMembers,
}: {
  currentUserId: string;
  clubMembers: { id: string; fullName: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<ItemType>('RESEARCH_PAPER');
  const [scope, setScope] = useState<ItemScope>('EXTERNAL');
  const [issuer, setIssuer] = useState('');
  const [publishedYear, setPublishedYear] = useState(new Date().getFullYear());
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  // Tác giả
  const [contributors, setContributors] = useState<ContributorInput[]>([
    {
      userId: currentUserId,
      role: 'FIRST_AUTHOR',
      displayOrder: 1,
    },
  ]);

  // Links
  const [links, setLinks] = useState<LinkInput[]>([
    { label: 'Liên kết bài báo', url: '', type: 'PAPER_URL' },
  ]);

  const addInternalMember = () => {
    setContributors([
      ...contributors,
      {
        userId: clubMembers[0]?.id || currentUserId,
        role: 'CO_AUTHOR',
        displayOrder: contributors.length + 1,
      },
    ]);
  };

  const addExternalAuthor = () => {
    setContributors([
      ...contributors,
      {
        externalName: '',
        externalAffiliation: 'Khoa CNTT - ĐHKHTN',
        role: 'ADVISOR',
        displayOrder: contributors.length + 1,
      },
    ]);
  };

  const addLink = () => {
    setLinks([...links, { label: '', url: '', type: 'OTHER' }]);
  };

  const handleSubmit = async (submitForReview: boolean) => {
    setLoading(true);
    setError(null);

    const result = await createShowcaseItemAction(currentUserId, {
      title,
      summary,
      content,
      type,
      scope,
      issuer,
      thumbnailUrl,
      publishedYear,
      contributors,
      links: links.filter((l) => l.url.trim() !== ''),
      submitForReview,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Có lỗi xảy ra');
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <form className="space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm" onSubmit={(e) => e.preventDefault()}>
      {error && <div className="p-4 bg-rose-50 text-rose-800 rounded-lg text-sm">{error}</div>}

      {/* Thông tin cơ bản */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 border-b pb-2">1. Thông tin chung</h2>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Tiêu đề bài viết / đề tài *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg text-sm"
            placeholder="Ví dụ: Phân đoạn ảnh y tế đa chiều..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Phân loại *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ItemType)}
              className="w-full px-4 py-2 border rounded-lg text-sm"
            >
              <option value="RESEARCH_PAPER">Bài báo khoa học</option>
              <option value="PROJECT">Dự án công nghệ</option>
              <option value="ACHIEVEMENT">Thành tích / Cống hiến</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Phạm vi *</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as ItemScope)}
              className="w-full px-4 py-2 border rounded-lg text-sm"
            >
              <option value="EXTERNAL">Bên ngoài (NCKH, ICPC...)</option>
              <option value="INTERNAL">Nội bộ CLB</option>
              <option value="CLUB_CONTRIBUTION">Cống hiến xây dựng CLB</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Năm công bố *</label>
            <input
              type="number"
              value={publishedYear}
              onChange={(e) => setPublishedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả tóm tắt (Abstract) *</label>
          <textarea
            required
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg text-sm"
          />
        </div>
      </section>

      {/* Danh sách Tác giả & Đồng tác giả */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-lg font-bold text-slate-900">2. Danh sách Tác giả & Giảng viên hướng dẫn</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addInternalMember}
              className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-md font-semibold hover:bg-blue-100"
            >
              + Thêm thành viên CLB
            </button>
            <button
              type="button"
              onClick={addExternalAuthor}
              className="px-3 py-1 text-xs bg-slate-100 text-slate-800 rounded-md font-semibold hover:bg-slate-200"
            >
              + Thêm Thầy/Cô hoặc tác giả ngoài
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {contributors.map((c, idx) => (
            <div key={idx} className="p-4 border rounded-xl bg-slate-50 flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
              {c.userId !== undefined ? (
                <select
                  value={c.userId || ''}
                  onChange={(e) => {
                    const next = [...contributors];
                    next[idx].userId = e.target.value;
                    setContributors(next);
                  }}
                  className="px-3 py-1.5 border rounded-md text-sm bg-white"
                >
                  {clubMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Họ tên Thầy/Cô hoặc tác giả ngoài"
                    value={c.externalName || ''}
                    onChange={(e) => {
                      const next = [...contributors];
                      next[idx].externalName = e.target.value;
                      setContributors(next);
                    }}
                    className="px-3 py-1.5 border rounded-md text-sm bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Đơn vị công tác (Affiliation)"
                    value={c.externalAffiliation || ''}
                    onChange={(e) => {
                      const next = [...contributors];
                      next[idx].externalAffiliation = e.target.value;
                      setContributors(next);
                    }}
                    className="px-3 py-1.5 border rounded-md text-sm bg-white"
                  />
                </>
              )}

              <select
                value={c.role}
                onChange={(e) => {
                  const next = [...contributors];
                  next[idx].role = e.target.value as ContributorRole;
                  setContributors(next);
                }}
                className="px-3 py-1.5 border rounded-md text-sm bg-white font-medium"
              >
                <option value="ADVISOR">Người hướng dẫn / Giảng viên</option>
                <option value="FIRST_AUTHOR">Tác giả chính (First Author)</option>
                <option value="CO_FIRST_AUTHOR">Đồng tác giả 1</option>
                <option value="CO_AUTHOR">Đồng tác giả (Co-Author)</option>
                <option value="CORRESPONDING_AUTHOR">Tác giả liên hệ</option>
                <option value="PROJECT_LEAD">Trưởng nhóm dự án</option>
                <option value="CONTRIBUTOR">Thành viên tham gia</option>
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* Liên kết */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-lg font-bold text-slate-900">3. Liên kết (arXiv, Video YouTube, GitHub...)</h2>
          <button
            type="button"
            onClick={addLink}
            className="px-3 py-1 text-xs bg-slate-100 text-slate-800 rounded-md font-semibold hover:bg-slate-200"
          >
            + Thêm liên kết
          </button>
        </div>

        <div className="space-y-3">
          {links.map((link, idx) => (
            <div key={idx} className="flex gap-3">
              <input
                type="text"
                placeholder="Tên nút (VD: Xem trên arXiv)"
                value={link.label}
                onChange={(e) => {
                  const next = [...links];
                  next[idx].label = e.target.value;
                  setLinks(next);
                }}
                className="w-1/3 px-3 py-1.5 border rounded-lg text-sm"
              />
              <input
                type="text"
                placeholder="URL (https://...)"
                value={link.url}
                onChange={(e) => {
                  const next = [...links];
                  next[idx].url = e.target.value;
                  setLinks(next);
                }}
                className="w-2/3 px-3 py-1.5 border rounded-lg text-sm"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleSubmit(false)}
          className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
        >
          Lưu bản nháp
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleSubmit(true)}
          className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm"
        >
          {loading ? 'Đang gửi...' : 'Gửi Thầy chủ nhiệm duyệt'}
        </button>
      </div>
    </form>
  );
}
```

Tạo `src/app/dashboard/items/new/page.tsx`:
```tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { ItemForm } from '@/components/item-form';
import { canUserUpload } from '@/lib/permissions';

export default async function NewItemPage() {
  const session = await auth();
  if (!session?.user) redirect('/api/auth/signin');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !canUserUpload(user)) {
    redirect('/dashboard');
  }

  const members = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, fullName: true },
    orderBy: { fullName: 'asc' },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-10 max-w-4xl flex-1">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Đăng tải công trình / dự án mới</h1>
        <p className="text-sm text-slate-500 mb-8">
          Vui lòng điền thông tin đề tài, chọn các thành viên tham gia cùng và gửi để Thầy chủ nhiệm duyệt.
        </p>

        <ItemForm currentUserId={user.id} clubMembers={members} />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Kiểm tra build Next.js**

Run: `npm run build`  
Expected: Build thành công dashboard và trang tạo bài nộp.

- [ ] **Step 4: Commit task 8**

```bash
git add src/app/dashboard/ src/components/item-form.tsx
git commit -m "feat: implement Core Member submission dashboard and multi-author form"
```

---

### Task 9: Bảng Quản Trị Của Thầy Chủ Nhiệm (`/admin` Kiểm Duyệt & Phân Quyền)

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/reviews/page.tsx`
- Create: `src/app/admin/members/page.tsx`
- Create: `src/components/admin-review-button.tsx`
- Create: `src/components/admin-role-toggle.tsx`

**Interfaces:**
- Consumes: `reviewShowcaseItemAction` và `updateUserRoleAction`.
- Produces: Giao diện 1-click duyệt/từ chối bài nộp của nhóm và giao diện nâng cấp thành viên lên Core Member.

- [ ] **Step 1: Tạo Component Xử Lý Duyệt Bài và Nâng Cấp Thành Viên**

Tạo `src/components/admin-review-button.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { reviewShowcaseItemAction } from '@/actions/showcase-actions';

export function AdminReviewButton({ adminId, itemId }: { adminId: string; itemId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleReview = async (action: 'PUBLISH' | 'REJECT') => {
    let reason: string | undefined;
    if (action === 'REJECT') {
      const input = prompt('Nhập nhận xét / lý do yêu cầu nhóm chỉnh sửa:');
      if (!input) return;
      reason = input;
    }

    setLoading(true);
    await reviewShowcaseItemAction(adminId, itemId, { action, reason });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex gap-2">
      <button
        disabled={loading}
        onClick={() => handleReview('PUBLISH')}
        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
      >
        Duyệt xuất bản
      </button>
      <button
        disabled={loading}
        onClick={() => handleReview('REJECT')}
        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
      >
        Yêu cầu sửa
      </button>
    </div>
  );
}
```

Tạo `src/components/admin-role-toggle.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserRoleAction } from '@/actions/admin-actions';
import { Role } from '@prisma/client';

export function AdminRoleToggle({
  adminId,
  userId,
  currentRole,
}: {
  adminId: string;
  userId: string;
  currentRole: Role;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggleCoreMember = async () => {
    const nextRole = currentRole === 'CORE_MEMBER' ? 'MEMBER' : 'CORE_MEMBER';
    setLoading(true);
    await updateUserRoleAction(adminId, userId, nextRole);
    setLoading(false);
    router.refresh();
  };

  if (currentRole === 'ADMIN') {
    return <span className="text-xs font-bold text-amber-700">Thầy Chủ Nhiệm</span>;
  }

  return (
    <button
      disabled={loading}
      onClick={toggleCoreMember}
      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
        currentRole === 'CORE_MEMBER'
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {currentRole === 'CORE_MEMBER' ? 'Hạ xuống Member' : 'Nâng cấp lên Core Member'}
    </button>
  );
}
```

- [ ] **Step 2: Tạo Trang Quản Trị `/admin` và Trang Kiểm Duyệt `/admin/reviews`**

Tạo `src/app/admin/page.tsx`:
```tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/');
  }

  const [pendingCount, totalMembers] = await Promise.all([
    prisma.showcaseItem.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-10 max-w-5xl flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Bàn làm việc của Thầy Chủ Nhiệm</h1>
          <p className="text-slate-500 mt-1">Quản lý kiểm duyệt học thuật và phân bổ thành viên nòng cốt CLB.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Link
            href="/admin/reviews"
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 transition-all flex items-center justify-between"
          >
            <div>
              <div className="text-sm font-semibold text-slate-500">Bài nộp đang chờ Thầy duyệt</div>
              <div className="text-3xl font-bold text-amber-600 mt-2">{pendingCount} bài</div>
            </div>
            <span className="text-blue-600 font-bold text-sm">Xem chi tiết →</span>
          </Link>

          <Link
            href="/admin/members"
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 transition-all flex items-center justify-between"
          >
            <div>
              <div className="text-sm font-semibold text-slate-500">Tổng số thành viên CLB</div>
              <div className="text-3xl font-bold text-slate-900 mt-2">{totalMembers} người</div>
            </div>
            <span className="text-blue-600 font-bold text-sm">Quản lý & Nâng cấp →</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
```

Tạo `src/app/admin/reviews/page.tsx`:
```tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { AdminReviewButton } from '@/components/admin-review-button';
import Link from 'next/link';

export default async function AdminReviewsPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/');

  const pendingItems = await prisma.showcaseItem.findMany({
    where: { status: 'PENDING_REVIEW' },
    include: {
      creator: true,
      contributors: {
        include: { user: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-10 max-w-5xl flex-1">
        <Link href="/admin" className="text-sm font-medium text-slate-500 hover:text-blue-600 mb-6 inline-block">
          ← Quay lại bàn làm việc
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Duyệt bài đăng ({pendingItems.length})</h1>

        {pendingItems.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
            Hiện không có bài đăng nào cần duyệt.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingItems.map((item) => (
              <div key={item.id} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
                      {item.type}
                    </span>
                    <span className="text-xs text-slate-400">Người nộp: {item.creator.fullName}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{item.summary}</p>
                  <div className="text-xs text-slate-500 mt-2">
                    Tác giả:{' '}
                    {item.contributors
                      .map((c) => c.user?.fullName || c.externalName)
                      .join(', ')}
                  </div>
                </div>

                <AdminReviewButton adminId={session.user.id} itemId={item.id} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

Tạo `src/app/admin/members/page.tsx`:
```tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { AdminRoleToggle } from '@/components/admin-role-toggle';
import Link from 'next/link';

export default async function AdminMembersPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/');

  const members = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-10 max-w-5xl flex-1">
        <Link href="/admin" className="text-sm font-medium text-slate-500 hover:text-blue-600 mb-6 inline-block">
          ← Quay lại bàn làm việc
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Quản lý Thành viên CLB</h1>
        <p className="text-sm text-slate-500 mb-6">
          Thầy có thể nâng cấp các bạn sinh viên nòng cốt lên <strong>Core Member</strong> để các bạn có quyền nộp bài cho nhóm.
        </p>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-4">Họ và Tên</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Vai trò hiện tại</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-slate-900">{member.fullName}</td>
                  <td className="px-6 py-4 text-slate-500">{member.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        member.role === 'ADMIN'
                          ? 'bg-amber-100 text-amber-800'
                          : member.role === 'CORE_MEMBER'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <AdminRoleToggle
                      adminId={session.user.id}
                      userId={member.id}
                      currentRole={member.role}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Kiểm tra toàn bộ router và build Next.js**

Run: `npm run build`  
Expected: Next.js build hoàn thành 100% routes: `/`, `/showcase/[slug]`, `/members/[id]`, `/dashboard`, `/admin`, `/admin/reviews`, `/admin/members`.

- [ ] **Step 4: Commit task 9**

```bash
git add src/app/admin/ src/components/admin-*.tsx
git commit -m "feat: implement Admin dashboard for one-click review and member promotion"
```

---

### Task 10: Kiểm Thử Toàn Diện & Xác Minh Toàn Bộ Quy Trình (End-to-End Verification)

**Files:**
- Create: `tests/e2e/workflow.test.ts`

**Interfaces:**
- Kiểm tra khép kín:
  1. Phân quyền: Member thường bị chặn nộp bài (`canUserUpload === false`).
  2. Thầy chủ nhiệm nâng cấp Member lên `CORE_MEMBER`.
  3. Core Member nộp bài đề tài có Giảng viên hướng dẫn + Member thường.
  4. Thầy chủ nhiệm duyệt xuất bản (`PUBLISHED`).
  5. Kiểm tra bài xuất hiện trên trang chủ và portfolio của cả 2 bạn.

- [ ] **Step 1: Viết test quy trình toàn diện (End-to-End Verification Test)**

Tạo `tests/e2e/workflow.test.ts`:
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createShowcaseItemAction, reviewShowcaseItemAction } from '@/actions/showcase-actions';
import { updateUserRoleAction } from '@/actions/admin-actions';
import bcrypt from 'bcryptjs';

describe('End-to-End Club Showcase Workflow', () => {
  let admin: any;
  let newStudent: any;
  let regularStudent: any;

  beforeAll(async () => {
    admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) throw new Error('Admin not found in DB');

    // Tạo 2 sinh viên mới
    const passwordHash = await bcrypt.hash('pass123456', 10);
    newStudent = await prisma.user.create({
      data: {
        email: `student.e2e.${Date.now()}@student.hcmus.edu.vn`,
        fullName: 'Nguyễn Văn Test Sinh Viên',
        passwordHash,
        role: 'MEMBER',
        status: 'ACTIVE',
      },
    });

    regularStudent = await prisma.user.create({
      data: {
        email: `teammate.e2e.${Date.now()}@student.hcmus.edu.vn`,
        fullName: 'Lê Thị Đồng Đội',
        passwordHash,
        role: 'MEMBER',
        status: 'ACTIVE',
      },
    });
  });

  it('Step 1: Member thường không được phép nộp bài', async () => {
    const attempt = await createShowcaseItemAction(newStudent.id, {
      title: 'Đề tài chưa được cấp quyền',
      summary: 'Thử nghiệm nộp bài trái phép',
      type: 'PROJECT',
      publishedYear: 2026,
      contributors: [],
      links: [],
    });
    expect(attempt.success).toBe(false);
  });

  it('Step 2: Thầy chủ nhiệm nâng cấp sinh viên lên CORE_MEMBER', async () => {
    const promotion = await updateUserRoleAction(admin.id, newStudent.id, 'CORE_MEMBER');
    expect(promotion.success).toBe(true);
    expect(promotion.user?.role).toBe('CORE_MEMBER');
  });

  it('Step 3: Core Member nộp bài có Thầy hướng dẫn và đồng đội tham gia', async () => {
    const submission = await createShowcaseItemAction(newStudent.id, {
      title: 'Hệ Thống Trưng Bày Khoa Học NexusShowcase E2E',
      summary: 'Nền tảng trưng bày kết quả nghiên cứu sinh viên',
      type: 'PROJECT',
      scope: 'CLUB_CONTRIBUTION',
      publishedYear: 2026,
      contributors: [
        {
          userId: admin.id,
          role: 'ADVISOR',
          displayOrder: 1,
        },
        {
          userId: newStudent.id,
          role: 'PROJECT_LEAD',
          displayOrder: 2,
        },
        {
          userId: regularStudent.id,
          role: 'CONTRIBUTOR',
          displayOrder: 3,
        },
      ],
      links: [
        {
          label: 'GitHub',
          url: 'https://github.com/nexus-club/showcase',
          type: 'GITHUB',
        },
      ],
      submitForReview: true,
    });

    expect(submission.success).toBe(true);
    expect(submission.item?.status).toBe('PENDING_REVIEW');

    // Step 4: Thầy chủ nhiệm duyệt xuất bản
    const review = await reviewShowcaseItemAction(admin.id, submission.item!.id, {
      action: 'PUBLISH',
    });
    expect(review.success).toBe(true);
    expect(review.status).toBe('PUBLISHED');

    // Step 5: Kiểm tra bài tự động xuất hiện trong Portfolio của cả 2 sinh viên
    const teammateContributions = await prisma.itemContributor.findMany({
      where: {
        userId: regularStudent.id,
        item: { status: 'PUBLISHED' },
      },
    });
    expect(teammateContributions.length).toBeGreaterThan(0);

    // Clean up
    await prisma.showcaseItem.delete({ where: { id: submission.item!.id } });
    await prisma.user.delete({ where: { id: newStudent.id } });
    await prisma.user.delete({ where: { id: regularStudent.id } });
  });
});
```

- [ ] **Step 2: Chạy toàn bộ test suite**

Run: `npm test`  
Expected: Tất cả các bài test (unit, integration, e2e) chạy thành công (100% pass).

- [ ] **Step 3: Commit task 10**

```bash
git add tests/e2e/workflow.test.ts
git commit -m "test: add comprehensive end-to-end test verifying full club submission and review workflow"
```
