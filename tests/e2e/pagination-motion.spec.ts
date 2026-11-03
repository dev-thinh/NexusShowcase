import { expect, login, test } from './fixtures';

for (const width of [390, 1440]) test(`page entry and pagination links scroll smoothly after content commits at ${width}px`, async ({ page, fixture }) => {
  await page.setViewportSize({ width, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await login(page, fixture.users[0], '/admin/members');
  const pagination = page.getByRole('navigation', { name: 'Phân trang thành viên' });
  for (const [target, label] of [['3', ''], ['4', 'Trang sau'], ['3', 'Trang trước']]) {
    const control = label ? pagination.getByRole('link', { name: label, exact: true }) : pagination.getByRole('spinbutton');
    await control.scrollIntoViewIfNeeded();
    if (!label) await control.fill(target);
    const start = await page.evaluate(() => {
      const samples: Array<{ top: number; query: string; time: number }> = [];
      const listener = () => samples.push({ top: scrollY, query: location.search, time: performance.now() });
      Object.assign(window, { paginationSamples: samples, paginationListener: listener });
      window.addEventListener('scroll', listener);
      return scrollY;
    });
    expect(start).toBeGreaterThan(300);
    if (label) await control.click(); else await control.press('Enter');
    await expect(page).toHaveURL(url => url.searchParams.get('page') === target);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    const samples = await page.evaluate(() => {
      const state = window as unknown as { paginationSamples: Array<{ top: number; query: string; time: number }>; paginationListener: () => void };
      window.removeEventListener('scroll', state.paginationListener);
      return state.paginationSamples;
    });
    const moving = samples.filter(sample => sample.query.includes(`page=${target}`));
    expect(moving.filter(sample => sample.top > 0 && sample.top < start).length).toBeGreaterThan(5);
    const duration = moving.at(-1)!.time - moving[0].time;
    expect(duration).toBeGreaterThan(400);
    expect(duration).toBeLessThan(1000);
  }
});
