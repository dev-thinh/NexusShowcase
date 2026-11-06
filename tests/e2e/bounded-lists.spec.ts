import { expect, login, test } from './fixtures';

test('search pages retain their query and detail return destination', async ({ page }) => {
  await page.goto('/?q=Benchmark');
  await expect(page.locator('main article')).toHaveCount(10);
  const title = page.getByRole('link', { name: 'Benchmark Research 0010', exact: true });
  await title.click();
  await expect(page).toHaveURL(/\/works\/benchmark-10\?/);
  const returnLink = page.getByRole('navigation', { name: 'Đường dẫn', exact: true }).getByRole('link').last();
  await returnLink.click();
  await expect(page).toHaveURL(/q=Benchmark/);
  await expect(page.locator('main article')).toHaveCount(10);
});

test('author lookup pages keep selected names after changing the search', async ({ page, fixture }) => {
  await login(page, fixture.users[1], '/my-works/new');
  await page.getByRole('button', { name: 'Thành viên', exact: true }).click();
  const options = page.getByRole('listbox');
  await expect(options).toHaveAttribute('aria-busy', 'false');
  await expect(options.getByRole('option')).toHaveCount(19);
  const next = page.locator('#club-contributor-search').getByRole('button', { name: 'Trang sau', exact: true });
  await next.focus();
  await next.press('Enter');
  await expect(options.getByRole('option', { name: 'Benchmark Member 020', exact: true })).toBeVisible();
  await options.getByRole('option', { name: 'Benchmark Member 020', exact: true }).click();
  await expect(page.getByText('Benchmark Member 020', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Thành viên', exact: true }).click();
  await page.getByRole('combobox', { name: 'Thêm thành viên CLB' }).fill('Member 099');
  await expect(options.getByRole('option')).toHaveCount(1);
  await expect(options.getByRole('option', { name: 'Benchmark Member 099', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Thêm thành viên CLB' }).evaluate(input => {
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 229, isComposing: true, bubbles: true }));
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  });
  await expect(options.getByRole('option', { name: 'Benchmark Member 099', exact: true })).toBeVisible();
  await expect(page.getByText('Benchmark Member 020', { exact: true })).toBeVisible();
});

test('author and admin filters preserve bounded server pages', async ({ page, fixture }) => {
  await login(page, fixture.users[1]);
  await page.getByRole('combobox', { name: 'Lọc trạng thái bài đăng' }).click();
  await page.getByRole('option', { name: /^Đã xuất bản/ }).click();
  await page.getByRole('search').getByRole('searchbox').press('Enter');
  await expect(page).toHaveURL(/filter=PUBLISHED/);
  await page.getByLabel('Tìm công trình', { exact: true }).fill('Research 0000');
  await page.getByLabel('Tìm công trình', { exact: true }).press('Enter');
  await expect(page).toHaveURL(/q=Research/);
  await expect(page.getByRole('link', { name: 'Benchmark Research 0000', exact: true })).toBeVisible();
  await login(page, fixture.users[0], '/admin/members?page=2');
  await expect(page.getByRole('main').getByRole('link', { name: /^Benchmark Member \d+$/ })).toHaveCount(10);
  await expect(page.getByRole('link', { name: 'Benchmark Member 012', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Benchmark Member 022', exact: true })).toHaveCount(0);
  await page.getByLabel('Tìm thành viên theo họ tên').fill('Member 099');
  await page.getByLabel('Tìm thành viên theo họ tên').press('Enter');
  await expect(page.getByRole('link', { name: 'Benchmark Member 099', exact: true })).toBeVisible();
});
