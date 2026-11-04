import { expect, login, test } from './fixtures';

for (const width of [320, 1280]) {
  test(`administration uses consistent navigation and filters at ${width}px`, async ({ page, fixture }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await login(page, fixture.users[0], '/admin');
    const navigation = page.getByRole('navigation', { name: 'Điều hướng quản trị' });
    for (const [label, path, filterLabel] of [
      ['Thành viên', '/admin/members', 'Lọc theo vai trò'],
      ['Nội dung', '/admin/works', 'Lọc nội dung'],
      ['Phê duyệt', '/admin/reviews', ''],
    ]) {
      await navigation.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      const form = page.getByRole('search');
      await expect(form.getByRole('searchbox')).toBeVisible();
      await expect(form.getByRole('button', { name: 'Áp dụng' })).toBeVisible();
      if (filterLabel) {
        const group = form.getByRole('group', { name: filterLabel });
        if (width < 768) {
          await expect(group).toBeHidden();
          await form.getByRole('button', { name: /Bộ lọc/ }).click();
        }
        await expect(group).toBeVisible();
        await group.getByRole('link').nth(1).click();
        await expect(page).toHaveURL(/(?:role=CORE_MEMBER|filter=PINNED)/);
      }
      await form.getByRole('searchbox').fill('no-matching-admin-filter');
      await form.getByRole('button', { name: 'Áp dụng' }).click();
      await expect(page).toHaveURL(/q=no-matching-admin-filter/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await form.locator('..').getByRole('link', { name: 'Xóa bộ lọc', exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
    }
  });
}
