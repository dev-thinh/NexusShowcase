import type { MomentPhoto } from './moments';

/** Library assets are shared; placements belong to the section being edited. */
export function mergePhotoLibrary(current: MomentPhoto[], additions: MomentPhoto[]): MomentPhoto[] {
  const photos = [...current];
  const sources = new Set(photos.map(photo => photo.src));
  const ids = new Set(photos.map(photo => photo.id));
  for (const photo of additions) {
    if (sources.has(photo.src)) continue;
    let id = photo.id;
    let suffix = 0;
    while (ids.has(id)) id = `${photo.id.slice(0, 60)}-shared-${++suffix}`;
    photos.push({ ...photo, id, slot: null, visible: false });
    sources.add(photo.src);
    ids.add(id);
  }
  return photos;
}
