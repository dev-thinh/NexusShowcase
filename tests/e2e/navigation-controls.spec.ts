import { expect, login, test } from './fixtures';

for (const width of [320, 390, 1440]) {
  test(`admin bulk buttons match and page jump preserves filters at ${width}px`, async ({ page, fixture }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await login(page, fixture.users[0], '/admin/works');
    const actions = page.locator('.admin-bulk-actions');
    await expect(actions).toBeVisible();
    const sizes = await actions.getByRole('button').evaluateAll(buttons => buttons.map(button => {
      const box = button.getBoundingClientRect();
      return { width: box.width, height: box.height };
    }));
    expect(sizes).toHaveLength(2);
    expect(Math.abs(sizes[0].width - sizes[1].width)).toBeLessThan(1);
    expect(Math.abs(sizes[0].height - sizes[1].height)).toBeLessThan(1);
    for (const name of ['Quản lý ghim', 'Phạm vi hiển thị']) {
      await actions.getByRole('button', { name, exact: true }).click();
      const dialog = page.getByRole('dialog', { name, exact: true });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Đóng hộp thoại' }).click();
    }
    await page.goto('/admin/members?role=MEMBER&q=Benchmark');
    const nav = page.getByRole('navigation', { name: 'Phân trang thành viên' });
    const form = nav.getByRole('form', { name: 'Chọn trang' });
    await expect(form).toBeVisible();
    await form.getByRole('spinbutton', { name: 'Trang cần đến' }).fill('5');
    await form.getByRole('spinbutton', { name: 'Trang cần đến' }).press('Enter');
    await expect(page).toHaveURL(url => url.searchParams.get('page') === '5' && url.searchParams.get('role') === 'MEMBER' && url.searchParams.get('q') === 'Benchmark');
    await expect(form.getByRole('spinbutton')).toHaveValue('5');
    await expect(form.getByRole('button')).toHaveCount(0);
    await expect(form.getByRole('spinbutton')).toHaveAttribute('enterkeyhint', 'go');
    {
      const previous = (await nav.getByRole('link', { name: 'Trang trước', exact: true }).boundingBox())!;
      const next = (await nav.getByRole('link', { name: 'Trang sau', exact: true }).boundingBox())!;
      const box = (await nav.boundingBox())!;
      const middle = (await form.boundingBox())!;
      expect(Math.abs((previous.x + next.x + next.width) / 2 - box.x - box.width / 2)).toBeLessThan(1);
      expect(middle.x - previous.x - previous.width).toBeLessThanOrEqual(9);
      expect(next.x - middle.x - middle.width).toBeLessThanOrEqual(9);
      await nav.screenshot({ path: `/tmp/nexus-mobile-audit/pagination-${width}.png` });
    }
    await form.getByRole('spinbutton').fill('999');
    await form.getByRole('spinbutton', { name: 'Trang cần đến' }).press('Enter');
    expect(await form.getByRole('spinbutton').evaluate(element => (element as HTMLInputElement).validity.rangeOverflow)).toBe(true);
    await expect(form.getByRole('alert')).toContainText('Nhập số trang từ 1 đến');
    expect(new URL(page.url()).searchParams.get('page')).toBe('5');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

for (const width of [320, 390]) test(`account and public dropdowns share visual styles at ${width}px`, async ({ page, fixture }) => {
  await page.setViewportSize({ width, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await login(page, fixture.users[0], '/contact');
  const accountButton = page.getByRole('button', { name: /Menu tài khoản:/ });
  await accountButton.click();
  const account = page.getByRole('navigation', { name: 'Chức năng tài khoản' });
  await expect(account).toBeVisible();
  const accountStyle = await account.getByRole('link').first().evaluate(element => {
    const style = getComputedStyle(element);
    return [style.fontSize, style.fontWeight, style.lineHeight, style.padding, style.borderRadius, style.minHeight];
  });
  expect((await account.boundingBox())!.width).toBe(256);
  const accountPanel = await account.evaluate(element => {
    const style = getComputedStyle(element);
    return [style.width, style.padding, style.borderRadius, style.borderWidth, style.boxShadow];
  });
  await accountButton.click();
  await page.getByRole('button', { name: 'Mở menu điều hướng' }).click();
  const navigation = page.getByRole('navigation', { name: 'Điều hướng chính', exact: true });
  await expect(navigation).toBeVisible();
  expect(await navigation.getByRole('link').first().evaluate(element => {
    const style = getComputedStyle(element);
    return [style.fontSize, style.fontWeight, style.lineHeight, style.padding, style.borderRadius, style.minHeight];
  })).toEqual(accountStyle);
  expect(await navigation.evaluate(element => {
    const style = getComputedStyle(element);
    return [style.width, style.padding, style.borderRadius, style.borderWidth, style.boxShadow];
  })).toEqual(accountPanel);
});
