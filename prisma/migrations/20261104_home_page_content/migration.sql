CREATE TABLE "home_page_content" (
    "id" TEXT NOT NULL,
    "text" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "home_page_content_pkey" PRIMARY KEY ("id")
);
