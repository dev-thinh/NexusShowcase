import { expect, test } from './fixtures';
test.use({ trace: 'retain-on-failure' });

test('preserves navbar across route transitions', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#home-content')).toBeVisible();
  await page.locator('header').first().evaluate(element => { element.dataset.testShell = 'kept'; });
  await page.locator('nav a[href="/members"]').first().click();
  await expect(page).toHaveURL(/\/members$/);
  await expect(page.locator('header[data-test-shell="kept"]')).toBeVisible();
});

test('switching public tabs changes page before smoothly returning to the top', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
  const initialScroll = await page.evaluate(() => {
    const samples: Array<{ pathname: string; top: number }> = [];
    Object.assign(window, { navigationScrollSamples: samples });
    window.addEventListener('scroll', () => samples.push({ pathname: location.pathname, top: window.scrollY }), { passive: true });
    return window.scrollY;
  });
  expect(initialScroll).toBeGreaterThan(0);
  await page.locator('nav a[href="/members"]').first().click();
  await expect(page).toHaveURL(/\/members$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  const samples = await page.evaluate(() => (window as unknown as { navigationScrollSamples: Array<{ pathname: string; top: number }> }).navigationScrollSamples);
  expect(samples.some(sample => sample.pathname === '/members' && sample.top > 0 && sample.top < initialScroll)).toBe(true);
  expect(samples.some(sample => sample.pathname === '/' && sample.top < initialScroll - 1)).toBe(false);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.locator('nav a[href="/"]').first().click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test('shows feedback before delayed RSC and keeps the committed tab active', async ({ page }) => {
  let release!: () => void;
  const clicked = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/*', async route => {
    const request = route.request();
    if (new URL(request.url()).pathname === '/' && request.headers().rsc === '1') {
      await clicked;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    await route.continue();
  });
  await page.goto('/category/robotics-iot');
  await expect(page.getByRole('heading', { name: 'Benchmark Robotics 0001', exact: true })).toBeVisible();
  await page.evaluate(() => {
    const link = document.querySelector<HTMLAnchorElement>('nav a[href="/"]')!;
    link.addEventListener('click', () => {
      const started = performance.now();
      const observer = new MutationObserver(() => {
        if (document.querySelector('[data-navigation-pending="true"]')) {
          document.documentElement.dataset.feedbackMs = String(performance.now() - started);
          observer.disconnect();
        }
      });
      observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-navigation-pending'] });
    }, { once: true });
  });
  await page.locator('nav a[href="/"]').first().click();
  try {
    const destinationTab = page.locator('nav a[href="/"]').first();
    await expect(destinationTab).toHaveClass(/bg-brand-button/);
    await expect(page.locator('nav a[href="/category/robotics-iot"]').first()).not.toHaveClass(/bg-brand-button/);
    await expect(page.locator('[data-destination-loading="/"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Benchmark Robotics 0001', exact: true })).toBeHidden();
    await expect(page.locator('html')).toHaveAttribute('data-feedback-ms', /\d/);
    expect(Number(await page.locator('html').getAttribute('data-feedback-ms'))).toBeLessThan(200);
  } finally { release(); }
  const active = page.locator('nav a[aria-current="page"]').first();
  // During a suspended transition, a committed loading shell or the old committed route can be visible.
  if (page.url().includes('/category/')) await expect(active).toHaveAttribute('href', '/category/robotics-iot');
  await expect(page.locator('#home-content')).toBeVisible();
  await page.locator('[data-deferred-section="featured"]').scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: 'Benchmark Research 0000', exact: true })).toBeVisible();
});

test('latest rapid destination wins and history and modified clicks stay native', async ({ page, context }) => {
  await page.goto('/contact');
  const network = await context.newCDPSession(page);
  await network.send('Network.enable');
  await network.send('Network.emulateNetworkConditions', { offline: false, latency: 700, downloadThroughput: -1, uploadThroughput: -1 });
  for (const href of ['/', '/category/robotics-iot', '/members']) await page.locator(`nav a[href="${href}"]`).first().click();
  await expect(page).toHaveURL(/\/members$/);
  await expect(page.getByRole('heading', { name: 'Benchmark Member 000', exact: true })).toBeVisible();
  await network.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await network.detach();
  await page.locator('nav a[href="/contact"]').first().click();
  await expect(page).toHaveURL(/\/contact$/);
  await page.goBack(); await expect(page).toHaveURL(/\/members$/);
  await page.goForward(); await expect(page).toHaveURL(/\/contact$/);
  const opened = context.waitForEvent('page');
  await page.locator('nav a[href="/members"]').first().click({ modifiers: ['Control'] });
  const tab = await opened;
  try { await expect(tab).toHaveURL(/\/members$/); } finally { await tab.close(); }
  await expect(page).toHaveURL(/\/contact$/);
});

test('home navigation displays route content', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#home-content')).toBeVisible();
  await page.locator('[data-deferred-section="featured"]').scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: 'Benchmark Research 0000', exact: true })).toBeVisible();
  for (const [href, title] of [
    ['/category/bai-bao-khoa-hoc', 'Benchmark Research 0000'],
    ['/category/robotics-iot', 'Benchmark Robotics 0001'],
    ['/members', 'Benchmark Member 000'],
  ]) {
    await page.locator(`nav a[href="${href}"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  }
  await page.locator('nav a[href="/"]').first().click();
  await expect(page.locator('#home-content')).toBeVisible();
  await page.locator('[data-deferred-section="featured"]').scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: 'Benchmark Research 0000', exact: true })).toBeVisible();
});
