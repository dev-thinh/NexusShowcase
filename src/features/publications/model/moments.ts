import { z } from 'zod';

export const momentPhotoSchema = z.object({
  id: z.string().min(1).max(80),
  src: z.string().regex(/^\/(?:images\/moments\/[a-zA-Z0-9_-]+\.webp|uploads\/thumbnails\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp))$/),
  title: z.string().trim().min(1).max(160),
  shape: z.enum(['wide', 'portrait', 'square']),
  tilt: z.enum(['-3deg', '3deg', '-2deg', '4deg', '2deg']),
  visible: z.boolean(),
  slot: z.number().int().min(0).max(11).nullable().optional(),
}).transform(photo => ({ ...photo, alt: photo.title }));
export type MomentPhoto = z.infer<typeof momentPhotoSchema> & { slot: number | null };
export const momentsSaveSchema = z.object({
  version: z.number().int().min(0),
  photos: z.array(momentPhotoSchema).max(40).refine(photos => new Set(photos.map(photo => photo.id)).size === photos.length, 'Ảnh bị trùng mã.'),
}).transform(gallery => {
  const occupied = new Set(gallery.photos.filter(photo => photo.visible && photo.slot != null).map(photo => photo.slot));
  let nextSlot = 0;
  const photos: MomentPhoto[] = gallery.photos.map(photo => {
    let slot = photo.visible ? photo.slot : null;
    if (slot === undefined) {
      while (occupied.has(nextSlot)) nextSlot++;
      slot = nextSlot < 12 ? nextSlot++ : null;
    }
    return { ...photo, slot, visible: slot !== null };
  });
  return { ...gallery, photos };
}).superRefine((gallery, context) => {
  const assigned = gallery.photos.filter(photo => photo.slot !== null).map(photo => photo.slot);
  if (new Set(assigned).size !== assigned.length) context.addIssue({ code: z.ZodIssueCode.custom, path: ['photos'], message: 'Mỗi vị trí chỉ được dùng cho một ảnh.' });
});
export type MomentsGallery = z.infer<typeof momentsSaveSchema>;
export type MomentsPayload = MomentsGallery & { isAdmin: boolean; library?: MomentsGallery; protectedSources?: string[] };

export const defaultMoments: MomentPhoto[] = [];

export function momentRows(photos: MomentPhoto[]): [MomentPhoto[], MomentPhoto[]] {
  const assigned = photos.filter(photo => photo.visible && photo.slot !== null).sort((a, b) => a.slot! - b.slot!);
  return [assigned.filter(photo => photo.slot! < 6), assigned.filter(photo => photo.slot! >= 6)];
}
