import { expect, seedPhotoGalleries, test } from './fixtures';

test('gallery code and images wait until its section approaches the viewport', async ({ page, database }) => {
  await seedPhotoGalleries(database);
  await page.setViewportSize({ width: 1440, height: 600 });
  const photoRequests: string[] = [];
  page.on('request', request => { if (request.url().includes('/uploads/thumbnails/fixture-')) photoRequests.push(request.url()); });
  await page.goto('/');
  const section = page.locator('[data-deferred-section="moments"]');
  await expect(section).toHaveAttribute('data-state', 'idle');
  await expect(page.locator('.moments-wall')).toHaveCount(0);
  expect(photoRequests).toHaveLength(0);
  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveAttribute('data-state', 'ready');
  await expect(section.locator('.moments-wall')).toBeVisible();
  await expect.poll(() => photoRequests.length).toBeGreaterThan(0);
  await database.homeMomentsGallery.deleteMany();
});

test('home queries run only when their sections approach the viewport', async ({ page }) => {
  // Keep the first section outside the observer's 200px preload margin.
  await page.setViewportSize({ width: 1440, height: 400 });
  let actions = 0;
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/home') actions++; });
  await page.goto('/');
  const featured = page.locator('[data-deferred-section="featured"]');
  const members = page.locator('[data-deferred-section="members"]');
  await expect(page.locator('#home-hero-title')).toBeVisible();
  await expect(featured).toHaveAttribute('data-state', 'idle');
  await expect(members).toHaveAttribute('data-state', 'idle');
  expect(actions).toBe(0);
  await featured.scrollIntoViewIfNeeded();
  await expect(featured).toHaveAttribute('data-state', 'ready');
  await expect(featured.getByRole('heading', { name: 'Benchmark Research 0000', exact: true })).toBeVisible();
  await expect(members).toHaveAttribute('data-state', 'idle');
  expect(actions).toBe(1);
  await members.scrollIntoViewIfNeeded();
  await expect(members).toHaveAttribute('data-state', 'ready');
  expect(actions).toBe(2);
  await page.evaluate(() => window.scrollTo(0, 0));
  await featured.scrollIntoViewIfNeeded();
  expect(actions).toBe(2);
});

test('leaving home does not wait for an in-flight deferred section', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 600 });
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let sectionRequested!: () => void;
  const requested = new Promise<void>(resolve => { sectionRequested = resolve; });
  await page.route('**/*', async route => {
    if (new URL(route.request().url()).pathname === '/api/home') { sectionRequested(); await held; }
    await route.continue();
  });
  await page.goto('/');
  await page.locator('[data-deferred-section="featured"]').scrollIntoViewIfNeeded();
  await requested;
  try {
    await page.locator('nav a[href="/members"]').first().click();
    await expect(page).toHaveURL(/\/members$/);
    await expect(page.getByRole('heading', { name: 'Benchmark Member 000', exact: true })).toBeVisible();
  } finally { release(); }
});

test('members load independently while featured is stalled', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 600 });
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/home?section=featured', async route => { await held; await route.continue(); });
  await page.goto('/');
  const featured = page.locator('[data-deferred-section="featured"]');
  const members = page.locator('[data-deferred-section="members"]');
  try {
    await featured.scrollIntoViewIfNeeded();
    await expect(featured).toHaveAttribute('data-state', 'loading');
    await members.scrollIntoViewIfNeeded();
    await expect(members).toHaveAttribute('data-state', 'ready');
    await expect(featured).toHaveAttribute('data-state', 'loading');
  } finally { release(); }
  await expect(featured).toHaveAttribute('data-state', 'ready');
});

test('a timed out section offers retry and can recover', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 600 });
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let first = true;
  await page.route('**/api/home?section=featured', async route => {
    if (first) { first = false; await held; }
    await route.continue();
  });
  await page.goto('/');
  const featured = page.locator('[data-deferred-section="featured"]');
  try {
    await featured.scrollIntoViewIfNeeded();
    await expect(featured).toHaveAttribute('data-state', 'error', { timeout: 20_000 });
    await featured.getByRole('button', { name: 'Thử lại' }).click();
    await expect(featured).toHaveAttribute('data-state', 'ready');
  } finally { release(); }
});
