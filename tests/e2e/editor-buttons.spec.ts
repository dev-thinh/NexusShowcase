import { expect, login, seedPhotoGalleries, test } from './fixtures';

test('both photo editors use system button styles and equal action widths across screen sizes', async ({ page, fixture, database }) => {
  test.setTimeout(60_000);
  await seedPhotoGalleries(database);
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await login(page, fixture.users.find(user => user.role === 'ADMIN')!, '/');
    for (const name of ['Chỉnh sửa ảnh khoảnh khắc', 'Chỉnh sửa ảnh hướng nghiên cứu']) {
      await page.locator(`[data-deferred-section="${name.includes('hướng') ? 'research' : 'moments'}"]`).scrollIntoViewIfNeeded();
      await page.getByRole('button', { name, exact: true }).click();
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await expect.poll(() => modal.evaluate(element => {
          const save = element.querySelector<HTMLElement>('.action-primary-detail.moments-editor__button')!;
          const standard = getComputedStyle(save);
          const controls = [...element.querySelectorAll<HTMLElement>('.moments-editor__button, .moments-editor__icon, .moments-editor__asset-delete, .moments-editor__mobile-tabs button, .moments-editor__filter > button')].filter(control => control.getBoundingClientRect().height > 0);
          const unequalGroups = ['.moments-editor__footer-actions', '.moments-editor__library-actions', '.moments-editor__mobile-tabs'].flatMap(selector => {
            const items = [...element.querySelectorAll<HTMLElement>(`${selector} > :is(button, div, label)`)].filter(control => control.getBoundingClientRect().height > 0);
            const widths = items.map(item => item.getBoundingClientRect().width);
            return items.length < 2 || Math.abs(widths[0] - widths[1]) < 1 ? [] : [{ selector, widths }];
          });
          return {
            mismatches: controls.flatMap(control => {
              const style = getComputedStyle(control);
              return style.height === standard.height && style.borderRadius === standard.borderRadius && style.fontSize === standard.fontSize && style.fontWeight === standard.fontWeight ? [] : [{ control: control.className, actual: [style.height, style.borderRadius, style.fontSize, style.fontWeight], expected: [standard.height, standard.borderRadius, standard.fontSize, standard.fontWeight] }];
            }), unequalGroups,
            overflow: element.scrollWidth > element.clientWidth,
          };
        }), { message: `${name} at ${width}px` }).toEqual({ mismatches: [], unequalGroups: [], overflow: false });
        await expect(modal.getByRole('button', { name: 'Lưu thay đổi', exact: true })).toBeInViewport();
        if (width === 390) {
          await modal.getByRole('button', { name: 'Sửa ảnh', exact: true }).click();
          await expect(modal.getByRole('button', { name: 'Đưa ảnh sang phải' })).toBeVisible();
          await modal.screenshot({ path: `.tmp/${name.includes('hướng') ? 'research' : 'moments'}-buttons-mobile.png` });
          await modal.getByRole('button', { name: 'Sắp xếp ảnh', exact: true }).click();
        }
      }
      await modal.getByRole('button', { name: 'Hủy', exact: true }).click();
      await expect(modal).toHaveCount(0);
      await page.setViewportSize({ width: 1440, height: 900 });
    }
  } finally { await database.homeMomentsGallery.deleteMany(); }
});
