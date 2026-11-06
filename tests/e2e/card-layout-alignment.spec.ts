import { expect, login, test } from './fixtures';

for (const width of [390, 1440]) {
  test(`card footers share their height and vertically center actions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/research', '/projects']) {
      await page.goto(path);
      if (path === '/') await page.locator('[data-deferred-section="featured"]').scrollIntoViewIfNeeded();
      const footers = page.locator('article.publication-card .publication-card__footer');
      await expect(footers.first()).toBeVisible();
      for (const footer of (await footers.all()).slice(0, 3)) {
        await expect(footer).toBeVisible();
        await expect.poll(() => footer.evaluate(element => element.getBoundingClientRect().height)).toBe(48);
        const dimensions = await footer.evaluate(element => {
          const row = element.getBoundingClientRect();
          const card = element.closest('article')!.getBoundingClientRect();
          return { height: row.height, bottomGap: card.bottom - row.bottom, actions: [...element.querySelectorAll(':scope > a, .publication-cite')].map(action => { const rect = action.getBoundingClientRect(); return { height: rect.height, offset: Math.abs(rect.top + rect.height / 2 - (row.top + row.height / 2)) }; }) };
        });
        expect(dimensions.height, `${path} at ${width}px`).toBe(48);
        expect(Math.abs(dimensions.bottomGap), `${path}: footer ends at the card border`).toBeLessThan(2);
        for (const action of dimensions.actions) { expect(action.height).toBe(32); expect(action.offset).toBeLessThan(1); }
      }
    }
  });
}

test('dashboard status/date columns align and content controls have no diagonal arrow', async ({ page, fixture }) => {
  await login(page, fixture.users[0], '/admin');
  const rows = page.locator('.admin-activity-meta');
  await expect(rows).toHaveCount(5);
  const positions = await rows.evaluateAll(elements => elements.map(element => {
    const badge = element.querySelector(':scope > span > span')!.getBoundingClientRect();
    const date = element.querySelector('time')!.getBoundingClientRect();
    return { badgeRight: badge.right, dateLeft: date.left, dateRight: date.right, centerOffset: Math.abs(badge.top + badge.height / 2 - date.top - date.height / 2) };
  }));
  for (const position of positions) {
    expect(Math.abs(position.badgeRight - positions[0].badgeRight)).toBeLessThan(1);
    expect(Math.abs(position.dateLeft - positions[0].dateLeft)).toBeLessThan(1);
    expect(Math.abs(position.dateRight - positions[0].dateRight)).toBeLessThan(1);
    expect(position.centerOffset).toBeLessThan(1);
  }
  await page.goto('/admin/works');
  await expect(page.locator('.admin-content-row').first()).toBeVisible();
  await expect(page.locator('.admin-content-row .lucide-arrow-up-right')).toHaveCount(0);
  const controls = page.locator('.admin-content-row').first().getByRole('group');
  const buttons = await controls.getByRole('button').all();
  const toggle = await controls.getByRole('switch').boundingBox();
  const pin = await buttons[0].boundingBox();
  expect(Math.abs(toggle!.y + toggle!.height / 2 - pin!.y - pin!.height / 2)).toBeLessThan(1);
});
