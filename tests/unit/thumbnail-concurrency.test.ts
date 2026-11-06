import { expect, it, vi } from 'vitest';
import sharp from 'sharp';
const { readStoredAsset } = vi.hoisted(() => ({ readStoredAsset: vi.fn() }));
vi.mock('@/features/assets/server/delivery', () => ({ readStoredAsset }));
import { readThumbnail } from '@/features/assets/server/thumbnail';

it('shares one original download across concurrent thumbnail sizes', async () => {
  const original = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#153d67' } }).png().toBuffer();
  readStoredAsset.mockResolvedValue(original);
  const thumbnails = await Promise.all([128, 384, 640].map(width => readThumbnail('/uploads/thumbnails/shared.png', width)));
  expect(readStoredAsset).toHaveBeenCalledTimes(1);
  expect(await Promise.all(thumbnails.map(async bytes => (await sharp(bytes).metadata()).width))).toEqual([128, 384, 640]);
});
