import { expect, it } from 'vitest';
import { mergePhotoLibrary } from '@/features/publications/model/photo-library';
import { defaultMoments } from '../fixtures/moments';

it('shares photos by source without carrying placements into another section', () => {
  const current = [defaultMoments[0]];
  const added = { ...defaultMoments[1], id: current[0].id };
  const merged = mergePhotoLibrary(current, [current[0], added]);
  expect(merged).toHaveLength(2);
  expect(merged[0]).toEqual(current[0]);
  expect(merged[1]).toMatchObject({ src: added.src, slot: null, visible: false });
  expect(new Set(merged.map(photo => photo.id)).size).toBe(2);
});
