-- Existing accounts remain visible; only explicitly hidden accounts are excluded.
ALTER TABLE "users" ADD COLUMN "hiddenFromDirectory" BOOLEAN NOT NULL DEFAULT false;
