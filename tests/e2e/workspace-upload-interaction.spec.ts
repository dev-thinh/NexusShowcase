import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fixtureImage } from '../fixtures/moments';
import { expect, login, test } from './fixtures';

test('keeps a workspace loading state through draft creation and creates a fresh draft on the next visit', async ({ page, fixture }) => {
  await login(page, fixture.users.find(user => user.role === 'CORE_MEMBER')!);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/my-works/new', async route => {
    if (route.request().method() === 'POST') await gate;
    await route.continue();
  });
  try {
    await page.getByRole('link', { name: 'Đăng bài mới', exact: true }).click();
    await expect(page.locator('[data-submission-workspace-loading]:visible')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Soạn thảo công trình');
    release();
    await expect(page).toHaveURL(/\/my-works\/[^/]+\/edit$/);
    await expect(page.locator('#submission-title')).toBeEnabled();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Soạn thảo công trình');
    const first = page.url();
    await page.goto('/my-works/new');
    await expect(page).toHaveURL(/\/my-works\/[^/]+\/edit$/);
    expect(page.url()).not.toBe(first);
  } finally { release(); }
});

test('keeps title editing and autosave responsive while a thumbnail upload is waiting', async ({ page, fixture, database }) => {
  await login(page, fixture.users.find(user => user.role === 'CORE_MEMBER')!, '/my-works/new');
  await expect(page).toHaveURL(/\/my-works\/[^/]+\/edit$/);
  const id = page.url().split('/').at(-2)!;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let stored: string | undefined;
  await page.route('**/api/upload', async route => {
    await gate;
    const response = await route.fetch();
    const result = await response.json();
    if (response.ok()) stored = result.url;
    await route.fulfill({ response });
  });
  try {
    await page.locator('#submission-thumbnail').setInputFiles({ name: 'responsive-upload.png', mimeType: 'image/png', buffer: fixtureImage });
    await expect(page.getByRole('status').filter({ hasText: 'Bạn có thể tiếp tục nhập thông tin' })).toBeVisible();
    await expect(page.locator('#submission-title')).toBeEnabled();
    await page.locator('#submission-title').fill('Tiếp tục soạn trong lúc tải ảnh');
    await expect.poll(async () => (await database.showcaseItem.findUniqueOrThrow({ where: { id } })).title).toBe('Tiếp tục soạn trong lúc tải ảnh');
    await expect(page.getByRole('button', { name: 'Gửi duyệt', exact: true })).toBeDisabled();
    release();
    await expect(page.getByRole('button', { name: 'Gửi duyệt', exact: true })).toBeEnabled();
    await expect.poll(async () => (await database.showcaseItem.findUniqueOrThrow({ where: { id } })).thumbnailUrl).toMatch(/^\/uploads\/thumbnails\//);
    await expect(page.locator('#submission-title')).toHaveValue('Tiếp tục soạn trong lúc tải ảnh');
  } finally {
    release();
    if (stored && /^\/uploads\/thumbnails\/[a-f0-9-]+\.png$/.test(stored)) {
      const target = path.resolve('storage/thumbnails', path.basename(stored));
      if (!(await readFile(target)).equals(fixtureImage)) throw Error('Unexpected fixture bytes');
      await unlink(target);
    }
  }
});

test('updates the profile and navbar avatar without a page refresh and keeps profile editing available during upload', async ({ page, fixture, database }) => {
  // Fixture member 002 intentionally has a forced password change; use an eligible member.
  const member = fixture.users[3];
  await login(page, member, `/members/${member.id}`);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let stored: string | undefined;
  let pageRefreshes = 0;
  page.on('request', request => {
    if (request.method() === 'GET' && request.headers().rsc === '1' && new URL(request.url()).pathname.startsWith('/members/')) pageRefreshes++;
  });
  await page.route('**/api/upload?target=avatar', async route => {
    await gate;
    const response = await route.fetch();
    const result = await response.json();
    if (response.ok()) stored = result.url;
    await route.fulfill({ response });
  });
  try {
    await page.getByRole('button', { name: 'Tùy chọn ảnh đại diện', exact: true }).click();
    await page.getByLabel('Chọn ảnh đại diện mới', { exact: true }).setInputFiles({ name: 'member-avatar.png', mimeType: 'image/png', buffer: fixtureImage });
    await expect(page.getByRole('status').filter({ hasText: 'Đang cập nhật ảnh đại diện' })).toBeAttached();
    await page.getByRole('button', { name: 'Chỉnh sửa hồ sơ', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Chỉnh sửa hồ sơ' })).toBeVisible();
    await page.getByRole('dialog', { name: 'Chỉnh sửa hồ sơ' }).getByRole('button', { name: 'Hủy', exact: true }).click();
    release();
    await expect.poll(async () => (await database.user.findUniqueOrThrow({ where: { id: member.id } })).avatarUrl).toMatch(/^\/uploads\/thumbnails\//);
    await expect(page.getByRole('button', { name: 'Tùy chọn ảnh đại diện', exact: true }).locator('img')).toHaveAttribute('src', /\/uploads\/thumbnails\//);
    await expect(page.locator('#site-navbar img')).toHaveAttribute('src', /\/uploads\/thumbnails\//);
    expect(pageRefreshes).toBe(0);
    await page.getByRole('button', { name: 'Tùy chọn ảnh đại diện', exact: true }).click();
    await page.getByRole('button', { name: 'Xem ảnh đại diện', exact: true }).click();
    await page.getByRole('button', { name: 'Xóa ảnh đại diện', exact: true }).click();
    await expect.poll(async () => (await database.user.findUniqueOrThrow({ where: { id: member.id } })).avatarUrl).toBeNull();
    await expect(page.locator('#site-navbar img')).toHaveCount(0);
  } finally {
    release();
    if (stored && /^\/uploads\/thumbnails\/[a-f0-9-]+\.png$/.test(stored)) {
      const target = path.resolve('storage/thumbnails', path.basename(stored));
      if (!(await readFile(target)).equals(fixtureImage)) throw Error('Unexpected avatar fixture bytes');
      await unlink(target);
    }
  }
});
