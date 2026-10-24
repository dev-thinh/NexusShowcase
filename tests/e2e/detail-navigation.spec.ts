import { expect, test } from './fixtures';

test('detail links show a destination skeleton while their response is blocked', async ({ page }) => {
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/*', async route => {
    if (new URL(route.request().url()).pathname === '/showcase/benchmark-0' && route.request().headers().rsc === '1') await held;
    await route.continue();
  });
  await page.goto('/category/bai-bao-khoa-hoc');
  await page.getByRole('link', { name: 'Benchmark Research 0000', exact: true }).click();
  try {
    await expect(page.locator('[data-destination-loading="/showcase/benchmark-0"]')).toBeVisible();
    await expect(page.locator('main').filter({ has: page.getByRole('heading', { name: 'Benchmark Research', exact: true }) })).toBeHidden();
  } finally { release(); }
  await expect(page).toHaveURL(/\/showcase\/benchmark-0/);
  await expect(page.getByRole('heading', { name: 'Benchmark Research 0000', exact: true })).toBeVisible();
});
