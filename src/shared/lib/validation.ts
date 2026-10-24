import { z } from 'zod';
export const INVALID_ACTION_INPUT_ERROR = 'Invalid input.';

export const MAX_CURRENT_YEAR = new Date().getFullYear() + 1;
export const cuidSchema = z.string().cuid();
export const trimmedText = (max: number) => z.string().trim().max(max);

export const safeHttpUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return protocol === 'http:' || protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Only HTTP(S) URLs are allowed.');


export const showcaseItemIdSchema = cuidSchema;

export const storedFileUrlSchema = z.union([
  safeHttpUrlSchema,
  z.string().regex(/^\/uploads\/(thumbnails|documents)\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp|pdf)$/),
]);
