import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from './fixtures';
test.use({ trace: 'retain-on-failure' });

for (const width of [390, 768, 1440]) test(`keeps content readable with reduced motion at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const styles: Record<string, unknown> = {};
  async function capture(name: string, selector: string) {
    const element = page.locator(selector).first();
    await expect(element).toBeVisible();
    styles[name] = await element.evaluate(node => {
      const css = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return { color: css.color, background: css.backgroundColor, font: css.fontFamily, fontSize: css.fontSize, lineHeight: css.lineHeight, borderRadius: css.borderRadius, border: css.border, padding: css.padding, opacity: css.opacity, width: Math.round(rect.width * 100) / 100, height: Math.round(rect.height * 100) / 100 };
    });
    expect((styles[name] as { opacity: string }).opacity).toBe('1');
  }
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('[data-deferred-section="featured"]').scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: 'Benchmark Research 0000', exact: true })).toBeVisible();
  await capture('hero', '.home-hero');
  await capture('title', '.home-hero__title');
  await capture('art', '.home-hero__logo-core');
  await capture('navigation', 'nav a[aria-current="page"]');
  await page.goto('/category/bai-bao-khoa-hoc');
  await expect(page.getByRole('heading', { name: 'Benchmark Research 0000', exact: true })).toBeVisible();
  await capture('card', 'article');
  await page.getByRole('button', { name: /Trích dẫn khoa học/ }).first().click();
  await capture('dialog', '[role="dialog"]');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/?q=presentation-no-results');
  await expect(page.getByText('Không tìm thấy công trình phù hợp')).toBeVisible();
  await capture('emptyMain', 'main');
  await page.goto('/login');
  await capture('loginInput', '#identifier');
  await page.locator('#identifier').focus();
  await expect(page.locator('#identifier')).toBeFocused();
  const phase = process.env.PRESENTATION_PHASE;
  if (phase) {
    const directory = path.resolve('docs/superpowers/reports/presentation');
    mkdirSync(directory, { recursive: true });
    const file = path.join(directory, `${phase}-${width}.json`);
    if (phase === 'after') {
      const before = path.join(directory, `before-${width}.json`);
      if (!existsSync(before)) throw Error('Missing computed-style baseline');
      expect(styles).toEqual(JSON.parse(readFileSync(before, 'utf8')));
    }
    writeFileSync(file, JSON.stringify(styles, null, 2) + '\n');
  }
});
