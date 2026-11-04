import { expect, login, test } from './fixtures';

for (const width of [320, 390]) test(`filters and content management align without wrapped actions at ${width}px`, async ({ page, fixture }) => {
  await page.setViewportSize({ width, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/research');
  const filter = page.getByRole('search');
  await filter.getByRole('button', { name: /Bộ lọc/ }).click();
  const year = (await filter.getByLabel('Năm thực hiện').boundingBox())!;
  const sort = (await filter.getByRole('combobox').boundingBox())!;
  expect(Math.abs(year.x - sort.x)).toBeLessThan(1);
  expect(Math.abs(year.width - sort.width)).toBeLessThan(1);
  expect(sort.y).toBeGreaterThan(year.y + year.height);
  await expect(page.getByRole('navigation', { name: 'Chuyên mục công trình' })).toHaveCount(0);
  await filter.screenshot({ path: `/tmp/nexus-mobile-audit/aligned-filter-${width}.png` });
  await login(page, fixture.users[0], '/admin/works');
  const actions = page.locator('.admin-bulk-actions');
  await expect(actions).toBeVisible();
  for (const button of await actions.getByRole('button').all()) {
    await expect(button).toHaveCSS('height', '44px');
    expect(await button.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await button.locator('span').evaluate(element => element.getBoundingClientRect().height)).toBeLessThanOrEqual(21);
  }
  await actions.screenshot({ path: `/tmp/nexus-mobile-audit/aligned-bulk-actions-${width}.png` });
  const rows = page.locator('.admin-content-row');
  await expect(rows).toHaveCount(10);
  await page.evaluate(() => document.fonts.ready);
  const heights = await rows.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height));
  expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
  for (const row of await rows.all()) {
    const layout = await row.evaluate(element => {
      const meta = element.querySelector('.admin-content-row__meta')!.getBoundingClientRect();
      const controls = element.querySelector('[role="group"]')!.getBoundingClientRect();
      const title = element.querySelector('.admin-content-row__title')!.getBoundingClientRect();
      return { metaTop: meta.top, metaBottom: meta.bottom, controlsTop: controls.top, controlsBottom: controls.bottom, titleTop: title.top };
    });
    expect(layout.controlsTop).toBeGreaterThanOrEqual(layout.metaTop);
    expect(layout.controlsBottom).toBeLessThanOrEqual(layout.metaBottom + 1);
    expect(layout.titleTop).toBeGreaterThanOrEqual(layout.metaBottom);
  }
  await rows.first().locator('..').screenshot({ path: `/tmp/nexus-mobile-audit/aligned-content-${width}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
