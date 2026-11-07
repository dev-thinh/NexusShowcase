import sharp from 'sharp';
import { expect, test } from './fixtures';

for (const [width, height] of [[1600, 400], [400, 1600]]) test(`detail thumbnail contains the full ${width}x${height} image in its existing mobile frame`, async ({ page, database, fixture }) => {
  const image = await sharp({ create: { width, height, channels: 3, background: '#153d67' } }).png().toBuffer();
  const src = `/uploads/thumbnails/fixture-contain-${width}.png`;
  await page.route(`**${src}*`, async route => {
    const requestedWidth = Number(new URL(route.request().url()).searchParams.get('w'));
    const body = requestedWidth ? await sharp(image).resize({ width: requestedWidth, withoutEnlargement: true }).webp().toBuffer() : image;
    await route.fulfill({ contentType: requestedWidth ? 'image/webp' : 'image/png', body });
  });
  const post = await database.showcaseItem.create({ data: { creatorId: fixture.users[0].id, title: `Contain ${width}`, slug: `contain-thumbnail-${width}`, summary: 'Full image preview', thumbnailUrl: src, status: 'PUBLISHED', visibility: 'PUBLIC' } });
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/works/${post.slug}`);
    const thumbnail = page.locator('.article-header-thumbnail');
    await expect(thumbnail).toBeVisible();
    const visibleImage = thumbnail.locator('img');
    await expect(visibleImage).toHaveCSS('object-fit', 'contain');
    await expect(visibleImage).toHaveCSS('border-radius', '8px');
    await expect.poll(() => visibleImage.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
    const loaded = await visibleImage.evaluate((element: HTMLImageElement) => ({ src: element.currentSrc, ratio: element.naturalWidth / element.naturalHeight }));
    expect(loaded.src).toContain('?w=');
    // Responsive density correction rounds natural dimensions to whole CSS pixels.
    expect(Math.abs(loaded.ratio / (width / height) - 1)).toBeLessThan(0.02);
    const imageBox = await visibleImage.boundingBox();
    expect(Math.abs(imageBox!.width / imageBox!.height / (width / height) - 1)).toBeLessThan(0.02);
    const frame = await thumbnail.boundingBox();
    expect(frame!.width).toBe(240);
    expect(frame!.height).toBe(180);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await database.showcaseItem.delete({ where: { id: post.id } }); }
});
