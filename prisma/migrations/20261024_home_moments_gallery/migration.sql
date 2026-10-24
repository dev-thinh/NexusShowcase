CREATE TABLE "home_moments_gallery" (
    "id" TEXT NOT NULL,
    "photos" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "home_moments_gallery_pkey" PRIMARY KEY ("id")
);
