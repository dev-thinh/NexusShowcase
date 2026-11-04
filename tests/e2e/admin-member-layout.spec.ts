import { acknowledgeSuccess, expect, login, test } from './fixtures';

for (const width of [320, 390, 1440]) test(`member rows balance identity with date and permissions at ${width}px`, async ({ page, fixture }) => {
  await page.setViewportSize({ width, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await login(page, fixture.users[0], '/admin/members');
  const panel = page.locator('.management-filter-panel');
  const actions = page.getByRole('group', { name: 'Thao tác quản lý', exact: true });
  await expect(actions.getByRole('button', { name: 'Thêm thành viên', exact: true })).toBeVisible();
  expect((await actions.boundingBox())!.y).toBeGreaterThan((await panel.boundingBox())!.y + (await panel.boundingBox())!.height);
  await expect(panel.getByRole('button', { name: 'Thêm thành viên', exact: true })).toHaveCount(0);
  const member = page.locator('.admin-member-row').filter({ has: page.getByRole('button', { name: /^Quyền của / }) }).first();
  await expect(member).toBeVisible();
  const trigger = member.getByRole('button', { name: /^Quyền của / });
  const name = (await member.locator('.admin-member-name').boundingBox())!;
  await expect(member.locator('.admin-member-name')).toHaveCSS('white-space', 'nowrap');
  await expect(member.locator('.admin-member-name')).toHaveCSS('text-overflow', 'ellipsis');
  const role = (await member.locator('.admin-member-role').boundingBox())!;
  const date = (await member.locator('.admin-member-joined').boundingBox())!;
  const button = (await trigger.boundingBox())!;
  expect(Math.abs(name.y - date.y)).toBeLessThan(1);
  expect(Math.abs(name.x - role.x)).toBeLessThan(1);
  expect(role.y).toBeGreaterThanOrEqual(name.y + name.height);
  expect(Math.abs(date.x + date.width - button.x - button.width)).toBeLessThan(1);
  expect(button.y).toBeGreaterThanOrEqual(date.y + date.height);
  expect(button.width).toBeLessThan(110);
  expect(Math.abs(button.height - role.height)).toBeLessThan(1);
  await member.evaluate(element => element.scrollIntoView({ block: 'center' }));
  await member.screenshot({ path: `/tmp/nexus-mobile-audit/member-permissions-row-${width}.png` });
  await trigger.click();
  const menu = member.getByRole('group', { name: /^Quản lý quyền của / });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('button', { name: /Cấp quyền đăng bài|Thu quyền đăng bài/ })).toBeVisible();
  await expect(menu.getByRole('button', { name: /^Xóa tài khoản / })).toBeVisible();
  const menuBox = (await menu.boundingBox())!;
  expect(menuBox.x).toBeGreaterThanOrEqual(0);
  expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(width);
  await menu.screenshot({ path: `/tmp/nexus-mobile-audit/member-permissions-menu-${width}.png` });
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await menu.getByRole('button', { name: /^Xóa tài khoản / }).click();
  await expect(page.getByRole('dialog', { name: 'Xác nhận xóa tài khoản', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Hủy bỏ', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.goto('/admin/works');
  const bulk = page.locator('.admin-bulk-actions');
  await expect(bulk).toBeVisible();
  const filterBox = (await panel.boundingBox())!;
  expect((await bulk.boundingBox())!.y).toBeGreaterThan(filterBox.y + filterBox.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('permissions menu grants and revokes publishing access', async ({ page, fixture, database }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const user = await database.user.create({ data: { email: `${fixture.prefix}-permissions@example.test`, fullName: 'Thành viên kiểm tra quyền', role: 'MEMBER', status: 'ACTIVE' } });
  try {
    await login(page, fixture.users[0], `/admin/members?q=${encodeURIComponent(user.fullName)}`);
    const row = page.locator('.admin-member-row');
    for (const action of ['Cấp quyền đăng bài', 'Thu quyền đăng bài']) {
      await row.getByRole('button', { name: `Quyền của ${user.fullName}`, exact: true }).click();
      await row.getByRole('button', { name: action, exact: true }).click();
      await acknowledgeSuccess(page);
      await expect(row.locator('.admin-member-role')).toHaveText(action.startsWith('Cấp') ? 'Trưởng nhóm' : 'Thành viên');
      await expect.poll(async () => (await database.user.findUniqueOrThrow({ where: { id: user.id } })).role).toBe(action.startsWith('Cấp') ? 'CORE_MEMBER' : 'MEMBER');
    }
  } finally { await database.user.delete({ where: { id: user.id } }); }
});
