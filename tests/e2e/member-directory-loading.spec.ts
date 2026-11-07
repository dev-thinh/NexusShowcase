import { expect, test } from './fixtures';

test('directory starts bounded and appends members on scroll without duplicates', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests: string[] = [];
  page.on('request', request => { if (request.url().includes('/api/members?')) requests.push(request.url()); });
  await page.goto('/members');
  const members = page.locator('[data-member-directory="MEMBER"]');
  const avatars = members.locator('[data-home-member-avatar]');
  await expect(avatars).toHaveCount(12);
  await expect(page.getByText(/Đã hiển thị/)).toHaveCount(0);
  expect(requests).toHaveLength(0);
  await expect(page.locator('[data-member-load-more]')).toHaveCount(1);
  await expect(page.locator('[aria-labelledby=leadership-heading] [data-home-member-avatar]')).toHaveCount(1);
  await expect(page.locator('[aria-labelledby=experienced-heading] [data-home-member-avatar]')).toHaveCount(1);
  await members.locator('[data-member-load-more]').scrollIntoViewIfNeeded();
  await expect.poll(() => avatars.count()).toBeGreaterThanOrEqual(24);
  expect(requests.some(url => url.includes('page=2'))).toBe(true);
  const ids = await avatars.evaluateAll(elements => elements.map(element => element.getAttribute('data-member-id')));
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids.length).toBeLessThan(98);
  expect(ids.length % 12).toBe(0);
  expect(await members.locator('[data-home-member-avatar]:visible').count()).toBe(ids.length);
  expect(new Set(requests).size).toBe(requests.length);
});

test('card directory retains loaded members after a failed request and supports retry', async ({ page }) => {
  let fail = true;
  await page.route('**/api/members?**', route => fail ? route.fulfill({ status: 500, json: { error: 'Unavailable' } }) : route.continue());
  await page.goto('/members/all');
  const members = page.locator('[data-member-directory="MEMBER"]');
  await expect(members.locator('article')).toHaveCount(12);
  await expect(page.getByText(/Đã hiển thị/)).toHaveCount(0);
  await members.locator('[data-member-load-more]').scrollIntoViewIfNeeded();
  await expect(members.getByRole('alert')).toBeVisible();
  await expect(page.getByText(/Đã hiển thị/)).toHaveCount(0);
  fail = false;
  await members.getByRole('button', { name: 'Thử lại' }).click();
  await expect(members.locator('article')).toHaveCount(24);
  await expect(members.getByRole('alert')).toHaveCount(0);
});
