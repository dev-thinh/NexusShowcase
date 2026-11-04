-- Preserve custom titles while merging the first research card's two fields.
UPDATE "home_page_content"
SET "text" = ("text" - 'researchOneSubtitle' - 'membersDescription') ||
    CASE WHEN jsonb_typeof("text"->'researchOneSubtitle') = 'string'
                   AND btrim("text"->>'researchOneSubtitle') <> ''
                   AND jsonb_typeof("text"->'researchOneTitle') = 'string'
         THEN jsonb_build_object('researchOneTitle', btrim("text"->>'researchOneTitle') || ' & ' || btrim("text"->>'researchOneSubtitle'))
         ELSE '{}'::jsonb END,
    "version" = "version" + 1,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "text" ? 'researchOneSubtitle' OR "text" ? 'membersDescription';
