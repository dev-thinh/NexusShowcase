import { expect, seedPhotoGalleries, test } from './fixtures';

test('research cards stagger on desktop and stack photos above centered text on mobile', async ({ page, database }) => {
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
        const title = element.querySelector('h3')!.getBoundingClientRect();
        const description = element.querySelector('.research-direction__description')!;
        const copy = description.getBoundingClientRect();
        return {
          photoBottom: photo.bottom, bodyY: body.y,
          titleCenter: (title.left + title.right) / 2,
          descriptionCenter: (copy.left + copy.right) / 2,
          photoCenter: (photo.left + photo.right) / 2,
          descriptionAlign: getComputedStyle(description).textAlign,
        };
      });
      expect(layout.bodyY).toBeGreaterThanOrEqual(layout.photoBottom - 1);
      expect(Math.abs(layout.titleCenter - layout.photoCenter)).toBeLessThan(1);
      expect(Math.abs(layout.descriptionCenter - layout.photoCenter)).toBeLessThan(1);
      expect(layout.descriptionAlign).toBe('center');
      await expect(article.getByRole('heading', { level: 3 })).toBeVisible();
    }
    const photoTops = await articles.evaluateAll(elements => elements.map(element => element.querySelector('.research-direction__photo')!.getBoundingClientRect().top));
    if (width >= 768) {
      expect(photoTops[1]).toBeGreaterThan(photoTops[2]);
      expect(photoTops[2]).toBeGreaterThan(photoTops[0]);
    } else {
      expect(photoTops[1]).toBeGreaterThan(photoTops[0]);
      expect(photoTops[2]).toBeGreaterThan(photoTops[1]);
    }
    expect(await section.locator('.research-direction__number').count()).toBe(0);
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
