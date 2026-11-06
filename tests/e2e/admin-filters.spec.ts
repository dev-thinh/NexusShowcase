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
      await expect(form.getByRole('button', { name: 'Tìm kiếm' })).toHaveCount(0);
      if (filterLabel) {
        const dropdown = form.getByRole('combobox', { name: filterLabel, exact: true });
        if (width < 768) {
          await expect(dropdown).toBeHidden();
          await form.getByRole('button', { name: /Bộ lọc/ }).click();
        }
        await expect(dropdown).toBeVisible();
        await dropdown.click();
        await page.getByRole('option', { name: path.endsWith('members') ? /^Trưởng nhóm/ : /^Đang ghim/ }).click();
        await expect(page).toHaveURL(/(?:role=CORE_MEMBER|filter=PINNED)/);
      }
      await form.getByRole('searchbox').fill('no-matching-admin-filter');
      await form.getByRole('searchbox').press('Enter');
      await expect(page).toHaveURL(/q=no-matching-admin-filter/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await form.screenshot({ path: `/tmp/nexus-filters-${width}-${path.split('/').at(-1)}.png` });
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
  await expect(page).toHaveURL(/filter=DRAFT/);
  await form.getByRole('searchbox').fill('no-matching-work');
  await form.getByRole('searchbox').press('Enter');
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
  await expect(page).toHaveURL(/role=MEMBER/);
  await form.getByRole('combobox', { name: 'Trạng thái', exact: true }).click();
  await page.getByRole('option', { name: 'Đã vô hiệu hóa', exact: true }).click();
  await expect(page).toHaveURL(/role=MEMBER/);
  await expect(page).toHaveURL(/status=DISABLED/);
  await expect(page).toHaveURL(/q=no-matching-member/);
  await expect(form.locator('input[name="status"]')).toHaveValue('DISABLED');
  await expect(form.locator('input[name="role"]')).toHaveValue('MEMBER');
  await page.goBack();
  await expect(page).toHaveURL(url => url.searchParams.get('role') === 'MEMBER' && url.searchParams.get('status') === 'ALL');
  await page.goForward();
  await expect(page).toHaveURL(/status=DISABLED/);
});


test('selecting role and status filters immediately and clearing stays beside search', async ({ page, fixture }) => {
  await login(page, fixture.users[0], '/admin/members?page=2');
  const form = page.getByRole('search');
  await form.getByRole('combobox', { name: 'Vai trò', exact: true }).click();
  await page.getByRole('option', { name: /^Trưởng nhóm/ }).click();
  await form.getByRole('combobox', { name: 'Trạng thái', exact: true }).click();
  await page.getByRole('option', { name: 'Đã vô hiệu hóa', exact: true }).click();
  await expect(page).toHaveURL(/role=CORE_MEMBER/);
  await expect(page).toHaveURL(/status=DISABLED/);
  expect(new URL(page.url()).searchParams.has('page')).toBe(false);
  await form.getByRole('searchbox').fill('An unsubmitted search');
  const actions = form.locator('.filter-actions');
  await expect(actions.getByRole('link', { name: 'Xóa bộ lọc', exact: true })).toBeVisible();
  await actions.getByRole('link', { name: 'Xóa bộ lọc', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/members$/);
  await expect(form.getByRole('searchbox')).toHaveValue('');
  await expect(form.locator('input[name="role"]')).toHaveValue('ALL');
  await expect(form.locator('input[name="status"]')).toHaveValue('ALL');
});

test('typing searches automatically without losing focus and dropdowns omit result counts', async ({ page, fixture }) => {
  await login(page, fixture.users[0], '/admin/members');
  const form = page.getByRole('search');
  await expect(form.getByRole('button', { name: 'Tìm kiếm', exact: true })).toHaveCount(0);
  const input = form.getByRole('searchbox');
  await input.pressSequentially('Benchmark', { delay: 30 });
  await expect(page).toHaveURL(/q=Benchmark/);
  await expect(input).toBeFocused();
  await input.pressSequentially(' Member 001', { delay: 30 });
  await expect(page).toHaveURL(url => url.searchParams.get('q') === 'Benchmark Member 001');
  await expect(input).toHaveValue('Benchmark Member 001');
  await expect(input).toBeFocused();
  await form.getByRole('combobox', { name: 'Vai trò', exact: true }).click();
  for (const option of await page.getByRole('option').all()) await expect(option).not.toContainText(/\(\d+\)/);
  await page.keyboard.press('Escape');
  await form.locator('.filter-actions').getByRole('link', { name: 'Xóa bộ lọc', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/members$/);
  await expect(input).toHaveValue('');
});

test('Vietnamese composition does not submit until the composed text is complete', async ({ page, fixture }) => {
  await login(page, fixture.users[0], '/admin/members');
  const input = page.getByRole('searchbox');
  await input.dispatchEvent('compositionstart');
  await input.fill('Nguyễn');
  await page.waitForTimeout(400);
  expect(new URL(page.url()).searchParams.has('q')).toBe(false);
  await input.dispatchEvent('compositionend');
  await expect(page).toHaveURL(url => url.searchParams.get('q') === 'Nguyễn');
  await expect(input).toHaveValue('Nguyễn');
});
