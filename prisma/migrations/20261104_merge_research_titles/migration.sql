-- Each research card has one editable title; preserve both former lines.
UPDATE "home_page_content"
SET "text" = ("text" - 'researchTwoSubtitle' - 'researchThreeSubtitle') ||
    CASE WHEN jsonb_typeof("text"->'researchTwoSubtitle') = 'string'
                   AND btrim("text"->>'researchTwoSubtitle') <> ''
                   AND jsonb_typeof("text"->'researchTwoTitle') = 'string'
         THEN jsonb_build_object('researchTwoTitle', btrim("text"->>'researchTwoTitle') || ' & ' || btrim("text"->>'researchTwoSubtitle'))
         ELSE '{}'::jsonb END ||
    CASE WHEN jsonb_typeof("text"->'researchThreeSubtitle') = 'string'
                   AND btrim("text"->>'researchThreeSubtitle') <> ''
                   AND jsonb_typeof("text"->'researchThreeTitle') = 'string'
         THEN jsonb_build_object('researchThreeTitle', btrim("text"->>'researchThreeTitle') || ' & ' || btrim("text"->>'researchThreeSubtitle'))
         ELSE '{}'::jsonb END,
    "version" = "version" + 1,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "text" ? 'researchTwoSubtitle' OR "text" ? 'researchThreeSubtitle';
