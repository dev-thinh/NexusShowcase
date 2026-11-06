import { expect, it } from 'vitest';
import { avatarCrop } from '@/features/identity/model/avatar-crop';

it('starts with a centered square crop of a landscape image', () => {
  expect(avatarCrop(1200, 800, 1, { x: 0, y: 0 })).toMatchObject({ sourceX: 200, sourceY: 0, size: 800 });
});
it('clamps dragging so the square never exposes empty edges', () => {
  expect(avatarCrop(1200, 800, 1, { x: 100, y: -100 })).toMatchObject({ sourceX: 0, sourceY: 0, offsetX: 0.25, offsetY: 0 });
});
it('zooms around the selected center and bounds portrait crops', () => {
  const crop = avatarCrop(800, 1200, 2, { x: -0.5, y: 1 });
  expect(crop).toMatchObject({ sourceX: 400, sourceY: 0, size: 400 });
  expect(crop.sourceX + crop.size).toBeLessThanOrEqual(800);
  expect(crop.sourceY + crop.size).toBeLessThanOrEqual(1200);
});
it('returns to a valid crop when zooming out after moving to an edge', () => {
  expect(avatarCrop(800, 800, 1, { x: 1.5, y: 1.5 })).toMatchObject({ sourceX: 0, sourceY: 0, size: 800, offsetX: 0, offsetY: 0 });
});
