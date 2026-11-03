import { expect, test } from './fixtures';

for (const missingVariables of [false, true]) test(`Vietnamese text renders Inter with font variables ${missingVariables ? 'missing' : 'present'}`, async ({ page }) => {
  await page.goto('/contact');
  const heading = page.getByRole('heading', { name: 'Liên hệ Ban chủ nhiệm CLB Robotics & IoT - HCMUS', exact: true });
  await expect(heading).toBeVisible();
  if (missingVariables) await page.evaluate(() => {
    for (const element of [document.documentElement, document.body]) {
      for (const name of [...element.classList]) if (/^__(variable|className)_/.test(name)) element.classList.remove(name);
    }
  });
  await expect(heading).toHaveCSS('font-family', /Inter/);
  await page.evaluate(() => document.fonts.ready);
  const session = await page.context().newCDPSession(page);
  await session.send('DOM.enable');
  await session.send('CSS.enable');
  const { root } = await session.send('DOM.getDocument');
  const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector: 'h1.page-title' });
  const { fonts } = await session.send('CSS.getPlatformFontsForNode', { nodeId });
  expect(fonts.length).toBeGreaterThan(0);
  expect(fonts.every(font => font.isCustomFont && font.familyName.includes('Inter'))).toBe(true);
});
