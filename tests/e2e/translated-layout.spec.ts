import { auditControls } from './controls-layout';
import { createTranslator, LOCALE_COOKIE, type Locale } from '../../src/shared/i18n/core';
import { expect, login, seedPhotoGalleries, test } from './fixtures';

for (const locale of ['vi', 'en'] as Locale[]) {
  test(`public interface controls fit in ${locale} at phone, tablet and desktop sizes`, async ({ page, baseURL }) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.context().addCookies([{ name: LOCALE_COOKIE, value: locale, url: baseURL! }]);
    for (const width of [320, 390, 640, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ['/', '/research', '/projects', '/members', '/contact', '/login']) {
        await page.goto(path);
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await auditControls(page, `${locale} ${path} ${width}`);
      }
    }
  });

  test(`admin pages, account tools and photo editors fit in ${locale}`, async ({ page, fixture, database, baseURL }) => {
    test.setTimeout(240_000);
    const tr = createTranslator(locale);
    await seedPhotoGalleries(database);
    try {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await login(page, fixture.users[0], '/admin/members');
      await page.context().addCookies([{ name: LOCALE_COOKIE, value: locale, url: baseURL! }]);
      for (const width of [320, 390, 640, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        for (const path of ['/admin', '/admin/members', '/admin/works', '/admin/reviews', '/my-works', '/my-works/new', '/account/change-password', `/members/${fixture.users[0].id}`]) {
          await page.goto(path);
          await auditControls(page, `${locale} ${path} ${width}`);
          if (path === '/my-works/new') {
            const summary = page.locator('label[for="submission-summary"]');
            await expect(summary).toContainText(tr('Tóm tắt'));
            await expect(summary).not.toContainText('Abstract /');
          }
          if (path === '/admin/members') {
            if (width === 320) await page.screenshot({ path: `/tmp/nexus-members-${locale}-320.png` });
            const buttons = page.locator('.member-permissions-trigger');
            expect(await buttons.count()).toBeGreaterThan(0);
            expect(new Set(await buttons.allTextContents())).toEqual(new Set([tr('Quản lý')]));
            await expect(page.locator('.admin-role-badge')).toHaveCount(0);
            const widths = await buttons.evaluateAll(items => items.map(item => item.getBoundingClientRect().width));
            expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1);
            for (const label of ['Thêm thành viên', 'Tạo từ CSV', 'Quản lý hàng loạt']) {
              await page.getByRole('button', { name: tr(label), exact: true }).click();
              const modal = page.getByRole('dialog');
              await expect(modal).toBeVisible();
              await auditControls(page, `${locale} ${label} ${width}`);
              if (label === 'Quản lý hàng loạt') for (const mode of ['Cấp quyền', 'Thu hồi quyền', 'Đặt lại mật khẩu', 'Vô hiệu hóa', 'Xóa vĩnh viễn']) {
                await modal.getByRole('button', { name: tr(mode), exact: true }).click();
                await expect(modal.locator('[aria-busy="true"]')).toHaveCount(0);
                await auditControls(page, `${locale} bulk ${mode} ${width}`);
              }
              await modal.getByRole('button', { name: tr('Đóng hộp thoại'), exact: true }).click();
              await expect(modal).toHaveCount(0);
            }
          }
        }
        await page.goto('/');
        for (const [section, label] of [['research', 'Chỉnh sửa ảnh hướng nghiên cứu'], ['moments', 'Chỉnh sửa ảnh khoảnh khắc']]) {
          await page.locator(`[data-deferred-section="${section}"]`).scrollIntoViewIfNeeded();
          await page.getByRole('button', { name: tr(label), exact: true }).click();
          const modal = page.getByRole('dialog');
          await expect(modal).toBeVisible();
          await auditControls(page, `${locale} ${section} editor ${width}`);
          if (width >= 768) {
            const upload = modal.locator('.moments-editor__library-actions [data-file-picker] button');
            const label = upload.locator('span');
            const textHeight = await label.evaluate(element => element.getBoundingClientRect().height);
            const lineHeight = await label.evaluate(element => parseFloat(getComputedStyle(element).lineHeight));
            expect(textHeight).toBeLessThanOrEqual(lineHeight + 1);
          }
          await modal.screenshot({ path: `/tmp/nexus-${section}-${locale}-${width}.png` });
          await modal.getByRole('button', { name: tr('Hủy'), exact: true }).click();
          await expect(modal).toHaveCount(0);
        }
      }
    } finally { await database.homeMomentsGallery.deleteMany(); }
  });
}
