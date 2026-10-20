-- Remove keyword metadata and the unused normalized tag catalog.
ALTER TABLE "showcase_items" DROP COLUMN IF EXISTS "tags";
DROP TABLE IF EXISTS "item_tags";
DROP TABLE IF EXISTS "tags";

-- Editable drafts must no longer carry removed publication fields.
UPDATE "showcase_items"
SET "authorDraft" = "authorDraft" - 'tags'
WHERE "authorDraft" ? 'tags';
UPDATE "editorial_drafts"
SET "overrides" = "overrides" - 'tags'
WHERE "overrides" ? 'tags';
-- Submission revision snapshots and audit events remain historical records.
