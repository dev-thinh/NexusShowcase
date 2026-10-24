import { expect, seedPhotoGalleries, test } from './fixtures';

test('research photos stay aligned on desktop and compact alongside readable text on mobile', async ({ page, database }) => {
  test.setTimeout(60_000);
  await seedPhotoGalleries(database);
  // Measure static layout, rather than sequential frames of the page reveal.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const section = page.locator('[data-deferred-section="research"]');
    await section.scrollIntoViewIfNeeded();
    const articles = section.locator('.research-direction');
    await expect(articles).toHaveCount(3);
    for (const article of await articles.all()) {
      const image = article.getByRole('img');
      await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      const layout = await article.evaluate(element => {
        const photo = element.querySelector('.research-direction__photo')!.getBoundingClientRect();
        const body = element.querySelector('.research-direction__body')!.getBoundingClientRect();
        return { photoRight: photo.right, photoBottom: photo.bottom, bodyX: body.x, bodyY: body.y };
      });
      if (width >= 768) expect(layout.bodyY).toBeGreaterThanOrEqual(layout.photoBottom - 1);
      else expect(layout.bodyX).toBeGreaterThanOrEqual(layout.photoRight - 1);
      await expect(article.getByRole('heading', { level: 3 })).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (width === 1440 || width === 390) await page.locator('.research-band').screenshot({ path: `.tmp/research-photos-${width}.png` });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.research-direction__photo img').first()).toHaveCSS('transition-duration', '0s');
  await database.homeMomentsGallery.deleteMany();
});


test('missing research photos use shared placeholders and retain each direction', async ({ page, database }) => {
  await database.homeMomentsGallery.deleteMany();
  await page.goto('/');
  const section = page.locator('[data-deferred-section="research"]');
  await section.scrollIntoViewIfNeeded();
  await expect(section.locator('.research-direction')).toHaveCount(3);
  await expect(section.locator('.research-direction__photo img')).toHaveCount(0);
  await expect(section.locator('[data-media-placeholder="true"]')).toHaveCount(3);
  for (const article of await section.locator('.research-direction').all()) {
    await expect(article.getByRole('heading', { level: 3 })).toBeVisible();
    await expect(article.locator('[data-media-placeholder]')).toBeVisible();
  }
});
