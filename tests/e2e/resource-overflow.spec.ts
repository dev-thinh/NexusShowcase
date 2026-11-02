import { expect, test } from './fixtures';

test('resource previews fit their card, count only hidden links, keep citation first, and open all resources', async ({ page, database }) => {
  const item = await database.showcaseItem.findFirstOrThrow({ where: { status: 'PUBLISHED', visibility: 'PUBLIC' } });
  await database.itemLink.deleteMany({ where: { itemId: item.id } });
  const labels = ['A', 'B', ...Array.from({ length: 10 }, (_, index) => `Tài nguyên bổ sung ${index + 1}`)];
  await database.itemLink.createMany({ data: labels.map((label, index) => ({ itemId: item.id, label, type: 'OTHER', url: `https://example.com/resource-${index}` })) });
  let wideCount = 0;
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`/explore?q=${encodeURIComponent(item.title)}`);
    const card = page.locator('article').filter({ has: page.getByRole('heading', { name: item.title, exact: true }) });
    const resources = card.locator('[data-card-resources]');
    const direct = resources.locator('a[target="_blank"]');
    const more = resources.getByRole('link', { name: /Xem \d+ tài nguyên còn lại/ });
    await expect(more).toBeVisible();
    await expect.poll(async () => direct.count()).toBeGreaterThan(0);
    const count = await direct.count();
    await expect(more).toHaveText(`Tài nguyên (${labels.length - count})`);
    expect(count).toBeLessThan(labels.length);
    expect(await direct.allTextContents()).toEqual(labels.slice(0, count));
    await expect(resources.locator('svg')).toHaveCount(0);
    const box = await resources.boundingBox();
    const moreBox = await more.boundingBox();
    expect(moreBox!.x + moreBox!.width).toBeLessThanOrEqual(box!.x + box!.width + 1);
    expect(await card.locator('footer').evaluate(node => node.firstElementChild?.tagName)).toBe('BUTTON');
    if (width === 1440) wideCount = count;
    else expect(count).toBeLessThanOrEqual(wideCount);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.locator('[data-card-resources]').getByRole('link', { name: /Xem \d+ tài nguyên còn lại/ }).click();
  await expect(page).toHaveURL(/#resources$/);
  const full = page.locator('#resources');
  await expect(full.getByRole('heading', { name: 'Tài nguyên', exact: true })).toBeVisible();
  for (const label of labels) await expect(full.getByRole('link', { name: label, exact: true })).toBeVisible();
  expect(await full.locator('div').first().evaluate(node => node.firstElementChild?.tagName)).toBe('BUTTON');
});
