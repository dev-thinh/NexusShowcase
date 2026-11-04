-- Optional metadata leaves all existing publications and snapshots unchanged.
ALTER TABLE "showcase_items" ADD COLUMN "conference" JSONB;
