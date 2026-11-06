import { createTranslator, LOCALE_COOKIE } from '../../src/shared/i18n/core';
import { expect, login, test } from './fixtures';

test('submission actions retain their full icons with Vietnamese and English labels', async ({ page, fixture, baseURL }) => {
  test.setTimeout(90_000);
  await login(page, fixture.users[0], '/my-works/new');
  for (const locale of ['vi', 'en'] as const) {
    await page.context().addCookies([{ name: LOCALE_COOKIE, value: locale, url: baseURL! }]);
    await page.goto('/my-works/new');
    const actions = page.locator('[data-submission-actions]');
    await expect(actions).toBeVisible();
    const tr = createTranslator(locale);
    for (const width of [320, 390, 640, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const name of ['Gửi duyệt', 'Lưu bản nháp']) {
        const button = actions.getByRole('button', { name: tr(name), exact: true });
        const icon = button.locator('svg');
        await expect(icon).toBeVisible();
        await expect(icon).toHaveCSS('width', '16px');
        await expect(icon).toHaveCSS('height', '16px');
        expect(await button.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});
