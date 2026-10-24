# ImageKit and photo cleanup implementation plan

**Goal:** Activate ImageKit for new uploads, remove obsolete Cloudinary integration and existing local photos, and unify empty/broken image rendering.

**User decisions:** Credentials are already in `.env`. Do not migrate old images. User explicitly chose deleting local photos even when currently attached to posts/members. Preserve the club logo and non-image documents/resources. Empty images must share one visual throughout the site.

**Architecture:** Keep stable same-origin upload URLs, server-only authenticated ImageKit REST uploads, original-byte delivery, and local read fallback for existing documents. Default photo galleries are empty; fixture/sample data lives only in tests. No production secrets in output. One reversible live probe upload may be created and deleted to verify the configured account.

- [x] Add and test ImageKit storage/delivery, keeping authorization, file validation, size limits and download headers.
- [x] Remove Cloudinary-only provider, scripts, docs and tests; document ImageKit env variables and activation.
- [x] Introduce shared missing/broken-image UI and integrate across public/member/submission/admin image renderers.
- [x] Remove stock defaults, isolate test gallery data, audit database photo references, normalize current references, then delete authorized local photo files only.
- [x] Verify mocked failures and live ImageKit round trip, production build, unit suite and browser flows. Activate ASSET_STORAGE=imagekit only after connectivity passes.

Verification: live image/resource upload, original-byte retrieval and probe cleanup passed twice; ImageKit is active in `.env`. Removed 20 pre-existing local photos and their gallery references, keeping the logo and two PDFs. Post-test image inventory is empty. Full unit suite: 478 passed; production browser suite: 18 passed, including empty/broken images, shared library, drag/drop, responsive editor controls and uploads. TypeScript and architecture checks passed. Test env is pinned to local storage; synthetic artifacts from an earlier env-isolation failure were identified by upload window/content and removed. Browser fixture-upload cleanup now includes PNGs.

**Deletion constraints:** Resolve every physical target inside the workspace. Preserve logo.svg, PDFs and non-image resources. Use a data transaction and optimistic guards for galleries, drafts, revisions and review data when clearing local photo references. No bulk cloud migration or deletion of pre-existing cloud media.
