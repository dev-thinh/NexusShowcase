# Image frames

| Shape | Frame ratio | Recommended source size |
|---|---|---|
| Landscape | 4:3 | 1200 × 900 px |
| Square | 1:1 | 1200 × 1200 px |
| Portrait | 3:4 | 900 × 1200 px |

The image ratio tokens live in `src/app/globals.css`. Cover images, research images, gallery slots, library thumbnails, upload previews and corresponding skeletons use these ratios. Landscape is the default for publication covers and research images. Moments retain the administrator's saved shape selection.

Frames fill with `object-fit: cover`, preserving proportions and cropping excess at the center. Recommended dimensions are guidance, not upload validation: originals are not resized destructively. Logos, inline article illustrations and full-size viewers retain their source proportions; avatars use square frames with the existing circular presentation.

The home featured image has 12 px padding on mobile and 16 px on larger screens. Its inner frame maintains 4:3. Media columns and inset frames need an explicit full width to avoid collapsing when their parent uses flex or grid.

Avatar uploads open a local crop modal before any upload request. Users can drag with a mouse or touch, use arrow keys, adjust 100–400% zoom and reset the crop. The square stage includes a grid and a circular preview; movement is bounded to avoid empty edges. Confirm exports the selected square as a 1024 × 1024 JPEG and uses the existing authenticated avatar endpoint. Cancel preserves the current avatar; failed uploads retain the crop for retry. Blob URLs are revoked when the modal closes.
