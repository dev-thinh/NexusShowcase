import { expect, it } from 'vitest';
import { momentPhotoPose } from '@/features/publications/model/moments';
import { defaultMoments } from '../fixtures/moments';

it('gives uniformly uploaded photos a stable mix of left and right angles and vertical offsets', () => {
  const photos = defaultMoments.map(photo => ({ ...photo, tilt: '-2deg' as const }));
  const poses = photos.map(momentPhotoPose);
  expect(poses.some(pose => parseFloat(pose.tilt) > 0)).toBe(true);
  expect(poses.some(pose => parseFloat(pose.tilt) < 0)).toBe(true);
  expect(new Set(poses.map(pose => pose.tilt)).size).toBeGreaterThan(2);
  expect(new Set(poses.map(pose => pose.offset)).size).toBeGreaterThan(2);
  expect(photos.map(momentPhotoPose)).toEqual(poses);
});
