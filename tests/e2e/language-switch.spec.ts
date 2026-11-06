import { expect, login, openPublicNavigation, test } from './fixtures';

const switchLanguage = async (page: import('@playwright/test').Page, language: 'vi' | 'en') => {
  const toggle = page.getByRole('switch', { name: /Switch language/ });
  if (await toggle.getAttribute('data-locale') !== language) await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  await expect(toggle).toHaveAttribute('aria-checked', String(language === 'en'));
};

test('switches interface language, persists after reload and localizes server metadata', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await switchLanguage(page, 'en');
  await expect(page.getByRole('heading', { name: 'Contact the Robotics & IoT Club Executive Board - HCMUS' })).toBeVisible();
  await expect(page).toHaveTitle('Contact | Robotics & IoT HCMUS');
  await expect(page.locator('#site-navbar').getByRole('link', { name: 'Sign in', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Contact the Robotics & IoT Club Executive Board - HCMUS' })).toBeVisible();
  await page.locator('#site-navbar nav a[href="/research"]').first().click();
  await expect(page.getByRole('heading', { name: 'Research', exact: true })).toBeVisible();
  await switchLanguage(page, 'vi');
  await expect(page.getByRole('heading', { name: 'Nghiên cứu khoa học', exact: true })).toBeVisible();
});

test('changing language during a pending navigation preserves its destination and browser history', async ({ page }) => {
  await page.goto('/contact');
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/research?*', async route => {
    if (route.request().headers().rsc === '1') await held;
    await route.continue();
  });
  await page.locator('#site-navbar nav a[href="/research"]').first().click();
  try {
    await expect(page.locator('[data-destination-loading="/research"]')).toBeVisible();
    await switchLanguage(page, 'en');
  } finally { release(); }
  await expect(page).toHaveURL(/\/research$/);
  await expect(page.locator('[data-destination-loading]')).toHaveCount(0);
  await expect(page).toHaveTitle('Research | Robotics & IoT HCMUS');
  await page.goBack();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole('heading', { name: 'Contact the Robotics & IoT Club Executive Board - HCMUS', exact: true })).toBeVisible();
});

test('keeps authored titles and summaries intact while translating article controls', async ({ page, database }) => {
  const item = await database.showcaseItem.findFirstOrThrow({ where: { status: 'PUBLISHED', visibility: 'PUBLIC' } });
  await database.showcaseItem.update({ where: { id: item.id }, data: { title: 'Nghiên cứu khoa học', summary: 'Nội dung do tác giả nhập bằng tiếng Việt.' } });
  try {
    await page.goto(`/works/${item.slug}`);
    await switchLanguage(page, 'en');
    await expect(page.getByRole('heading', { level: 1, name: 'Nghiên cứu khoa học', exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Abstract', exact: true }).getByText('Nội dung do tác giả nhập bằng tiếng Việt.', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Abstract', exact: true })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Breadcrumbs', exact: true }).locator('[aria-current="page"]')).toHaveText('Nghiên cứu khoa học');
  } finally {
    await database.showcaseItem.update({ where: { id: item.id }, data: { title: item.title, summary: item.summary } });
  }
});

test('preserves unsaved draft fields when switching language inside the editor', async ({ page, fixture, database }) => {
  const author = fixture.users.find(user => user.role === 'CORE_MEMBER')!;
  await login(page, author, '/my-works/new');
  await expect(page).toHaveURL(/\/my-works\/[^/]+\/edit$/);
  const id = page.url().split('/').at(-2)!;
  await page.route('**/my-works/**', route => route.request().method() === 'POST' && route.request().headers()['next-action'] ? route.abort() : route.continue());
  await page.locator('#submission-title').fill('Bản nháp chưa đồng bộ');
  await page.locator('#submission-summary').fill('Giữ nguyên nội dung này khi đổi ngôn ngữ.');
  await switchLanguage(page, 'en');
  await expect(page.getByRole('button', { name: 'Preview', exact: true })).toBeVisible();
  await expect(page.locator('#submission-title')).toHaveValue('Bản nháp chưa đồng bộ');
  await expect(page.locator('#submission-summary')).toHaveValue('Giữ nguyên nội dung này khi đổi ngôn ngữ.');
  await page.getByRole('button', { name: 'Introduction', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Section 1 name', exact: true })).toHaveValue('Introduction');
  await page.unroute('**/my-works/**');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect.poll(async () => (await database.showcaseItem.findUniqueOrThrow({ where: { id } })).title).toBe('Bản nháp chưa đồng bộ');
});

test('success notices follow the current locale when switching back to Vietnamese', async ({ page, fixture, database }) => {
  const author = fixture.users.find(user => user.role === 'CORE_MEMBER')!;
  await database.showcaseItem.create({ data: { creatorId: author.id, slug: 'locale-toast-draft', title: 'Locale toast test', summary: '' } });
  await login(page, author, '/my-works');
  await switchLanguage(page, 'en');
  const row = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Locale toast test', exact: true }) });
  await row.getByRole('button', { name: 'Delete draft', exact: true }).click();
  await page.getByRole('dialog', { name: 'Delete draft?', exact: true }).getByRole('button', { name: 'Delete draft', exact: true }).click();
  const notice = page.locator('[data-success-notice="true"]');
  await expect(notice).toContainText('Draft deleted.');
  await switchLanguage(page, 'vi');
  await expect(notice).toContainText('Đã xóa bản nháp.');
});

test('localizes admin tabs, filters and roles', async ({ page, fixture }) => {
  await login(page, fixture.users[0], '/admin/members');
  await switchLanguage(page, 'en');
  await expect(page.getByRole('heading', { name: 'Members', exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Administration navigation' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Administration navigation' }).getByRole('link', { name: 'Review', exact: true })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Role', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Role', exact: true }).click();
  await expect(page.getByRole('option', { name: /Team Leader/ })).toBeVisible();
});

for (const width of [320, 390, 768, 1440]) {
  test(`language switch stays beside the profile without overlap at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/contact');
    await switchLanguage(page, 'en');
    const toggle = page.getByRole('switch', { name: /Switch language/ });
    const account = page.locator('.site-account-navigation');
    const brand = page.locator('#site-navbar .site-brand');
    const boxes = await Promise.all([brand.boundingBox(), toggle.boundingBox(), account.boundingBox()]);
    expect(boxes[0]!.x + boxes[0]!.width).toBeLessThanOrEqual(boxes[1]!.x + 1);
    expect(boxes[1]!.x + boxes[1]!.width).toBeLessThanOrEqual(boxes[2]!.x + 1);
    expect((await page.locator('#site-navbar').boundingBox())!.height).toBeLessThan(80);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width < 1280) {
      await openPublicNavigation(page);
      await expect(page.getByRole('navigation', { name: 'Main navigation', exact: true })).toBeVisible();
    }
    await page.screenshot({ path: `/tmp/nexus-language-switch-${width}.png` });
  });
}

test('language switch matches profile height and banner styling', async ({ page, fixture }) => {
  await login(page, fixture.users.find(user => user.role === 'ADMIN')!, '/');
  const toggle = page.getByRole('switch', { name: /Switch language/ });
  const profile = page.locator('.site-account-navigation > div > button');
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator('#site-navbar')).toHaveAttribute('data-banner-top', 'true');
    await expect(toggle).toHaveCSS('height', width === 390 ? '44px' : '40px');
    await expect(profile).toHaveCSS('height', width === 390 ? '44px' : '40px');
    await expect(toggle).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.1)');
    await expect(toggle).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(profile).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.1)');
  }
});
