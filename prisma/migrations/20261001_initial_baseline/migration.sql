-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('GUEST', 'MEMBER', 'CORE_MEMBER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('RESEARCH_PAPER', 'PROJECT', 'ACHIEVEMENT');

-- CreateEnum
CREATE TYPE "ItemScope" AS ENUM ('INTERNAL', 'CLUB_CONTRIBUTION', 'EXTERNAL', 'OPEN_SOURCE');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ItemVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "CategoryLayout" AS ENUM ('SHOWCASE_GRID', 'BIBLIOGRAPHY', 'DATA_CATALOG', 'HONOR_ROLL');

-- CreateEnum
CREATE TYPE "ContributorRole" AS ENUM ('ADVISOR', 'FIRST_AUTHOR', 'CO_FIRST_AUTHOR', 'CO_AUTHOR', 'CORRESPONDING_AUTHOR', 'PROJECT_LEAD', 'CONTRIBUTOR', 'CUSTOM');

-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('PAPER_URL', 'VIDEO_EMBED', 'GITHUB', 'LIVE_DEMO', 'SLIDES', 'CERTIFICATE', 'OTHER');

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "layoutType" "CategoryLayout" NOT NULL DEFAULT 'SHOWCASE_GRID',
    "isNavFeatured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "fullName" TEXT NOT NULL,
    "studentId" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "githubUrl" TEXT,
    "linkedinUrl" TEXT,
    "googleScholarUrl" TEXT,
    "portfolioUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'GUEST',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "sessionVersion" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "showcase_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT,
    "type" "ItemType" NOT NULL,
    "scope" "ItemScope",
    "issuer" TEXT,
    "thumbnailUrl" TEXT,
    "status" "ItemStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "ItemVisibility" NOT NULL DEFAULT 'PRIVATE',
    "rejectionReason" TEXT,
    "publishedYear" INTEGER DEFAULT 2026,
    "publishedAt" TIMESTAMP(3),
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "pinnedAt" TIMESTAMP(3),
    "mediaDriveUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "showcase_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_contributors" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT,
    "externalName" TEXT,
    "externalAffiliation" TEXT,
    "externalLink" TEXT,
    "role" "ContributorRole" NOT NULL DEFAULT 'CONTRIBUTOR',
    "customRoleTitle" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "item_contributors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_links" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "LinkType" NOT NULL DEFAULT 'OTHER',

    CONSTRAINT "item_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_attachments" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,

    CONSTRAINT "item_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_tags" (
    "itemId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "item_tags_pkey" PRIMARY KEY ("itemId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "showcase_items_slug_key" ON "showcase_items"("slug");

-- CreateIndex
CREATE INDEX "showcase_items_type_status_idx" ON "showcase_items"("type", "status");

-- CreateIndex
CREATE INDEX "showcase_items_status_visibility_idx" ON "showcase_items"("status", "visibility");

-- CreateIndex
CREATE INDEX "showcase_items_categoryId_idx" ON "showcase_items"("categoryId");

-- CreateIndex
CREATE INDEX "showcase_items_publishedYear_idx" ON "showcase_items"("publishedYear");

-- CreateIndex
CREATE INDEX "showcase_items_isPinned_status_idx" ON "showcase_items"("isPinned", "status");

-- CreateIndex
CREATE INDEX "item_contributors_itemId_idx" ON "item_contributors"("itemId");

-- CreateIndex
CREATE INDEX "item_contributors_userId_idx" ON "item_contributors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- AddForeignKey
ALTER TABLE "showcase_items" ADD CONSTRAINT "showcase_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showcase_items" ADD CONSTRAINT "showcase_items_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_contributors" ADD CONSTRAINT "item_contributors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_contributors" ADD CONSTRAINT "item_contributors_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "showcase_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_links" ADD CONSTRAINT "item_links_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "showcase_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_attachments" ADD CONSTRAINT "item_attachments_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "showcase_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_tags" ADD CONSTRAINT "item_tags_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "showcase_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_tags" ADD CONSTRAINT "item_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
