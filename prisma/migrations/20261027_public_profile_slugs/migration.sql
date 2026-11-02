-- Keep public URLs independent of internal IDs and stable after profile edits.
ALTER TABLE "users" ADD COLUMN "publicSlug" TEXT;
CREATE UNIQUE INDEX "users_publicSlug_key" ON "users"("publicSlug");

CREATE FUNCTION assign_user_public_slug() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  base_slug TEXT;
  candidate TEXT;
BEGIN
  -- Updates to names never change published URLs. Explicit slug writes are also
  -- blocked after initial assignment so integrations cannot accidentally break links.
  IF TG_OP = 'UPDATE' AND OLD."publicSlug" IS NOT NULL THEN
    NEW."publicSlug" := OLD."publicSlug";
    RETURN NEW;
  END IF;
  base_slug := trim(both '-' from regexp_replace(
    regexp_replace(translate(normalize(lower(NEW."fullName"), NFD), 'đ', 'd'), U&'[\0300-\036f]', '', 'g'),
    '[^a-z0-9]+', '-', 'g'));
  base_slug := left(base_slug, 100);
  base_slug := trim(trailing '-' from base_slug);
  IF base_slug = '' THEN base_slug := 'member'; END IF;
  -- Serialize identical names. The unique index remains the final safeguard.
  PERFORM pg_advisory_xact_lock(hashtextextended('user-public-slug:' || base_slug, 0));
  candidate := base_slug;
  WHILE candidate IN ('all', 'admin', 'new', 'edit', 'api', 'account', 'dashboard', 'login')
    OR EXISTS (SELECT 1 FROM users WHERE "publicSlug" = candidate) LOOP
    candidate := base_slug || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12);
  END LOOP;
  NEW."publicSlug" := candidate;
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_assign_public_slug
BEFORE INSERT OR UPDATE OF "publicSlug" ON "users"
FOR EACH ROW EXECUTE FUNCTION assign_user_public_slug();

-- The trigger derives each missing value; no names, passwords, or timestamps change.
UPDATE "users" SET "publicSlug" = NULL WHERE "publicSlug" IS NULL;
ALTER TABLE "users" ALTER COLUMN "publicSlug" SET NOT NULL;
