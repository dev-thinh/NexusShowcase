import { expect, test } from './fixtures';

test('cards show GitHub quick links and citation while every resource remains available on detail', async ({ page, database }) => {
  const item = await database.showcaseItem.findFirstOrThrow({ where: { status: 'PUBLISHED', visibility: 'PUBLIC' }, include: { links: true } });
  const labels = Array.from({ length: 12 }, (_, index) => `Tài nguyên bổ sung ${index + 1}`);
  const sources = Array.from({ length: 3 }, (_, index) => ({ label: `Mã nguồn ${index + 1}`, url: `https://github.com/nexus-demo/project-${index}` }));
  try {
    await database.itemLink.deleteMany({ where: { itemId: item.id } });
    await database.showcaseItem.update({ where: { id: item.id }, data: { citationEnabled: true } });
    await database.itemLink.createMany({ data: [
      ...labels.map((label, index) => ({ itemId: item.id, label, type: 'OTHER' as const, url: `https://example.com/resource-${index}` })),
      ...sources.map(source => ({ itemId: item.id, type: 'GITHUB' as const, ...source })),
    ] });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${item.type === 'PROJECT' ? '/category/robotics-iot' : '/category/bai-bao-khoa-hoc'}?q=${encodeURIComponent(item.title)}`);
      const card = page.locator('article').filter({ has: page.getByRole('heading', { name: item.title, exact: true }) });
      const resources = card.locator('[data-card-resources]');
      await expect(resources.getByRole('link')).toHaveCount(sources.length);
      for (const source of sources) {
        const link = resources.getByRole('link', { name: `Mã nguồn GitHub: ${source.label}`, exact: true });
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute('href', source.url);
        await expect(link).toHaveAttribute('target', '_blank');
        const bounds = await link.boundingBox();
        const cardBounds = await card.boundingBox();
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(cardBounds!.x + cardBounds!.width + 1);
      }
      await expect(card.getByRole('link', { name: /Tài nguyên bổ sung/ })).toHaveCount(0);
      const cite = card.getByRole('button', { name: 'Trích dẫn công trình (Cite)', exact: true });
      await cite.click();
      await expect(page.getByRole('dialog', { name: 'Trích Dẫn Học Thuật (Citation Export)', exact: true })).toBeVisible();
      await page.getByRole('dialog').getByRole('button', { name: 'Đóng hộp thoại', exact: true }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      expect(await card.locator('.publication-card__footer').evaluate(node => node.firstElementChild?.tagName)).toBe('BUTTON');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.locator('article').filter({ has: page.getByRole('heading', { name: item.title, exact: true }) }).getByRole('heading').getByRole('link').click();
    await expect(page).toHaveURL(new RegExp(`/showcase/${item.slug}`));
    const full = page.locator('#resources');
    await full.scrollIntoViewIfNeeded();
    await expect(full.getByRole('heading', { name: 'Tài nguyên', exact: true })).toBeVisible();
    for (const label of [...labels, ...sources.map(source => source.label)]) await expect(full.getByRole('link', { name: label, exact: true })).toBeVisible();
    expect(await full.locator('div').first().evaluate(node => node.firstElementChild?.tagName)).toBe('BUTTON');
  } finally {
    await database.itemLink.deleteMany({ where: { itemId: item.id } });
    await database.itemLink.createMany({ data: item.links });
    await database.showcaseItem.update({ where: { id: item.id }, data: { citationEnabled: item.citationEnabled } });
  }
});
