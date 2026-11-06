import { readFileSync } from 'node:fs';
import { expect, login, seedPhotoGalleries, test } from './fixtures';
import { defaultHomeText } from '../../src/features/publications/model/home-content';

test.beforeEach(async ({ database }) => { await database.homePageContent.deleteMany(); });
test.afterEach(async ({ database }) => { await database.homePageContent.deleteMany(); });

test('admin edits copy in place and visitors see saved content while photo editors remain available', async ({ page, fixture, database, browser }) => {
  await seedPhotoGalleries(database);
  await login(page, fixture.users.find(user => user.role === 'ADMIN')!, '/');
  await expect(page).toHaveTitle('Trang chủ | Robotics & IoT HCMUS');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/logo.svg');
  const homePadding = await page.locator('#home-content').evaluate(element => getComputedStyle(element).paddingBottom);
  const memberActionColor = await page.locator('.members-band .home-section-heading + a[href="/members"]').evaluate(element => getComputedStyle(element).color);
  await page.getByRole('button', { name: 'Chỉnh sửa nội dung', exact: true }).click();
  await expect(page.locator('#home-content')).toHaveCSS('padding-bottom', homePadding);
  await expect(page.locator('[data-home-field="membersAction"]')).toHaveCSS('color', memberActionColor);
  await expect(page.getByText('Nhập trực tiếp vào các ô trên trang, rồi lưu thay đổi.', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const toolbar = page.getByRole('region', { name: 'Chỉnh sửa nội dung Trang chủ', exact: true });
  await expect(page.locator('#home-hero-title textarea')).toHaveCount(2);
  for (const input of await page.locator('textarea[data-home-field]').all()) {
    const style = await input.evaluate(element => {
      const current = getComputedStyle(element);
      const parent = getComputedStyle(element.parentElement!);
      return { background: current.backgroundColor, border: current.borderTopStyle, color: current.color, parentColor: parent.color, font: current.fontSize, parentFont: parent.fontSize };
    });
    expect(style.background).toBe('rgba(0, 0, 0, 0)');
    expect(style.border).toBe('dashed');
    expect(style.color).toBe(style.parentColor);
    expect(style.font).toBe(style.parentFont);
  }
  await expect(page.getByRole('textbox', { name: 'Banner — Tiêu đề dòng 2', exact: true })).not.toHaveCSS('background-image', 'none');

  await page.getByRole('textbox', { name: 'Banner — Tiêu đề dòng 1', exact: true }).fill('Cùng khám phá robotics.');
  await page.getByRole('textbox', { name: 'Banner — Mô tả banner', exact: true }).fill('Cập nhật tháng 11\nHọc hỏi & sáng tạo <robot>');
  await page.getByRole('textbox', { name: 'Banner — Nhãn nút khám phá', exact: true }).fill('Xem nghiên cứu mới');
  await page.locator('.home-featured-card h3 a').first().click();
  await expect(page).toHaveURL(/\/$/);
  await expect(toolbar.getByRole('alert')).toContainText('thay đổi chưa lưu');
  await expect(page.getByRole('textbox', { name: 'Banner — Tiêu đề dòng 1', exact: true })).toHaveValue('Cùng khám phá robotics.');
  expect(await page.locator('textarea').evaluateAll(elements => elements.every(element => !element.closest('a')))).toBe(true);
  await page.locator('[data-deferred-section="research"]').scrollIntoViewIfNeeded();
  const firstTitle = page.locator('.research-direction__title').first();
  await expect(page.locator('.research-direction__title')).toHaveCount(3);
  for (const title of await page.locator('.research-direction__title').all()) await expect(title.locator('textarea')).toHaveCount(1);
  await firstTitle.getByRole('textbox').fill('AI & Thị giác máy tính ứng dụng');
  await page.getByRole('textbox', { name: 'Hướng nghiên cứu — Thẻ 1 — mô tả', exact: true }).fill('Phát triển mô hình nhận diện mới.');
  await expect(page.getByRole('button', { name: 'Chỉnh sửa ảnh hướng nghiên cứu', exact: true })).toBeVisible();
  await page.locator('.research-band').screenshot({ path: 'test-results/home-inline-research.png' });
  await toolbar.getByRole('button', { name: 'Lưu nội dung', exact: true }).click();
  await expect(page.locator('textarea[data-home-field]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Chỉnh sửa nội dung', exact: true })).toBeFocused();
  await expect(page.locator('#home-hero-title')).toContainText('Cùng khám phá robotics.');
  await expect(page.locator('.home-hero__copy')).toContainText('Học hỏi & sáng tạo <robot>');
  await expect(firstTitle).toHaveText('AI & Thị giác máy tính ứng dụng');
  await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'Chỉnh sửa ảnh khoảnh khắc', exact: true })).toBeVisible();
  await expect(page.getByText('Cùng học hỏi, thử nghiệm và chia sẻ.', { exact: true })).toHaveCount(0);
  const stored = await database.homePageContent.findUniqueOrThrow({ where: { id: 'home' } });
  expect(stored.version).toBe(1);
  expect(stored.text).not.toHaveProperty('researchOneSubtitle');
  expect(stored.text).not.toHaveProperty('membersDescription');
  const visitor = await browser.newContext();
  try {
    const guest = await visitor.newPage();
    await guest.goto('/');
    await expect(guest.locator('#home-hero-title')).toContainText('Cùng khám phá robotics.');
    await expect(guest.getByRole('button', { name: 'Chỉnh sửa nội dung', exact: true })).toHaveCount(0);
    await expect(guest.locator('textarea[data-home-field]')).toHaveCount(0);
    expect((await guest.request.put('/api/home/content', { headers: { origin: new URL(guest.url()).origin }, data: { version: 1, text: {} } })).status()).toBe(403);
  } finally { await visitor.close(); }
});

test('mobile inline editing validates fields, retains failed drafts, resolves conflicts and cancels safely', async ({ page, fixture }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, fixture.users.find(user => user.role === 'ADMIN')!, '/');
  const editButton = page.getByRole('button', { name: 'Chỉnh sửa nội dung', exact: true });
  await expect(editButton).toHaveCSS('width', '48px');
  await expect(editButton).toHaveCSS('height', '48px');
  await expect(editButton.locator('span')).toBeHidden();
  await page.getByRole('button', { name: 'Chỉnh sửa nội dung', exact: true }).click();
  const toolbar = page.getByRole('region', { name: 'Chỉnh sửa nội dung Trang chủ', exact: true });
  const title = page.getByRole('textbox', { name: 'Banner — Tiêu đề dòng 1', exact: true });
  await title.fill(' ');
  await toolbar.getByRole('button', { name: 'Lưu nội dung', exact: true }).click();
  await expect(title).toHaveAttribute('aria-invalid', 'true');
  await expect(title).toBeFocused();
  await title.fill('Bản đang nhập');
  await page.locator('.home-hero').screenshot({ path: 'test-results/home-inline-mobile.png' });
  await toolbar.getByRole('button', { name: 'Hủy', exact: true }).click();
  await expect(toolbar.getByRole('button', { name: 'Bỏ thay đổi', exact: true })).toBeVisible();
  await expect(toolbar.getByRole('button', { name: 'Lưu nội dung', exact: true })).toHaveCount(0);
  await toolbar.getByRole('button', { name: 'Tiếp tục sửa', exact: true }).click();
  let releaseSave!: () => void;
  const saveGate = new Promise<void>(resolve => { releaseSave = resolve; });
  await page.route('**/api/home/content', async route => {
    if (route.request().method() === 'PUT') {
      await saveGate;
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Lưu thất bại. Thử lại.' }) });
    } else await route.continue();
  });
  await toolbar.getByRole('button', { name: 'Lưu nội dung', exact: true }).click();
  await expect(toolbar.getByRole('button', { name: 'Hủy', exact: true })).toBeDisabled();
  releaseSave();
  await expect(toolbar.getByRole('alert')).toContainText('Lưu thất bại');
  await expect(title).toHaveValue('Bản đang nhập');
  await page.unroute('**/api/home/content');
  const latest = await (await page.request.get('/api/home/content')).json();
  const otherEdit = await page.request.put('/api/home/content', { headers: { origin: new URL(page.url()).origin }, data: { version: latest.version, englishText: latest.englishText, text: { ...latest.text, heroTitle: 'Bản của admin khác' } } });
  expect(otherEdit.status()).toBe(200);
  await toolbar.getByRole('button', { name: 'Lưu nội dung', exact: true }).click();
  await expect(toolbar.getByRole('alert')).toContainText('Admin khác');
  await expect(title).toHaveValue('Bản đang nhập');
  await toolbar.getByRole('button', { name: 'Tải bản mới nhất', exact: true }).click();
  await toolbar.getByRole('button', { name: 'Đồng ý tải lại', exact: true }).click();
  await expect(title).toHaveValue('Bản của admin khác');
  await title.fill('Bản mới trên điện thoại');
  await toolbar.getByRole('button', { name: 'Lưu nội dung', exact: true }).click();
  await expect(page.locator('#home-hero-title')).toContainText('Bản mới trên điện thoại');
  await expect(page.locator('textarea[data-home-field]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Chỉnh sửa nội dung', exact: true }).click();
  await title.fill('Thay đổi sẽ hủy');
  await toolbar.getByRole('button', { name: 'Hủy', exact: true }).click();
  await toolbar.getByRole('button', { name: 'Bỏ thay đổi', exact: true }).click();
  await expect(page.locator('#home-hero-title')).toContainText('Bản mới trên điện thoại');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('the data migration preserves custom first-card titles and removes retired member copy', async ({ database }) => {
  await database.homePageContent.create({ data: { id: 'home', version: 4, text: { ...defaultHomeText, researchOneTitle: 'Tiêu đề riêng', researchOneSubtitle: 'Dòng riêng', membersDescription: 'Mô tả cũ', researchTwoTitle: 'Robot riêng', researchTwoSubtitle: 'Điều khiển riêng', researchThreeTitle: 'IoT riêng', researchThreeSubtitle: 'Nhúng riêng' } } });
  await database.$executeRawUnsafe(readFileSync('prisma/migrations/20261104_inline_home_text/migration.sql', 'utf8'));
  await database.$executeRawUnsafe(readFileSync('prisma/migrations/20261104_merge_research_titles/migration.sql', 'utf8'));
  const saved = await database.homePageContent.findUniqueOrThrow({ where: { id: 'home' } });
  expect(saved.version).toBe(6);
  expect(saved.text).toMatchObject({ researchOneTitle: 'Tiêu đề riêng & Dòng riêng', researchTwoTitle: 'Robot riêng & Điều khiển riêng', researchThreeTitle: 'IoT riêng & Nhúng riêng' });
  expect(saved.text).not.toHaveProperty('researchTwoSubtitle');
  expect(saved.text).not.toHaveProperty('researchThreeSubtitle');
  expect(saved.text).not.toHaveProperty('researchOneSubtitle');
  expect(saved.text).not.toHaveProperty('membersDescription');
});


test('saved copy is in server HTML and stays intact throughout hydration and deferred sections', async ({ page, database, browser }) => {
  await seedPhotoGalleries(database);
  const text = Object.fromEntries(Object.keys(defaultHomeText).map(key => [key, `Nội dung riêng ${key}`]));
  await database.homePageContent.create({ data: { id: 'home', version: 8, text } });

  const noScript = await browser.newContext({ javaScriptEnabled: false, baseURL: process.env.HARNESS_BASE_URL });
  try {
    const guest = await noScript.newPage();
    await guest.goto('/');
    for (const field of ['heroTitle', 'heroAccent', 'heroAction', 'featuredTitle', 'featuredAction', 'membersTitle', 'membersAction']) {
      await expect(guest.getByText(text[field], { exact: true })).toHaveCount(1);
    }
    await expect(guest.getByText(defaultHomeText.heroAction, { exact: true })).toHaveCount(0);
  } finally { await noScript.close(); }

  let backgroundReads = 0;
  await page.route('**/api/home/content', async route => {
    backgroundReads++;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ version: 0, text: defaultHomeText, isAdmin: false }) });
  });
  await page.addInitScript(defaults => {
    const observed: string[] = [];
    Object.assign(window, { observedDefaultHomeText: observed });
    const check = () => {
      for (const element of document.querySelectorAll('.home-hero span.whitespace-pre-line, #home-content span.whitespace-pre-line')) {
        const value = element.textContent ?? '';
        if (defaults.includes(value)) observed.push(value);
      }
    };
    new MutationObserver(check).observe(document, { subtree: true, childList: true, characterData: true });
    document.addEventListener('DOMContentLoaded', check);
  }, Object.values(defaultHomeText));
  await page.goto('/');
  await page.locator('[data-deferred-section="research"]').scrollIntoViewIfNeeded();
  await expect(page.locator('.research-direction__title')).toHaveCount(3);
  await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
  await expect(page.getByText(text.momentsTitle, { exact: true })).toBeVisible();
  for (const value of Object.values(text)) await expect(page.getByText(value, { exact: true })).toHaveCount(1);
  expect(await page.evaluate(() => (window as unknown as { observedDefaultHomeText: string[] }).observedDefaultHomeText)).toEqual([]);
  expect(backgroundReads).toBe(0);
  expect(await database.homePageContent.findUniqueOrThrow({ where: { id: 'home' } })).toMatchObject({ version: 8, text });
});

test('edits and persists Vietnamese and English independently without losing unsaved changes', async ({ page, fixture }) => {
  await login(page, fixture.users.find(user => user.role === 'ADMIN')!, '/');
  await page.getByRole('button', { name: 'Chỉnh sửa nội dung', exact: true }).click();
  const field = page.locator('[data-home-field="heroAction"]');
  await field.fill('Khám phá');
  await page.getByRole('switch', { name: /Switch language/ }).click();
  await expect(field).toHaveValue('Explore works');
  await field.fill(' ');
  await page.getByRole('switch', { name: /Switch language/ }).click();
  await page.getByRole('button', { name: 'Lưu nội dung', exact: true }).click();
  await expect(page.getByRole('switch', { name: /Switch language/ })).toHaveAttribute('aria-checked', 'true');
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await field.fill('Explore more');
  await page.getByRole('switch', { name: /Switch language/ }).click();
  await expect(field).toHaveValue('Khám phá');
  await page.getByRole('switch', { name: /Switch language/ }).click();
  await expect(field).toHaveValue('Explore more');
  await page.getByRole('button', { name: 'Save content', exact: true }).click();
  await expect(field).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.home-hero__primary-action')).toContainText('Explore more');
  const saved = await (await page.request.get('/api/home/content')).json();
  expect(saved.text.heroAction).toBe('Khám phá');
  expect(saved.englishText.heroAction).toBe('Explore more');
  await page.getByRole('switch', { name: /Switch language/ }).click();
  await expect(page.locator('.home-hero__primary-action')).toContainText('Khám phá');
  await expect(page.locator('.home-hero__primary-action')).not.toContainText('Explore more');
});

test('opens the home editor from its snapshot without waiting for a content request', async ({ page, fixture }) => {
  await login(page, fixture.users.find(user => user.role === 'ADMIN')!, '/');
  let reads = 0;
  await page.route('**/api/home/content', async route => {
    if (route.request().method() === 'GET') {
      reads++;
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Read unavailable' }) });
    } else await route.continue();
  });
  await page.getByRole('button', { name: 'Chỉnh sửa nội dung', exact: true }).click();
  const title = page.locator('[data-home-field="heroTitle"]');
  await expect(title).toHaveValue(defaultHomeText.heroTitle);
  expect(reads).toBe(0);
  await title.fill('Chỉnh sửa ngay từ nội dung hiện tại');
  await page.getByRole('button', { name: 'Lưu nội dung', exact: true }).click();
  await expect(title).toHaveCount(0);
  await expect(page.locator('#home-hero-title')).toContainText('Chỉnh sửa ngay từ nội dung hiện tại');
  expect(reads).toBe(0);
});

test('discard confirmation replaces editing actions and keeps the safe action first in English', async ({ page, fixture }) => {
  await login(page, fixture.users.find(user => user.role === 'ADMIN')!, '/');
  await page.getByRole('switch', { name: /Switch language/ }).click();
  await page.getByRole('button', { name: 'Edit content', exact: true }).click();
  const title = page.locator('[data-home-field="heroTitle"]');
  await title.fill('An unsaved English title');
  const toolbar = page.locator('.home-content-toolbar');
  await toolbar.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(toolbar.getByRole('button')).toHaveCount(2);
  await expect(toolbar.getByRole('button', { name: 'Continue editing', exact: true })).toBeFocused();
  await expect(toolbar.getByRole('button', { name: 'Save content', exact: true })).toHaveCount(0);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await toolbar.screenshot({ path: `/tmp/home-discard-confirmation-${width}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await toolbar.getByRole('button', { name: 'Continue editing', exact: true }).click();
  await expect(title).toHaveValue('An unsaved English title');
  await toolbar.getByRole('button', { name: 'Cancel', exact: true }).click();
  await toolbar.getByRole('button', { name: 'Discard changes', exact: true }).click();
  await expect(title).toHaveCount(0);
  await expect(page.locator('#home-hero-title')).not.toContainText('An unsaved English title');
});
