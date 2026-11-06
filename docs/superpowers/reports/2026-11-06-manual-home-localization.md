# Manual Vietnamese and English home content

The home editor now manages two independent, complete copies. Vietnamese remains in the API `text` field, English is in `englishText`. Both are required on save. The navigation language switch selects the version being edited; the editor toolbar only contains editing actions. Switching preserves both unsaved drafts; Save persists both together under the existing optimistic version check. Each locale has separate validation errors.

Storage uses the existing JSON column with `{ vi, en }` and one shared version, so no schema migration or external service is needed. Reads retain legacy Vietnamese custom content and supply the curated English defaults until the first bilingual save. Existing custom Vietnamese content needs a corresponding manually edited English version; it is never translated automatically. Conflicts do not partially overwrite either language.

Fixed application UI continues to use the VI/EN dictionaries. Uploaded works keep their authored language. No translation API, key, or background translation job is introduced.

Validation: `npm run check` passed 978 unit tests plus type, architecture, unused and localization checks. Browser coverage includes bilingual home editing, persistence after reload, language isolation, legacy content, validation, conflicts and existing language switching.

The editor opens immediately from the rendered content snapshot without another GET request. Save still verifies active admin permissions and the shared version. Explicit reload after a conflict fetches the latest content. Browser coverage verifies opening and saving while content GET requests are unavailable.
