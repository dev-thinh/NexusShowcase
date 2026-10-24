# Moments workspace refinement

Requested: remove obsolete topic editing after removing image badges; retain the approved slot/library concept while avoiding repeated scrolling.

Design: desktop has a fixed slot stage and independently scrolling library on the left, selected-photo preview and three fields on the right, permanent Save/Cancel footer. Mobile switches between arrangement and details with two permanent buttons; selecting an occupied photo opens details. Remove topic from schema, seed data, uploads, validation text and image viewer; old JSON topic keys are stripped on read/save without a database migration.

- [x] Add failing regression test for stripping retired topic data.
- [x] Implement independent layout panes and mobile panel switch.
- [x] Verify 40-photo library at 1280x720, desktop/mobile Save/Cancel and existing gallery flows in production browser harness.

Work in place to preserve the current uncommitted refactor. No database or asset deletion. Existing slot assignments and library capacity stay unchanged.

Verification: 446 unit tests pass; final production build/type validation succeeds; architecture check passes. Four existing wall/browser accessibility cases passed; the final four editor browser cases pass, including a 40-photo library at 1280x720, independent library scrolling without losing the stage/form, mobile mode switching, and reachability at 667x375. A review identified short-mobile clipping; the fallback allows scrolling on low-height screens while retaining the pinned footer and resetting scroll position when switching panels. Topic-removal regression proves legacy topic keys are stripped. Screenshots: `.tmp/moments-workspace-desktop.png`, `.tmp/moments-workspace-mobile.png`.
