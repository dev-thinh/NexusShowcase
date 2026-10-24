import { expect, it } from 'vitest';
import { momentsSaveSchema } from '@/features/publications/model/moments';
import { defaultMoments } from '../fixtures/moments';
import { placeMomentPhoto } from '@/features/publications/model/moments-placement';

it('moves a photo across rows into an empty slot without duplicating it', () => {
  const result = placeMomentPhoto(defaultMoments, defaultMoments[0].id, 8);
  expect(result[0]).toEqual({ ...defaultMoments[0], slot: 8 });
  expect(result.filter(photo => photo.slot === 0)).toHaveLength(0);
  expect(momentsSaveSchema.safeParse({ version: 0, photos: result }).success).toBe(true);
});
it('swaps occupied slots, preserving each photo and its metadata', () => {
  const result = placeMomentPhoto(defaultMoments, defaultMoments[0].id, 3);
  expect(result[0]).toEqual({ ...defaultMoments[0], slot: 3 });
  expect(result[3]).toEqual({ ...defaultMoments[3], slot: 0 });
  expect(defaultMoments[0].slot).toBe(0);
});
it('places an unused library image and returns the displaced image to the library', () => {
  const unused = { ...defaultMoments[1], id: 'unused', slot: null, visible: false };
  const result = placeMomentPhoto([...defaultMoments, unused], unused.id, 0);
  expect(result[0]).toEqual({ ...defaultMoments[0], slot: null, visible: false });
  expect(result.at(-1)).toEqual({ ...unused, slot: 0, visible: true });
});
it('treats invalid drops and drops on the same slot as no-ops', () => {
  for (const [id, slot] of [[defaultMoments[0].id, 0], ['missing', 1], [defaultMoments[0].id, 12], [defaultMoments[0].id, -1]] as const) {
    expect(placeMomentPhoto(defaultMoments, id, slot)).toBe(defaultMoments);
  }
});
