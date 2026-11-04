import { expect, login, test } from './fixtures';

test('a hidden admin can sign in and manage accounts while remaining absent from public directories', async ({ page, fixture, database }) => {
  const admin = fixture.users.find(user => user.role === 'ADMIN')!;
  await database.user.update({ where: { id: admin.id }, data: { hiddenFromDirectory: true } });
  try {
    await login(page, admin, '/admin');
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.goto(`/members/${admin.id}`);
    await expect(page.getByRole('button', { name: 'Chỉnh sửa hồ sơ', exact: true })).toBeVisible();
    for (const path of ['/members', '/']) {
      await page.goto(path);
      if (path === '/') await page.locator('[data-deferred-section="members"]').scrollIntoViewIfNeeded();
      await expect(page.getByText('99 thành viên', { exact: true })).toBeVisible();
      await expect(page.locator(`main a[href="/members/${admin.id}"]`)).toHaveCount(0);
    }
  } finally { await database.user.update({ where: { id: admin.id }, data: { hiddenFromDirectory: false } }); }
});
