-- Serialize the guard and index creation against account writers. Never rewrite
-- existing identities or expose their values in deployment logs.
BEGIN;
LOCK TABLE "users" IN SHARE ROW EXCLUSIVE MODE;
DO $$
DECLARE collision_groups bigint;
BEGIN
  SELECT count(*) INTO collision_groups FROM (
    SELECT regexp_replace(lower(btrim(email)), '@(robotics|nexus)\.hcmus\.edu\.vn$', '') FROM users
    GROUP BY regexp_replace(lower(btrim(email)), '@(robotics|nexus)\.hcmus\.edu\.vn$', '') HAVING count(*) > 1
  ) collisions;
  IF collision_groups > 0 THEN
    RAISE EXCEPTION 'Identity migration blocked: % login alias collision groups require manual resolution; no accounts changed.', collision_groups;
  END IF;
END $$;
CREATE UNIQUE INDEX "users_email_normalized_key" ON "users" (lower(btrim(email)));
CREATE UNIQUE INDEX "users_login_alias_key" ON "users" (regexp_replace(lower(btrim(email)), '@(robotics|nexus)\.hcmus\.edu\.vn$', ''));
CREATE TABLE "rate_limit_buckets" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL,
  "resetAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "rate_limit_buckets_resetAt_idx" ON "rate_limit_buckets" ("resetAt");
COMMIT;
