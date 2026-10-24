# Moments title and live preview

Approved: remove description editing, derive accessible text from the title, and use the inspector image as a live preview of the selected frame and title.

- [x] Test title-derived alt text, including legacy records with descriptions.
- [x] Remove description field and validation messages; synchronize alt with title on edits and normalize on server reads/saves.
- [x] Share frame dimensions between public photo cards and an always-visible caption preview. Keep horizontal/portrait geometry and make the square preset square.
- [x] Verify switching frames, live title changes, saving and reloading, mobile layout, and existing drag/edit interactions.

No database schema changes or asset deletion. Existing JSON descriptions remain compatible and normalize from title when read/saved. Work in the existing checkout to preserve unrelated changes.

Verification: 451 unit tests pass, production build/type validation and architecture checks pass, all ten production browser scenarios pass. Browser assertions cover no description field, live caption/alt updates, measured horizontal/portrait/square preview ratios, persisted frame/title-derived alt after reopen, mouse/touch dragging, short/mobile layout, original viewer and public access. Read-only review found no important issues. Screenshots checked; the preview label was nudged above the frame to avoid being covered by the image, with CSS syntax verified afterward.
