import { expect, login, test } from './fixtures';

for (const width of [320, 1280]) {
  test(`administration uses consistent navigation and filters at ${width}px`, async ({ page, fixture }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await login(page, fixture.users[0], '/admin');
    const navigation = page.getByRole('navigation', { name: 'Điều hướng quản trị' });
    for (const [label, path, filterLabel] of [
      ['Thành viên', '/admin/members', 'Vai trò'],
      ['Nội dung', '/admin/works', 'Lọc nội dung'],
      ['Phê duyệt', '/admin/reviews', ''],
    ]) {
      await navigation.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      const form = page.getByRole('search');
      await expect(form.getByRole('searchbox')).toBeVisible();
      await expect(form.getByRole('button', { name: 'Áp dụng' })).toBeVisible();
      if (filterLabel) {
        const dropdown = form.getByRole('combobox', { name: filterLabel, exact: true });
        if (width < 768) {
          await expect(dropdown).toBeHidden();
          await form.getByRole('button', { name: /Bộ lọc/ }).click();
        }
        await expect(dropdown).toBeVisible();
        await dropdown.click();
        await page.getByRole('option', { name: path.endsWith('members') ? /^Trưởng nhóm/ : /^Đang ghim/ }).click();
        await form.getByRole('button', { name: 'Áp dụng', exact: true }).click();
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

for (const width of [320, 1280]) test(`my works uses the same dropdown and preserves search at ${width}px`, async ({ page, fixture }) => {
  await page.setViewportSize({ width, height: 900 });
  await login(page, fixture.users[0], '/my-works');
  const form = page.getByRole('search');
  if (width < 768) await form.getByRole('button', { name: /Bộ lọc/ }).click();
  const dropdown = form.getByRole('combobox', { name: 'Lọc trạng thái bài đăng', exact: true });
  await dropdown.click();
  await page.getByRole('option', { name: /^Bản nháp/ }).click();
  await form.getByRole('searchbox').fill('no-matching-work');
  await form.getByRole('button', { name: 'Áp dụng', exact: true }).click();
  await expect(page).toHaveURL(/filter=DRAFT/);
  await expect(page).toHaveURL(/q=no-matching-work/);
  await expect(form.locator('input[name="filter"]')).toHaveValue('DRAFT');
  await expect(form.getByRole('searchbox')).toHaveValue('no-matching-work');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.management-filter-panel').getByRole('link', { name: 'Xóa bộ lọc', exact: true }).click();
  await expect(page).toHaveURL(/my-works$/);
});

test('member dropdowns submit role and account status together with the search term', async ({ page, fixture }) => {
  await login(page, fixture.users[0], '/admin/members');
  const form = page.getByRole('search');
  await form.getByRole('searchbox').fill('no-matching-member');
  await form.getByRole('combobox', { name: 'Vai trò', exact: true }).click();
  await page.getByRole('option', { name: /^Thành viên/ }).click();
  await form.getByRole('combobox', { name: 'Trạng thái', exact: true }).click();
  await page.getByRole('option', { name: 'Đã vô hiệu hóa', exact: true }).click();
  await form.getByRole('button', { name: 'Áp dụng', exact: true }).click();
  await expect(page).toHaveURL(/role=MEMBER/);
  await expect(page).toHaveURL(/status=DISABLED/);
  await expect(page).toHaveURL(/q=no-matching-member/);
  await expect(form.locator('input[name="status"]')).toHaveValue('DISABLED');
  await expect(form.locator('input[name="role"]')).toHaveValue('MEMBER');
});
