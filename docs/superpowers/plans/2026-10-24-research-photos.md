# Research direction photography

User requests replacing three decorative research diagrams with photographs integrated into the existing blue section. Use the existing locally bundled illustrative stock photos to demonstrate layout, without representing them as club research records. Three desktop columns: consistent landscape image, then number/title/description directly on the blue background. Subtle blue tint, thin rim and a shaded lower edge. Mobile uses compact image-left/text-right articles. Do not put text on photographs or add image badges.

- [x] Replace diagrams with three lazy local images and accurate alt text; remove stale SVG/animation code.
- [x] Update responsive image/article styling and skeleton geometry.
- [x] Verify desktop/tablet/mobile image loading, readable headings, reduced motion and deferred section behavior.

Reuse existing assets: workshop (laboratory computer work), robotics (robot design sketches), electronics (circuit board). No new dependencies, image generation, database changes or admin editor scope. Work in the current checkout to preserve existing changes.

Verification: 15 targeted homepage unit tests pass; production build/type validation, architecture and CSS syntax checks pass. All six production browser tests pass, covering 1440/768/390/320 layouts, loaded images, no horizontal overflow, reduced-motion behavior and deferred fetch/retry/navigation. Geometry checks use reduced motion and atomic DOM measurements to avoid sampling different reveal frames; preload assertions use a viewport that places the first section beyond the existing 200px observer margin. Screenshots: `.tmp/research-photos-1440.png` and `.tmp/research-photos-390.png`.
