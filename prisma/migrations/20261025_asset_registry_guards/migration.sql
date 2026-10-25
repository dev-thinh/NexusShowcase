-- Lock referenced registry rows before publishing a new reference. Cleanup claims use
-- an exclusive row lock; after a claim commits, subsequent writes fail closed.
CREATE FUNCTION normalize_asset_reference_text(input_text TEXT) RETURNS TEXT LANGUAGE plpgsql IMMUTABLE STRICT AS $$
DECLARE
  decoded TEXT := input_text;
  previous TEXT;
  token TEXT[];
  code_point NUMERIC;
  pass INTEGER;
  named_entities JSONB := '{"sol":"/","period":".","lowbar":"_","UnderBar":"_","bsol":"\\","percnt":"%","amp":"&","AMP":"&","colon":":","num":"#","quest":"?","equals":"=","commat":"@","fjlig":"fj"}'::jsonb;
BEGIN
  FOR pass IN 1..8 LOOP
    previous := decoded;
    FOR token IN SELECT regexp_matches(decoded, '&([a-zA-Z]+);', 'g') LOOP
      IF named_entities ? token[1] THEN
        decoded := replace(decoded, '&' || token[1] || ';', named_entities ->> token[1]);
      END IF;
    END LOOP;
    FOR token IN SELECT regexp_matches(decoded, $pattern$(\\u([0-9a-fA-F]{4})|%([0-9a-fA-F]{2})|&#[xX]([0-9a-fA-F]{1,6});|&#([0-9]{1,7});)$pattern$, 'g') LOOP
      IF token[5] IS NOT NULL THEN
        code_point := token[5]::numeric;
      ELSE
        code_point := ('x' || lpad(coalesce(token[2], token[3], token[4]), 8, '0'))::bit(32)::bigint;
      END IF;
      IF code_point BETWEEN 32 AND 126 THEN
        decoded := replace(decoded, token[1], chr(code_point::integer));
      END IF;
    END LOOP;
    decoded := replace(decoded, chr(92) || '/', '/');
    EXIT WHEN decoded = previous;
  END LOOP;
  -- Remaining JSON escape backslashes cannot be part of a canonical asset path.
  RETURN replace(decoded, chr(92), '');
END;
$$;

CREATE FUNCTION guard_asset_references() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  row_text TEXT;
  asset_row RECORD;
BEGIN
  row_text := normalize_asset_reference_text(to_jsonb(NEW)::text);
  FOR asset_row IN
    SELECT "url", "deletionToken", "deletedAt" FROM "assets"
    WHERE strpos(row_text, "url") > 0
    ORDER BY "url" FOR SHARE
  LOOP
    IF asset_row."deletionToken" IS NOT NULL OR asset_row."deletedAt" IS NOT NULL THEN
      RAISE EXCEPTION 'Referenced asset is quarantined or deleted' USING ERRCODE = '23514';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_asset_guard BEFORE INSERT OR UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION guard_asset_references();
CREATE TRIGGER showcase_items_asset_guard BEFORE INSERT OR UPDATE ON "showcase_items" FOR EACH ROW EXECUTE FUNCTION guard_asset_references();
CREATE TRIGGER item_links_asset_guard BEFORE INSERT OR UPDATE ON "item_links" FOR EACH ROW EXECUTE FUNCTION guard_asset_references();
CREATE TRIGGER item_attachments_asset_guard BEFORE INSERT OR UPDATE ON "item_attachments" FOR EACH ROW EXECUTE FUNCTION guard_asset_references();
CREATE TRIGGER submission_revisions_asset_guard BEFORE INSERT OR UPDATE ON "submission_revisions" FOR EACH ROW EXECUTE FUNCTION guard_asset_references();
CREATE TRIGGER editorial_drafts_asset_guard BEFORE INSERT OR UPDATE ON "editorial_drafts" FOR EACH ROW EXECUTE FUNCTION guard_asset_references();
CREATE TRIGGER home_moments_gallery_asset_guard BEFORE INSERT OR UPDATE ON "home_moments_gallery" FOR EACH ROW EXECUTE FUNCTION guard_asset_references();
