# Canonical page URLs

Follow-up requested by the user after autosave: align URLs with current page names and retain old shared links. Continue the repository's English URL convention. This is a route refactor; UI labels, database category slugs, authorization, API and media endpoints retain their existing contracts.

| Page | Canonical URL | Legacy URL |
| --- | --- | --- |
| Scientific research | /research | /category/bai-bao-khoa-hoc, /category/thanh-tich, /explore |
| Projects and products | /projects | /category/robotics-iot, /category/du-an-sang-tao |
| Work detail | /works/[slug] | /showcase/[slug] |
| My works | /my-works | /dashboard |
| Create work | /my-works/new | /dashboard/items/new |
| Edit work / local recovery | /my-works/[id]/edit | /dashboard/items/[id]/edit |
| Admin published works | /admin/works | /admin/content |

Keep /members, /members/all, /members/[id-or-slug], /contact, /login, /account/change-password, /admin, /admin/reviews and /admin/members: they already describe their pages.

Use permanent Next.js redirects for known legacy page URLs, preserving query parameters. Move route files to canonical paths, update links, redirects, breadcrumbs, filter/pagination URLs, cache invalidation and auth callbacks. Extract shared category presentation into publications so /research and /projects remain thin route wrappers. Never rename internal category slugs or rewrite media/API paths. Normalize legacy returnTo paths before the existing same-origin allowlist check.

Verify legacy redirect destinations/query preservation, canonical detail/list/back navigation, authenticated create/edit/recovery and admin links. Update source-path assertions and navigation harness paths; run full check/integration, production browser scenarios and migration upgrade verification already required for autosave.
