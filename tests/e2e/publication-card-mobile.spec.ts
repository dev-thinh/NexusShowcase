import { expect, login, test } from './fixtures';

for (const width of [320, 390]) test(`publication cards share compact actions and borderless images at ${width}px`, async ({ page, fixture }) => {
  await page.setViewportSize({ width, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await login(page, fixture.users[0], '/');
  for (const path of ['/', '/explore', '/category/bai-bao-khoa-hoc', '/category/robotics-iot']) {
    if (path !== '/') await page.goto(path);
    const card = page.locator('.publication-card').first();
    await expect(card).toBeVisible();
    const footer = card.locator('.publication-card__footer');
    await expect(footer).toBeVisible();
    expect((await footer.boundingBox())!.height).toBeLessThanOrEqual(42);
    await expect(footer.getByRole('button', { name: 'Trích dẫn công trình (Cite)' })).toHaveCSS('height', '32px');
    await expect(card.locator('.publication-card__media')).toHaveCSS('border-top-width', '0px');
    await expect(card.locator('.publication-card__media')).toHaveCSS('border-bottom-width', '0px');
    expect(await card.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await card.evaluate(element => element.scrollIntoView({ block: 'center' }));
    await card.screenshot({ path: `/tmp/nexus-mobile-audit/card-${path.replaceAll('/', '-') || 'home'}-${width}.png` });
  }
});
