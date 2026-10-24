import type { MomentPhoto } from './moments';

export function placeMomentPhoto(photos: MomentPhoto[], photoId: string, target: number): MomentPhoto[] {
  const source = photos.find(photo => photo.id === photoId);
  if (!source || !Number.isInteger(target) || target < 0 || target > 11 || source.slot === target) return photos;
  return photos.map(photo => photo.id === photoId ? { ...photo, slot: target, visible: true }
    : photo.slot === target ? { ...photo, slot: source.slot, visible: source.slot !== null } : photo);
}
