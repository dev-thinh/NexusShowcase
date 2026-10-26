import type { Locator, Page } from '@playwright/test';
import { expect, login, test } from './fixtures';

async function dragSelectText(page: Page, text: Locator) {
  await text.scrollIntoViewIfNeeded();
  const box = await text.evaluate(element => {
    window.getSelection()?.removeAllRanges();
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const value = node.textContent ?? '';
      const start = value.search(/\S/);
      if (start < 0) continue;
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, Math.min(value.length, start + 12));
      const rect = range.getClientRects()[0];
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }
    throw new Error('Missing selectable text');
  });
  await page.mouse.move(box.x + 1, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 1, box.y + box.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString().trim().length ?? 0)).toBeGreaterThan(2);
  expect(await text.evaluate(element => {
    const selection = getComputedStyle(element, '::selection');
    return { background: selection.backgroundColor, color: selection.color };
  })).toEqual({ background: 'rgb(21, 61, 103)', color: 'rgb(255, 255, 255)' });
}

test('mouse text selection stays visible on public and login pages', async ({ page }) => {
  for (const path of ['/contact', '/login']) {
    await page.goto(path);
    const heading = page.getByRole('heading', { name: path === '/contact' ? 'Liên hệ Ban Điều Hành CLB Robotics & IoT' : /Ươm mầm nghiên cứu/, exact: true });
    await expect(heading).toBeVisible();
    await dragSelectText(page, heading);
  }
});

test('password errors appear only after failed validation and remain selectable', async ({ page, fixture }) => {
  await login(page, fixture.users[0], `/members/${fixture.users[0].id}`);
  await page.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Đổi mật khẩu', exact: true });
  const input = dialog.getByLabel('Mật khẩu mới', { exact: true });
  await expect(dialog.getByRole('alert')).toHaveCount(0);
  await expect(dialog.getByText('Cần có ít nhất 8 ký tự', { exact: false })).toHaveCount(0);
  await dialog.getByLabel('Mật khẩu hiện tại', { exact: true }).fill(fixture.users[0].password);
  await input.fill('short');
  await dialog.getByLabel('Xác nhận mật khẩu mới', { exact: true }).fill('short');
  await dialog.getByRole('button', { name: 'Xác nhận đổi mật khẩu', exact: true }).click();
  const error = dialog.getByRole('alert').filter({ hasText: 'Mật khẩu mới cần ít nhất 8 ký tự, có chữ hoa, số và ký tự đặc biệt.' });
  await expect(error).toHaveCSS('font-weight', '400');
  await expect(error).toHaveCSS('color', 'rgb(159, 18, 57)');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(input).toHaveAttribute('aria-describedby', await error.getAttribute('id') as string);
  await dragSelectText(page, error);
  await input.fill('Correct1!');
  await expect(error).toHaveCount(0);
  await expect(input).not.toHaveAttribute('aria-invalid', 'true');
});

test('password eye buttons toggle independently without submitting or clearing values', async ({ page, fixture }) => {
  await login(page, fixture.users[0], `/members/${fixture.users[0].id}`);
  await page.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Đổi mật khẩu', exact: true });
  const fields = [
    ['Mật khẩu hiện tại', 'mật khẩu hiện tại'],
    ['Mật khẩu mới', 'mật khẩu mới'],
    ['Xác nhận mật khẩu mới', 'xác nhận mật khẩu mới'],
  ];
  for (const [label, name] of fields) {
    const input = dialog.getByLabel(label, { exact: true });
    await input.fill('Test-password1!');
    await expect(input).toHaveAttribute('type', 'password');
    await dialog.getByRole('button', { name: `Hiện ${name}`, exact: true }).click();
    await expect(input).toHaveAttribute('type', 'text');
    await expect(input).toHaveValue('Test-password1!');
    for (const [otherLabel] of fields.filter(([other]) => other !== label)) {
      await expect(dialog.getByLabel(otherLabel, { exact: true })).toHaveAttribute('type', 'password');
    }
    const hide = dialog.getByRole('button', { name: `Ẩn ${name}`, exact: true });
    await expect(hide).toHaveAttribute('aria-pressed', 'true');
    await hide.click();
    await expect(input).toHaveAttribute('type', 'password');
    await expect(input).toHaveValue('Test-password1!');
    await expect(dialog.getByRole('alert')).toHaveCount(0);
  }
});
