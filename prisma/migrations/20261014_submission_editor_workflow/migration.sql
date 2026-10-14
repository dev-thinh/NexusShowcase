-- Extend existing enums in place so rows using REJECTED and every existing role remain valid.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'EDITOR';
ALTER TYPE "ItemStatus" ADD VALUE IF NOT EXISTS 'REVISION_REQUESTED';
ALTER TYPE "ItemStatus" ADD VALUE IF NOT EXISTS 'READY_FOR_APPROVAL';
ALTER TYPE "ItemStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

CREATE TYPE "ReviewAudience" AS ENUM ('EDITORIAL', 'AUTHOR');
CREATE TYPE "ReviewSeverity" AS ENUM ('REQUIRED', 'SUGGESTION');
CREATE TYPE "ReviewCommentStatus" AS ENUM ('OPEN', 'RESOLVED');

ALTER TABLE "showcase_items"
  ALTER COLUMN "type" SET DEFAULT 'PROJECT',
  ADD COLUMN "suggestedField" TEXT,
  ADD COLUMN "customProjectType" TEXT;

CREATE TABLE "submission_revisions" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "revisionNumber" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "submittedById" TEXT NOT NULL,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "submission_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "editorial_drafts" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "assignedEditorId" TEXT,
  "overrides" JSONB NOT NULL,
  "checklist" JSONB NOT NULL DEFAULT '{}',
  "completedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "editorial_drafts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "review_comments" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "revisionId" TEXT,
  "fieldKey" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "audience" "ReviewAudience" NOT NULL,
  "severity" "ReviewSeverity" NOT NULL,
  "status" "ReviewCommentStatus" NOT NULL DEFAULT 'OPEN',
  "authorId" TEXT NOT NULL,
  "resolvedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "review_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_events" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "submission_revisions_itemId_revisionNumber_key"
  ON "submission_revisions"("itemId", "revisionNumber");
CREATE INDEX "submission_revisions_itemId_submittedAt_idx"
  ON "submission_revisions"("itemId", "submittedAt");
CREATE UNIQUE INDEX "editorial_drafts_itemId_key" ON "editorial_drafts"("itemId");
CREATE INDEX "review_comments_itemId_audience_status_idx"
  ON "review_comments"("itemId", "audience", "status");
CREATE INDEX "audit_events_itemId_createdAt_idx" ON "audit_events"("itemId", "createdAt");

ALTER TABLE "submission_revisions"
  ADD CONSTRAINT "submission_revisions_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "showcase_items"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "submission_revisions_submittedById_fkey"
  FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "editorial_drafts"
  ADD CONSTRAINT "editorial_drafts_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "showcase_items"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "editorial_drafts_assignedEditorId_fkey"
  FOREIGN KEY ("assignedEditorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "review_comments"
  ADD CONSTRAINT "review_comments_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "showcase_items"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "review_comments_revisionId_fkey"
  FOREIGN KEY ("revisionId") REFERENCES "submission_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "review_comments_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "review_comments_resolvedById_fkey"
  FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "audit_events"
  ADD CONSTRAINT "audit_events_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "showcase_items"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "audit_events_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
