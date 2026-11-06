# Vietnamese / English localization

**Goal:** Provide a persistent VI/EN switch next to the navbar profile and translate the complete application UI while preserving existing layouts, URLs, permissions and draft state.

**Architecture:** A shared phrase catalog and placeholder interpolation serve client and server translation helpers. A request cookie selects the initial server-rendered locale; a client provider updates translations without navigating away from an editor. The switch sits immediately left of the profile and remains visible on mobile. User-entered article content and proper names retain their original text; automatic content translation is a separately pending scope question.

**Constraints:** Work directly on dev; preserve existing changes. No DOM text mutation or third-party translation service. Use Next.js async cookies. Keep Vietnamese as the default and support reduced motion, keyboard interaction, and localized accessibility labels.

## Implementation

- [x] Inventory static text and dynamic UI templates; create reviewed English catalogs for shared/pages, identity, publications and submissions.
- [x] Add locale parsing, safe interpolation, server request helper, client provider and accessible switch; prove persistence and SSR/hydration behavior with tests.
- [x] Apply translations to public pages, navigation/footer, member pages, administrative interfaces, editor, dialogs, errors, validation and skeleton labels. Preserve user input and article bodies.
- [x] Translate dates/numbers and page metadata; ensure home defaults have English copy while custom edited text remains user data.
- [x] Test both locales, switching while editing, reloads, route transitions, logged-out/logged-in users and mobile navbar fit. Run existing verification and review the final diff.

## Review risks

- Locale changes must not lose unsaved drafts or trigger navigation races.
- UI labels and user-authored text must remain distinguishable.
- Dictionaries must cover placeholders and accessible names as well as visible text.
- Server-generated UI must use the locale cookie on first render.
- English text must not cause mobile overflow or displace account controls.

## Completion evidence

- English catalogs: 1,100 unique messages; translation-key and placeholder audit passes.
- `npm run check`: 974 unit tests pass; type, unused-code, architecture and i18n gates pass.
- Full isolated database integration suite: 139 tests pass.
- Production build and 19 browser tests pass, including locale persistence, server metadata, admin roles, authored-content preservation, unsaved draft recovery, live toast language changes, suggested section headings, responsive navbar fit and navigation/history races.
- Independent review found no critical or important issue. Both minor findings (pretranslated notices and inserted section scaffolding) were fixed with regression coverage.
- Additional navigation-race investigation showed a locale refresh can cancel an in-flight push. `LocaleRefresh` now waits for navigation to commit before refreshing the latest destination.

Ruling: apply VI/EN to UI/default introductory copy and retain user-authored articles, names and custom copy in their source language. This was the recommended scope in the pending optional clarification; no translation service or article data mutation was introduced.
