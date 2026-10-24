# Moments modal and library

User-approved design: admin pencil opens a large modal. Top: two fixed rows of six selectable slots, each photo used once. Edit only the selected photo. Below: saved photo library (40 maximum), All/Unused filter and upload. Remove from row retains library asset; delete from library is separate. Sticky Save/Cancel. Each public row hides at zero, centers static photos at one/two, animates its own photos at three/six. Empty slots remain editor-only.

Implementation: extend existing photo JSON with a nullable slot 0–11; normalize older visible arrays to the first twelve slots in order, preserving all other library assets. No database schema change. Server validates slots and uniqueness; guest API returns assigned photos only. Existing six default photos occupy the first row, with no duplication into the second.

- [x] Test legacy conversion, unique slots, capacity, public row counts and animation thresholds.
- [x] Extend model/API and render distinct public rows with independent motion.
- [x] Replace long inline forms with modal slots, one inspector and compact library.
- [x] Update browser tests for modal, library reuse, row assignment, Save/Cancel and mobile; run checks.

Work in the current checkout to preserve the existing uncommitted refactor and homepage work. Keep optimistic version protection and existing uploads. No physical asset deletion. Uploads and metadata become part of the saved gallery only on Save, as with the previous editor.

Verification: 445 unit tests pass, production build/type validation passes, architecture check passes, and all 7 isolated production browser tests pass. Browser tests cover real upload, reusing stored library images after reload, unique row placement, partial rows at 0/1/2/3/6 photos, Save/Cancel, failed-save retention, stale-version rejection and mobile footer/overflow. Read-only code review found no critical or important issues. Screenshots: `.tmp/moments-modal-desktop.png` and `.tmp/moments-modal-mobile.png`.
