import { expect, it } from 'vitest';
import { researchImagesSchema } from '@/features/publications/model/research-images';
import { defaultResearchImages } from '../fixtures/moments';

it('accepts empty research positions and rejects unsafe sources or slots beyond the three positions', () => {
  expect(researchImagesSchema.safeParse({ version: 0, photos: defaultResearchImages }).success).toBe(true);
  expect(researchImagesSchema.safeParse({ version: 0, photos: defaultResearchImages.slice(1) }).success).toBe(true);
  expect(researchImagesSchema.safeParse({ version: 0, photos: [] }).success).toBe(true);
  expect(researchImagesSchema.safeParse({ version: 0, photos: [{ ...defaultResearchImages[0], slot: 3 }] }).success).toBe(false);
  expect(researchImagesSchema.safeParse({ version: 0, photos: defaultResearchImages.map(photo => ({ ...photo, src: 'https://foreign.test/photo.jpg' })) }).success).toBe(false);
});
