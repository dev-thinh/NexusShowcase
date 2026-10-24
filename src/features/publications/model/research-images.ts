import { z } from 'zod';
import { type MomentPhoto, momentsSaveSchema } from './moments';

export const defaultResearchImages: MomentPhoto[] = [];

export const researchImagesSchema = momentsSaveSchema.superRefine((gallery, context) => {
  if (gallery.photos.length > 3 || gallery.photos.some(photo => photo.slot === null || photo.slot > 2 || !photo.visible)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Chỉ được dùng 3 vị trí ảnh hướng nghiên cứu.' });
  }
});
