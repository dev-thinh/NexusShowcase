# Moments drag and drop

Requested: preserve arrow buttons and add press/drag placement. Drag a staged image to another slot to swap or move into an empty slot, including across rows. Drag an unused library image to a slot to assign it and return a displaced image to the library. Touch uses a short hold, while movement before activation remains normal scrolling. Cancel on Escape/outside release; preserve click editing, Save/Cancel and unique assignments.

- [x] Test and implement immutable placement helper, reuse it for arrow moves and library assignment.
- [x] Add mouse/pen threshold and touch hold drag hook, target highlight, floating preview, cancellation/cleanup and edge scrolling.
- [x] Wire stage/library sources and all 12 targets. Retain click/keyboard controls and mobile arrangement mode after a drop.
- [x] Run unit/type/architecture checks and production browser tests for mouse, touch, cancel, library assignment and saved persistence.

No new dependencies or database changes. Work in the existing checkout, preserving unrelated changes.

Verification: 450 unit tests pass; final production build/type validation and architecture check pass. All six final production browser scenarios pass, including mouse swap/cross-row/library placement, Escape/outside cancellation, Save/Cancel/reopen persistence, and real CDP touch-hold placement with subsequent tap editing. Existing editor/upload/layout/access-control cases remain passing. Review caught a mutable closure in queued React state updates; immutable drag snapshots fix the Escape race and the browser regression passes. Fresh pointer/touch starts clear ghost-click suppression so immediate Save or another intentional tap works normally.
