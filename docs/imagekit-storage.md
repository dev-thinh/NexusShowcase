# ImageKit storage

Set these server-only variables in `.env` (or the hosting environment), then restart the application:

```dotenv
ASSET_STORAGE=imagekit
IMAGEKIT_PUBLIC_KEY=public_...
IMAGEKIT_PRIVATE_KEY=private_...
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
IMAGEKIT_FOLDER=nexus-showcase
```

`IMAGEKIT_FOLDER` is a project folder, not the ImageKit ID. The public key is retained for dashboard/client compatibility; backend uploads authenticate with the private key. Do not expose the private key through `NEXT_PUBLIC_` or commit `.env`.

New uploads use the backend ImageKit Upload API with deterministic UUID filenames, `useUniqueFileName=false`, and `overwriteFile=false`. The application keeps its `/uploads/thumbnails/…`, `/uploads/documents/…`, and `/uploads/resources/…` URLs. Delivery reads the original bytes using `tr=orig-true` and preserves image/PDF MIME types and forced-download resource headers. Old non-image local files remain readable. Authorization, signature validation, 5 MB thumbnail and 25 MB resource/PDF limits remain unchanged.

The ImageKit endpoint must be the account's `https://ik.imagekit.io/...` URL. Invalid configuration or a failed upload returns an error; uploads never silently switch to local storage. `ASSET_STORAGE=local` remains available for isolated tests. Cloudinary integration and migration scripts have been removed.

Verify the live account without transferring existing photos:

```powershell
npm.cmd run assets:check:imagekit
```

This creates a tiny image and text-resource probe, downloads both through the real delivery adapter, compares original bytes, and deletes only those newly-created probe files. It never prints credentials or deletes pre-existing media.

There are no bundled stock photographs in production galleries. Missing images and failed loads use the shared `MediaImage` placeholder across public pages, members, submissions and photo editors. The club logo is retained as branding. Test photographs are generated PNG fixtures in isolated browser tests, not production defaults.

The local-image cleanup script defaults to read-only inventory. Its `--apply` mode clears only references to the inventoried local photo paths, with a JSON reference backup in `.tmp`, optimistic database guards, and bounded physical deletions. Do not run it to delete ImageKit media. It is not a cloud migration tool.

Official references: [API authentication](https://imagekit.io/docs/api-keys), [Upload API](https://imagekit.io/docs/integration/nextjs), [original-byte delivery](https://imagekit.io/docs/core-delivery-features).
