# Member directory and article heading implementation plan

> Execute inline with superpowers:executing-plans.

**Goal:** Apply the approved member-directory simplification and thumbnail beside the article title.
**Architecture:** Keep role-group pagination and the existing MediaImage renderer. Use conditional responsive grid headers; no thumbnail means full-width text. Keep the legacy /members/all URL available for existing links.
**Tech stack:** Next.js 16, React, Tailwind CSS.
**Spec:** User approved in conversation: remove the redundant directory button; image right of title on desktop, after title/authors on mobile, never repeated below abstract.

- [x] Update the existing member-page assertion and verify it fails before removing the link and unused imports.
- [x] Move the detail thumbnail into the header using minmax(0,2fr)/minmax(0,1fr) columns at lg; preserve the full image with object-contain, 4:3 reserved space, and descriptive alt text.
- [x] Apply the same conditional header layout to SubmissionPreview and the editor preview.
- [x] Run typecheck, unit tests and architecture checks. Inspect desktop/mobile layouts using Playwright against local dev, including image/no-image cases and horizontal overflow.

Review: long titles must wrap, absent images must not reserve space, mobile image follows authors, preview and public detail agree, directory pagination remains intact. No new mirrored tests for styling-only edits.

Verification: member assertion failed before implementation; npm run check passed (133 files, 657 tests). Browser verified members link absent, no-image header, image right at 1440px and below at 390px, no duplicate body image and no horizontal overflow. Temporary DB thumbnail was restored after the browser check.
