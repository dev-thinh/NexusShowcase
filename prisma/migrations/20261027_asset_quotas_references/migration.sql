BEGIN;
ALTER TABLE "assets" ADD COLUMN "byteSize" BIGINT;
ALTER TABLE "assets" ADD CONSTRAINT "assets_byteSize_check" CHECK ("byteSize" IS NULL OR "byteSize" > 0);
CREATE TABLE "upload_reservations" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ownerId" TEXT NOT NULL,
  "byteSize" BIGINT NOT NULL CHECK ("byteSize" > 0),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "upload_reservations_ownerId_idx" ON "upload_reservations"("ownerId");
CREATE INDEX "users_avatarUrl_idx" ON "users"("avatarUrl");
CREATE TABLE "asset_item_references" (
  "url" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  CONSTRAINT "asset_item_references_pkey" PRIMARY KEY ("url", "itemId"),
  CONSTRAINT "asset_item_references_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "showcase_items"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "asset_item_references_itemId_idx" ON "asset_item_references"("itemId");

-- Candidate index only: final authorization still checks exact normalized
-- references and current publication status/visibility, never stale cached ACLs.
CREATE FUNCTION refresh_asset_item_references(target_id TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('asset-item-index:' || target_id, 0));
  DELETE FROM asset_item_references WHERE "itemId" = target_id;
  INSERT INTO asset_item_references (url, "itemId")
    SELECT DISTINCT matched[1], i.id FROM showcase_items i
    LEFT JOIN editorial_drafts e ON e."itemId" = i.id
    CROSS JOIN LATERAL regexp_matches(normalize_asset_reference_text(jsonb_build_array(
      i."thumbnailUrl", i.content, i."mediaDriveUrl", i."authorDraft", e.overrides,
      (SELECT jsonb_agg(l.url) FROM item_links l WHERE l."itemId" = i.id),
      (SELECT jsonb_agg(a."fileUrl") FROM item_attachments a WHERE a."itemId" = i.id),
      (SELECT jsonb_agg(r.snapshot) FROM submission_revisions r WHERE r."itemId" = i.id)
    )::text), '(/uploads/(?:thumbnails/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)|documents/[a-zA-Z0-9_-]+\.pdf|resources/[a-zA-Z0-9_-]+\.[a-z0-9]{1,16}))', 'g') AS matched
    WHERE i.id = target_id ON CONFLICT DO NOTHING;
END;
$$;
CREATE FUNCTION sync_asset_item_references() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME = 'showcase_items' THEN
    IF TG_OP = 'DELETE' THEN
      PERFORM refresh_asset_item_references(OLD.id);
    ELSE
      PERFORM refresh_asset_item_references(NEW.id);
    END IF;
  ELSE
    IF TG_OP <> 'INSERT' THEN PERFORM refresh_asset_item_references(OLD."itemId"); END IF;
    IF TG_OP <> 'DELETE' THEN PERFORM refresh_asset_item_references(NEW."itemId"); END IF;
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER showcase_items_reference_index AFTER INSERT OR UPDATE OR DELETE ON "showcase_items" FOR EACH ROW EXECUTE FUNCTION sync_asset_item_references();
CREATE TRIGGER item_links_reference_index AFTER INSERT OR UPDATE OR DELETE ON "item_links" FOR EACH ROW EXECUTE FUNCTION sync_asset_item_references();
CREATE TRIGGER item_attachments_reference_index AFTER INSERT OR UPDATE OR DELETE ON "item_attachments" FOR EACH ROW EXECUTE FUNCTION sync_asset_item_references();
CREATE TRIGGER submission_revisions_reference_index AFTER INSERT OR UPDATE OR DELETE ON "submission_revisions" FOR EACH ROW EXECUTE FUNCTION sync_asset_item_references();
CREATE TRIGGER editorial_drafts_reference_index AFTER INSERT OR UPDATE OR DELETE ON "editorial_drafts" FOR EACH ROW EXECUTE FUNCTION sync_asset_item_references();
SELECT refresh_asset_item_references(id) FROM showcase_items;
COMMIT;
