# Vietnamese / English interface

## Behavior

- A VI/EN switch sits immediately left of the profile/sign-in control. It remains visible on mobile and supports keyboard interaction, an accessible switch state and reduced motion.
- Vietnamese is the default. The selection is saved in a one-year, same-site cookie (`nexus-locale`) and is read by the server for initial rendering, the document language and interface metadata.
- Client labels update immediately; server text is refreshed without changing the URL. A pending route transition commits before the locale refresh runs, preserving the destination and browser history.
- Public navigation, default home copy, research/projects, member/profile pages, administration, editor controls, forms, validation, dialogs, success notices, skeletons, relevant date/number formatting and accessibility labels use the shared translation system.
- User-authored article titles/body, names, captions, profile text, custom home copy and existing input values retain their original content. This feature does not translate or overwrite stored articles.
- Newly inserted editor scaffolding uses the selected language. Existing authored section headings remain unchanged.

## Maintenance

The four English catalogs live in `src/shared/i18n/messages/`. Translation helpers accept a Vietnamese source phrase plus numbered interpolation values. Domain models and stored messages retain their original values; presentation translates them. Success notifications retain source messages and values so a visible notice follows later language changes.

`npm run check:i18n` validates literal translation calls and numbered placeholders. It is included in `npm run check`. Unrecognized text is returned unchanged; templates can localize formatted server messages without translating captured user values.

## Verification

- 1,100 unique catalog messages; no missing literal keys or placeholder mismatches.
- 974 unit tests passed, including cookie parsing, server metadata, real context rendering, authored breadcrumb preservation, notification source parameters and deferred locale refresh.
- 139 isolated database integration tests passed.
- Production build and 19 browser tests passed. Coverage includes language persistence, server copy, member/admin controls, authored content, unsaved drafts, autosave/version conflicts, success notices, English section suggestions, navigation cancellation, browser history and navbar layout at 320/390/768/1440px.
- Independent code review found no critical/important issue. Both minor findings were addressed and tested.

Work remains on `dev`; no production deployment, dependency installation, database migration or article-data rewrite was performed.
