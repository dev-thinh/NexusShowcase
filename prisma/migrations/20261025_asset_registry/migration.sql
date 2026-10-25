-- Additive registry. Existing URLs are intentionally not assigned invented provider IDs.
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "fileId" TEXT,
    "ownerId" TEXT,
    "private" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletionToken" TEXT,
    "deletionStartedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "assets_url_key" ON "assets"("url");
CREATE UNIQUE INDEX "assets_provider_fileId_key" ON "assets"("provider", "fileId");
CREATE INDEX "assets_createdAt_deletedAt_idx" ON "assets"("createdAt", "deletedAt");
