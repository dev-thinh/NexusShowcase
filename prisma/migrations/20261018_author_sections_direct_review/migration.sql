-- Additive migration; legacy editorial history and enum values remain available.
ALTER TABLE "showcase_items" ADD COLUMN "authorDraft" JSONB,
  ADD COLUMN "reviewStatus" "ItemStatus",
  ADD COLUMN "reviewVersion" INTEGER NOT NULL DEFAULT 0;
-- Former editors become authors. Existing sessions are invalidated.
UPDATE "users" SET "role" = 'CORE_MEMBER', "sessionVersion" = "sessionVersion" + 1 WHERE "role" = 'EDITOR';
UPDATE "showcase_items" SET "status" = 'PENDING_REVIEW' WHERE "status" = 'READY_FOR_APPROVAL';
