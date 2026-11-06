import sharp from 'sharp';
import { expect, login, test } from './fixtures';

test.use({ hasTouch: true });

const landscape = async () => sharp({ create: { width: 1200, height: 800, channels: 3, background: '#ff0000' } }).composite([
  { input: await sharp({ create: { width: 400, height: 800, channels: 3, background: '#00ff00' } }).png().toBuffer(), left: 400, top: 0 },
  { input: await sharp({ create: { width: 400, height: 800, channels: 3, background: '#0000ff' } }).png().toBuffer(), left: 800, top: 0 },
]).png().toBuffer();

for (const width of [390, 1440]) {
  test(`positions, zooms, cancels and saves a matching square avatar at ${width}px`, async ({ page, fixture, database }) => {
    await page.setViewportSize({ width, height: 900 });
    const member = fixture.users[3];
    const previous = (await database.user.findUniqueOrThrow({ where: { id: member.id } })).avatarUrl;
    await login(page, member, `/members/${member.id}`);
    let requests = 0;
    let bytes: Buffer | undefined;
    let reject = true;
    await page.route('**/api/upload?target=avatar', async route => {
      requests++;
      const form = await new Response(new Uint8Array(route.request().postDataBuffer()!).buffer, { headers: { 'Content-Type': route.request().headers()['content-type'] } }).formData();
      const file = form.get('file') as File;
      bytes = Buffer.from(await file.arrayBuffer());
      await route.fulfill({ status: reject ? 500 : 200, contentType: 'application/json', body: JSON.stringify(reject ? { error: 'Không đổi được ảnh. Vui lòng thử lại.' } : { url: '/uploads/thumbnails/avatar-crop-fixture.jpg' }) });
    });
    await page.route('**/uploads/thumbnails/avatar-crop-fixture.jpg*', route => route.fulfill({ status: 200, contentType: 'image/jpeg', body: bytes! }));
    const file = { name: 'landscape.png', mimeType: 'image/png', buffer: await landscape() };
    const open = async () => {
      await page.getByRole('button', { name: 'Tùy chọn ảnh đại diện', exact: true }).click();
      await page.getByLabel('Chọn ảnh đại diện mới', { exact: true }).setInputFiles(file);
    };
    await open();
    const modal = page.getByRole('dialog', { name: 'Căn chỉnh ảnh đại diện', exact: true });
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Lưu ảnh đại diện', exact: true })).toBeEnabled();
    await modal.screenshot({ path: `/tmp/nexus-avatar-crop-${width}.png` });
    expect(requests).toBe(0);
    await modal.getByRole('button', { name: 'Hủy', exact: true }).click();
    await expect(modal).toHaveCount(0);
    expect((await database.user.findUniqueOrThrow({ where: { id: member.id } })).avatarUrl).toBe(previous);
    await open();
    const slider = modal.getByRole('slider', { name: 'Độ phóng đại', exact: true });
    await expect(slider).toBeEnabled();
    await slider.focus(); await slider.press('End');
    await expect(slider).toHaveValue('4');
    await modal.getByRole('button', { name: 'Đặt lại', exact: true }).click();
    await expect(slider).toHaveValue('1');
    await slider.focus(); await slider.press('End');
    const stage = modal.getByRole('group', { name: 'Vùng căn chỉnh ảnh đại diện', exact: true });
    const image = stage.getByRole('img');
    const before = await image.getAttribute('style');
    const box = (await stage.boundingBox())!;
    if (width === 390) {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x + box.width * 0.7, y: box.y + box.height / 2 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await cdp.detach();
    } else {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down(); await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2, { steps: 5 }); await page.mouse.up();
    }
    await expect(image).not.toHaveAttribute('style', before!);
    await stage.focus();
    for (let i = 0; i < 40; i++) await stage.press('Shift+ArrowRight');
    await modal.getByRole('button', { name: 'Lưu ảnh đại diện', exact: true }).click();
    await expect(modal.getByRole('alert')).toContainText('Không đổi được ảnh');
    await expect(slider).toHaveValue('4');
    expect(requests).toBe(1);
    const metadata = await sharp(bytes!).metadata();
    expect([metadata.width, metadata.height]).toEqual([1024, 1024]);
    const colors = await sharp(bytes!).stats();
    expect(colors.channels[0].mean).toBeGreaterThan(240);
    expect(colors.channels[1].mean).toBeLessThan(15);
    expect(colors.channels[2].mean).toBeLessThan(15);
    reject = false;
    await modal.getByRole('button', { name: 'Lưu ảnh đại diện', exact: true }).click();
    await expect(modal).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Tùy chọn ảnh đại diện', exact: true }).locator('img')).toHaveAttribute('src', /avatar-crop-fixture/);
    expect(requests).toBe(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
