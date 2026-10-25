# Profile refinements

User-requested changes: combine all publication types in one paginated list with type badges and counts; allow arbitrary titled HTTP(S) personal links; open password change in a modal; standardize every file selector; indicate that the owner's avatar can be clicked to change it.

Implementation:
- Add a nullable profileLinks JSON column with an additive migration; retain legacy links as a fallback until the profile is saved.
- Validate and persist only the authenticated user's title/URL link list.
- Use the existing publication query without a type filter for the profile, six records per page, with grouped counts.
- Reuse the shared Modal for password changes, retaining password rotation and sign-out behavior. Redirect legacy password URLs to the owner's profile with the modal open, including required password changes.
- Introduce one FilePicker with a hidden native input, accessible custom button, selected filename and busy state. Adopt it in avatar, thumbnail, resource, article image/PDF and gallery uploads.
- Add an owner-only avatar trigger with a camera badge, hover cue and keyboard support.
- Verify profile rendering, inputs and authorization through targeted tests, TypeScript and architecture checks; inspect desktop/mobile rendering and modal/file flows in the browser.

Database note: the local database has existing tables but no recorded applied migrations. Apply only this additive column migration locally, without deploying unrelated historical migrations.

Completed: the additive migration was applied locally and Prisma Client regenerated. TypeScript, all 565 unit tests and architecture checks pass. Browser checks cover public versus owner actions, combined pagination, avatar hover/click and image preview, selecting the same file twice, adding custom link fields and canceling, password modal validation and dismissal, and responsive profile/editor layouts at 390/768/1440px. Browser checks do not save changes to the existing user's profile or password.
