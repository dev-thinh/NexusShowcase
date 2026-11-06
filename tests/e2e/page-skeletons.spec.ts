import { expect, openPublicNavigation, test } from './fixtures';

for (const width of [390, 1440]) {
  for (const path of ['/research', '/projects']) {
    test(`${path} skeleton matches its responsive publication layout at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/contact');
      let release!: () => void;
      const held = new Promise<void>(resolve => { release = resolve; });
      await page.route(`**${path}?*`, async route => {
        if (route.request().headers().rsc === '1') await held;
        await route.continue();
      });
      await openPublicNavigation(page);
      await page.locator(`#site-navbar nav a[href="${path}"]`).first().click();
      const loading = page.locator(`[data-destination-loading="${path}"]`);
      try {
        await expect(loading).toBeVisible();
        const content = loading.locator(`[data-skeleton-layout="${path.slice(1)}"]`);
        await expect(content).toHaveAttribute('aria-busy', 'true');
        const card = content.locator('.publication-card').first();
        const image = await card.locator('.publication-card__media').boundingBox();
        const body = await card.locator('.publication-card__body').boundingBox();
        expect(image).not.toBeNull(); expect(body).not.toBeNull();
        if (path === '/research' && width >= 640) {
          expect(image!.x + image!.width).toBeLessThanOrEqual(body!.x);
          expect(Math.abs(image!.y - body!.y)).toBeLessThan(1);
        } else {
          expect(image!.y + image!.height).toBeLessThanOrEqual(body!.y + 1);
        }
        if (path === '/projects' && width >= 1024) {
          const cards = content.locator('.publication-card');
          const first = (await cards.nth(0).boundingBox())!;
          const second = (await cards.nth(1).boundingBox())!;
          expect(second.x).toBeGreaterThan(first.x);
          expect(Math.abs(first.y - second.y)).toBeLessThan(1);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(await card.locator('.animate-pulse').first().evaluate(element => getComputedStyle(element).animationName)).toBe('none');
        await page.screenshot({ path: `/tmp/nexus-skeleton-${path.slice(1)}-${width}.png` });
      } finally { release(); }
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.locator('[data-destination-loading]')).toHaveCount(0);
    });
  }
}

test('independent home loading regions use horizontal publications and member circles', async ({ page }) => {
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/home?*', async route => { await held; await route.continue(); });
  await page.goto('/');
  try {
    await expect(page.locator('[data-deferred-section="featured"] [data-skeleton-layout="featured"]')).toBeVisible();
    const members = page.locator('[data-deferred-section="members"] [data-skeleton-layout="member-wall"]');
    await expect(members).toHaveAttribute('aria-busy', 'true');
    await expect(members.locator('.home-member-slot')).toHaveCount(10);
  } finally { release(); }
  await expect(page.locator('[data-deferred-section="featured"]')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('[data-deferred-section="members"]')).toHaveAttribute('data-state', 'ready');
});
