import { LOCALE_COOKIE } from '../../src/shared/i18n/core';
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
  const member = page.locator('.admin-member-row').filter({ has: page.locator('[data-member-role="MEMBER"]') }).first();
  await expect(member).toBeVisible();
  const trigger = member.getByRole('button', { name: /^Quản lý tài khoản / });
  const name = (await member.locator('.admin-member-name').boundingBox())!;
  await expect(member.locator('.admin-member-name')).toHaveCSS('white-space', 'nowrap');
  await expect(member.locator('.admin-member-name')).toHaveCSS('text-overflow', 'ellipsis');
  const role = (await member.locator('.admin-member-role').boundingBox())!;
  const date = (await member.locator('.admin-member-joined').boundingBox())!;
  const button = (await trigger.boundingBox())!;
  if (width >= 640) {
    expect(Math.abs(name.y - date.y)).toBeLessThan(1);
    expect(Math.abs(name.x - role.x)).toBeLessThan(1);
  } else {
    expect(Math.abs(name.x - date.x)).toBeLessThan(1);
    expect(date.y).toBeGreaterThanOrEqual(name.y + name.height);
    expect(role.y).toBeGreaterThanOrEqual(date.y + date.height);
  }
  expect(role.y).toBeGreaterThanOrEqual(name.y + name.height);
  if (width >= 640) {
    expect(Math.abs(date.x + date.width - button.x - button.width)).toBeLessThan(1);
    expect(button.y).toBeGreaterThanOrEqual(date.y + date.height);
  }
  expect(button.width).toBeLessThan(110);
  expect(button.height).toBe(26);
  expect(role.height).toBeGreaterThanOrEqual(button.height);
  await member.evaluate(element => element.scrollIntoView({ block: 'center' }));
  await member.screenshot({ path: `/tmp/nexus-mobile-audit/member-permissions-row-${width}.png` });
  await trigger.click();
  const menu = member.getByRole('group', { name: /^Thao tác quản lý / });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('button', { name: /Cấp quyền đăng bài|Thu quyền đăng bài/ })).toBeVisible();
  await expect(menu.getByRole('button', { name: /^Xóa tài khoản / })).toBeVisible();
  await expect(menu.getByRole('button', { name: 'Đặt lại mật khẩu', exact: true }).locator('svg.lucide-key-round')).toBeVisible();
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
      await row.getByRole('button', { name: `Quản lý tài khoản ${user.fullName}`, exact: true }).click();
      await row.getByRole('button', { name: action, exact: true }).click();
      await acknowledgeSuccess(page);
      await expect(row.locator('.admin-member-role')).toHaveText(action.startsWith('Cấp') ? 'Trưởng nhóm' : 'Thành viên');
      await expect.poll(async () => (await database.user.findUniqueOrThrow({ where: { id: user.id } })).role).toBe(action.startsWith('Cấp') ? 'CORE_MEMBER' : 'MEMBER');
    }
  } finally { await database.user.delete({ where: { id: user.id } }); }
});

for (const locale of ['vi', 'en'] as const) test(`disabled statuses align beside varying roles without increasing desktop row height (${locale})`, async ({ page, fixture, database, baseURL }) => {
  const users = await Promise.all((['MEMBER', 'CORE_MEMBER', 'ADMIN', 'MEMBER'] as const).map((role, index) => database.user.create({ data: {
    email: `${fixture.prefix}-badge-status-${locale}-${index}@example.test`, fullName: `Badge status fixture ${index}`, role,
    status: index === 3 ? 'ACTIVE' : 'SUSPENDED', deletedAt: index === 3 ? null : new Date(), createdAt: new Date('2026-11-01'),
  } })));
  try {
    await page.context().addCookies([{ name: LOCALE_COOKIE, value: locale, url: baseURL! }]);
    await login(page, fixture.users[0], '/admin/members?q=Badge%20status%20fixture');
    const rows = page.locator('.admin-member-row');
    await expect(rows).toHaveCount(4);
    await expect(rows.locator('.admin-member-disabled')).toHaveCount(3);
    await expect(rows.locator('.admin-member-joined')).not.toContainText([/vô hiệu hóa|Deactivated/i]);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => document.fonts.ready);
      const geometry = await rows.evaluateAll(elements => elements.map(element => {
        const role = element.querySelector('.admin-member-role')!.getBoundingClientRect();
        const status = element.querySelector('.admin-member-disabled')?.getBoundingClientRect();
        const actions = element.querySelector('.admin-member-actions')!.getBoundingClientRect();
        const style = getComputedStyle(element);
        const contentHeight = element.getBoundingClientRect().height - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth);
        return { height: contentHeight, role: role.toJSON(), status: status?.toJSON(), actions: actions.toJSON() };
      }));
      for (const row of geometry.filter(row => row.status)) {
        if (width >= 640) expect(row.status!.right).toBeLessThanOrEqual(row.actions.left - 8);
        else expect(row.status!.top).toBeGreaterThanOrEqual(row.actions.bottom);
        expect(row.status!.top).toBeGreaterThanOrEqual(row.role.top - 1);
        if (width >= 768) {
          expect(row.status!.left - row.role.right).toBeGreaterThanOrEqual(12);
          expect(Math.abs(row.status!.top - row.role.top)).toBeLessThan(1);
        }
      }
      {
        const starts = geometry.filter(row => row.status).map(row => row.status!.left);
        expect(Math.max(...starts) - Math.min(...starts)).toBeLessThan(1);
        expect(Math.max(...geometry.map(row => row.height)) - Math.min(...geometry.map(row => row.height))).toBeLessThan(1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width === 320 || width === 1440) await rows.first().locator('..').screenshot({ path: `test-results/member-status-${locale}-${width}.png` });
    }
  } finally { await database.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } }); }
});
