import { expect, test } from './fixtures';

async function assertCenteredRows(grid: import('@playwright/test').Locator) {
  const offsets = await grid.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const rows = new Map<number, DOMRect[]>();
    for (const child of element.children) {
      const box = child.getBoundingClientRect();
      const top = Math.round(box.top);
      rows.set(top, [...(rows.get(top) ?? []), box]);
    }
    return [...rows.values()].map(row => Math.abs((row[0].left + row.at(-1)!.right) / 2 - (rect.left + rect.right) / 2));
  });
  expect(offsets.every(offset => offset < 2)).toBe(true);
}

test('homepage samples thirty positions and preserves the selection while interacting', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('[data-deferred-section="members"]');
  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveAttribute('data-state', 'ready');
  const avatars = section.locator('[data-home-member-avatar]');
  await expect(avatars).toHaveCount(29);
  await expect(section.getByText('100 thành viên', { exact: true })).toBeVisible();
  await expect(section.getByRole('link', { name: 'Xem tất cả 100 thành viên, còn 71 thành viên' })).toBeVisible();
  const roles = await avatars.evaluateAll(elements => elements.map(element => element.getAttribute('data-role')));
  expect(roles.slice(0, 2)).toEqual(['ADMIN', 'CORE_MEMBER']);
  const ids = await avatars.evaluateAll(elements => elements.map(element => element.getAttribute('data-member-id')));
  expect(new Set(ids).size).toBe(29);
  await avatars.first().hover();
  await expect(page.getByRole('tooltip')).toContainText('Ban chủ nhiệm');
  await expect(page.getByRole('tooltip')).toContainText('Benchmark Member 000');
  await expect(section.locator('.panel-public')).toHaveCount(0);
  expect(await avatars.evaluateAll(elements => elements.map(element => element.getAttribute('data-member-id')))).toEqual(ids);
  await assertCenteredRows(section.locator('.home-member-grid'));
  await section.screenshot({ path: 'test-results/home-members-desktop.png' });
  await section.getByRole('link', { name: 'Xem tất cả 100 thành viên, còn 71 thành viên' }).click();
  await expect(page).toHaveURL(/\/members$/);
});

for (const count of [2, 13, 30]) test(`centers every row for ${count} members on desktop and mobile`, async ({ page }) => {
  await page.route('**/api/home?section=members', route => route.fulfill({ json: {
    total: count,
    members: Array.from({ length: count }, (_, index) => ({ id: `m${index}`, fullName: `Thành viên ${index}`, avatarUrl: null, role: index === 0 ? 'ADMIN' : index < 4 ? 'CORE_MEMBER' : 'MEMBER' })),
  } }));
  await page.goto('/');
  const section = page.locator('[data-deferred-section="members"]');
  await section.scrollIntoViewIfNeeded();
  await expect(section.locator('[data-home-member-avatar]')).toHaveCount(count);
  await expect(section.locator('.home-member-more')).toHaveCount(0);
  await assertCenteredRows(section.locator('.home-member-grid'));
  await page.setViewportSize({ width: 390, height: 844 });
  await section.scrollIntoViewIfNeeded();
  await assertCenteredRows(section.locator('.home-member-grid'));
  const avatar = section.locator('[data-home-member-avatar]').first();
  await avatar.focus();
  await expect(page.getByRole('tooltip')).toContainText('Thành viên 0');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (count === 13) await section.screenshot({ path: 'test-results/home-members-mobile.png' });
  await expect(avatar).toHaveAttribute('href', '/members/m0');
  await avatar.click();
  await expect(page).toHaveURL(/\/members\/m0$/);
});
