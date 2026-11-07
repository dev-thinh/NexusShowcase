import { expect, seedPhotoGalleries, test } from './fixtures';

test.beforeEach(async ({ database }) => { await seedPhotoGalleries(database); });
test.afterEach(async ({ database }) => { await database.homeMomentsGallery.deleteMany(); });

test('photo lanes resume after closing the viewer without leaving scrollbars', async ({ page }) => {
  await page.goto('/');
  const wall = page.locator('.moments-wall');
  await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
  await expect(wall).toBeVisible();
  await wall.scrollIntoViewIfNeeded();
  const photo = wall.getByRole('button', { name: 'Xem ảnh: Cùng nhau tìm lời giải', exact: true }).first();
  for (const close of ['button', 'Escape']) {
    await wall.locator('.moments-lane').first().hover();
    await photo.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    if (close === 'Escape') await page.keyboard.press('Escape');
    else await page.getByRole('button', { name: 'Đóng hộp thoại' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(photo).toBeFocused();
    await wall.getByRole('heading').hover();
    for (const lane of await wall.locator('.moments-lane').all()) {
      await expect(lane).toHaveCSS('overflow-x', 'hidden');
      const track = lane.locator('.moments-track');
      await expect(track).toHaveCSS('animation-name', 'moments-drift');
      await expect(track).toHaveCSS('animation-play-state', 'running');
      const initialTransform = await track.evaluate(element => getComputedStyle(element).transform);
      await expect.poll(() => track.evaluate(element => getComputedStyle(element).transform)).not.toBe(initialTransform);
    }
  }
});

test('photo wall moves, pauses and opens an accessible viewer', async ({ page }) => {
  await page.goto('/');
  const wall = page.getByRole('region', { name: 'Khoảnh khắc sáng tạo' });
  await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
  await expect(wall).toBeVisible();
  await wall.scrollIntoViewIfNeeded();
  const lane = wall.locator('.moments-lane').first();
  const track = lane.locator('.moments-track');
  await expect(track).toHaveCSS('animation-name', 'moments-drift');
  await lane.hover();
  await expect(track).toHaveCSS('animation-play-state', 'paused');
  await wall.getByRole('button', { name: 'Tạm dừng chuyển động' }).click();
  await expect(wall).toHaveAttribute('data-paused', 'true');
  const photo = wall.getByRole('button', { name: 'Xem ảnh: Cùng nhau tìm lời giải', exact: true }).first();
  await photo.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('img')).toHaveAttribute('alt', 'Cùng nhau tìm lời giải');
  await dialog.getByRole('button', { name: 'Ảnh tiếp theo' }).click();
  await expect(dialog.getByRole('img')).toHaveAttribute('alt', 'Bắt đầu từ những chi tiết nhỏ');
  await page.keyboard.press('ArrowLeft');
  await expect(dialog.getByRole('img')).toHaveAttribute('alt', 'Cùng nhau tìm lời giải');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(photo).toBeFocused();
  await expect(wall).toHaveAttribute('data-paused', 'true');
  await wall.getByRole('button', { name: 'Tiếp tục chuyển động' }).click();
  await expect(wall).not.toHaveAttribute('data-paused', 'true');
  await wall.screenshot({ path: 'test-results/home-moments-desktop.png' });
});

test('photo wall supports manual browsing on mobile and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const wall = page.locator('.moments-wall');
  await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
  await expect(wall).toBeVisible();
  await wall.scrollIntoViewIfNeeded();
  await expect(wall.locator('.moments-track').first()).toHaveCSS('animation-name', 'none');
  await expect(wall.locator('.moments-group[aria-hidden="true"]').first()).toBeHidden();
  const lane = wall.locator('.moments-lane').first();
  await lane.evaluate(element => { element.scrollLeft = 200; });
  expect(await lane.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const brokenImages = await wall.locator('img').evaluateAll(images => images.filter(img => img instanceof HTMLImageElement && img.complete && img.naturalWidth === 0).length);
  expect(brokenImages).toBe(0);
  await wall.screenshot({ path: 'test-results/home-moments-mobile.png' });
});

test('keyboard browsing remains available and ends when the viewer closes', async ({ page }) => {
  await page.goto('/');
  const wall = page.locator('.moments-wall');
  await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
  await expect(wall).toBeVisible();
  await wall.scrollIntoViewIfNeeded();
  await wall.getByRole('button', { name: 'Tạm dừng chuyển động' }).focus();
  await page.keyboard.press('Tab');
  await expect(wall).toHaveAttribute('data-keyboard-browsing', 'true');
  await expect(wall.locator('.moments-track').first()).toHaveCSS('animation-name', 'none');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(wall).not.toHaveAttribute('data-keyboard-browsing', 'true');
  await expect(wall.locator('.moments-track').first()).toHaveCSS('animation-name', 'moments-drift');
});

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`mobile lanes scroll and retain position after closing photos (${reducedMotion})`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion });
    await page.goto('/');
    await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
    const lane = page.locator('.moments-lane').first();
    await expect(lane).toHaveCSS('overflow-x', 'auto');
    await expect(lane.locator('.moments-track')).toHaveCSS('animation-name', 'none');
    await lane.evaluate(element => { element.scrollLeft = 150; });
    await expect.poll(() => lane.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
    await lane.locator(reducedMotion === 'reduce' ? '.moments-group:not([aria-hidden]) .moment-photo' : '.moments-group:nth-child(2) .moment-photo').nth(1).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Đóng hộp thoại' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect.poll(() => lane.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('centers a single moment on mobile', async ({ page, database }) => {
  const gallery = await database.homeMomentsGallery.findUniqueOrThrow({ where: { id: 'home' } });
  const photos = gallery.photos as Array<Record<string, import('@prisma/client').Prisma.JsonValue>>;
  await database.homeMomentsGallery.update({ where: { id: 'home' }, data: { photos: [{ ...photos[0], visible: true, slot: 0 }] } });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
  const lane = page.locator('.moments-lane[data-photo-count="1"]');
  const group = lane.locator('.moments-group');
  await expect(group).toHaveCSS('justify-content', 'center');
  const centers = await lane.evaluate(element => {
    const lane = element.getBoundingClientRect();
    const photo = element.querySelector('.moment-photo')!.getBoundingClientRect();
    return { lane: lane.left + lane.width / 2, photo: photo.left + photo.width / 2 };
  });
  expect(Math.abs(centers.lane - centers.photo)).toBeLessThan(2);
});

test('research photos fill consistent 4:3 frames on mobile and glow on desktop hover', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('[data-deferred-section="research"]').scrollIntoViewIfNeeded();
  const images = page.locator('.research-direction__photo img');
  await expect(images).toHaveCount(3);
  for (const image of await images.all()) {
    await expect(image).toHaveCSS('object-fit', 'cover');
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
    const ratio = await image.evaluate(element => { const frame = element.closest('.research-direction__photo')!; return frame.clientWidth / frame.clientHeight; });
    expect(Math.abs(ratio - 4 / 3)).toBeLessThan(0.02);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  const card = page.locator('.research-direction').first();
  await card.hover();
  const orbit = () => card.locator('.research-direction__photo').evaluate(element => getComputedStyle(element, '::before').animationName);
  await expect.poll(orbit).toBe('research-border-orbit');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(orbit).toBe('none');
});


test('blocks native image and button dragging while preserving text selection', async ({ page }) => {
  await page.goto('/');
  const logo = page.locator('.home-hero__art img');
  const action = page.locator('.home-hero__primary-action');
  for (const element of [logo, action]) {
    expect(await element.evaluate(element => element.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true })))).toBe(false);
  }
  const copy = page.locator('.home-hero__copy');
  expect(await copy.evaluate(element => element.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true })))).toBe(true);
  await expect(action).toBeVisible();
  const selectionResult = await action.evaluate(element => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection()!;
    selection.removeAllRanges(); selection.addRange(range);
    return { selected: selection.toString().trim(), text: element.textContent, range: range.toString(), select: getComputedStyle(element).userSelect, visibility: getComputedStyle(element).visibility };
  });
  expect(selectionResult.selected, JSON.stringify(selectionResult)).not.toBe('');
  expect(await action.evaluate(element => getComputedStyle(element).userSelect)).not.toBe('none');
});


test('cover frames keep their width in grid and flex cards on desktop and mobile', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/projects', '/research', '/']) {
      await page.goto(route);
      if (route === '/') await page.locator('[data-deferred-section="featured"]').scrollIntoViewIfNeeded();
      const media = page.locator('.publication-card__media').first();
      await expect(media).toBeVisible();
      const dimensions = () => media.evaluate(element => {
        const frame = element.querySelector('.publication-cover-frame, .home-featured-image-frame') ?? element;
        return { width: frame.clientWidth, height: frame.clientHeight };
      });
      await expect.poll(async () => (await dimensions()).width, { message: `${route} at ${width}px` }).toBeGreaterThan(100);
      await expect.poll(async () => (await dimensions()).height, { message: `${route} at ${width}px` }).toBeGreaterThan(50);
      await expect.poll(async () => { const size = await dimensions(); return Math.abs(size.width / size.height - 4 / 3); }).toBeLessThan(0.03);
    }
  }
});


test('mobile lanes keep drifting and wrap manual scrolling in both directions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
  const lane = page.locator('.moments-lane[data-motion="true"]').first();
  await expect(lane).toBeVisible();
  const initial = await lane.evaluate(element => element.scrollLeft);
  await expect.poll(() => lane.evaluate(element => element.scrollLeft)).toBeGreaterThan(initial + 5);
  await page.getByRole('button', { name: 'Tạm dừng chuyển động', exact: true }).click();
  const paused = await lane.evaluate(element => element.scrollLeft);
  await page.waitForTimeout(200);
  expect(await lane.evaluate(element => element.scrollLeft)).toBe(paused);
  for (const edge of ['start', 'end']) {
    await lane.evaluate((element, edge) => { element.scrollLeft = edge === 'start' ? 0 : element.scrollWidth; }, edge);
    await expect.poll(() => lane.evaluate(element => {
      const period = element.querySelector('.moments-group')!.getBoundingClientRect().width;
      return element.scrollLeft >= period / 2 && element.scrollLeft <= period * 1.5;
    })).toBe(true);
  }
  await page.getByRole('button', { name: 'Tiếp tục chuyển động', exact: true }).click();
  const resumed = await lane.evaluate(element => element.scrollLeft);
  await expect.poll(() => lane.evaluate(element => element.scrollLeft)).toBeGreaterThan(resumed + 5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('enlarges desktop moment frames while retaining the current mobile dimensions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
  for (const [viewport, expected] of [[390, '264px'], [1440, '336px']] as const) {
    await page.setViewportSize({ width: viewport, height: 900 });
    await expect(page.locator('.moment-photo--wide').first()).toHaveCSS('width', expected);
  }
});

test('uniformly uploaded moments have stable mixed paper-photo poses across loop copies', async ({ page, database }) => {
  const gallery = await database.homeMomentsGallery.findUniqueOrThrow({ where: { id: 'home' } });
  const photos = gallery.photos as Array<Record<string, import('@prisma/client').Prisma.JsonValue>>;
  await database.homeMomentsGallery.update({ where: { id: 'home' }, data: { photos: photos.map(photo => ({ ...photo, tilt: '-2deg' })) } });
  // Hold the deferred response to exercise the slow-network path explicitly.
  let release!: () => void;
  const responseGate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/home/moments', async route => {
    await responseGate;
    await route.continue();
  });
  const section = page.locator('[data-deferred-section="moments"]');
  try {
    await page.goto('/');
    await section.scrollIntoViewIfNeeded();
    await expect(section).not.toHaveAttribute('data-state', 'ready');
  } finally { release(); }
  await expect(section).toHaveAttribute('data-state', 'ready');
  const expectedIds = photos.filter(photo => photo.visible === true && typeof photo.slot === 'number' && photo.slot < 6)
    .sort((a, b) => Number(a.slot) - Number(b.slot)).map(photo => String(photo.id));
  expect(expectedIds.length).toBeGreaterThanOrEqual(3);
  const lane = page.locator('.moments-lane').first();
  await expect(lane.locator('.moments-group').first().locator('.moment-photo')).toHaveCount(expectedIds.length);
  const poses = await lane.locator('.moments-group').first().locator('.moment-photo').evaluateAll(elements => elements.map(element => ({ id: (element as HTMLElement).dataset.photoId, tilt: (element as HTMLElement).style.getPropertyValue('--photo-tilt'), offset: (element as HTMLElement).style.getPropertyValue('--photo-offset') })));
  expect(poses.map(pose => pose.id)).toEqual(expectedIds);
  expect(poses.some(pose => parseFloat(pose.tilt) > 0)).toBe(true);
  expect(poses.some(pose => parseFloat(pose.tilt) < 0)).toBe(true);
  expect(new Set(poses.map(pose => pose.tilt)).size).toBeGreaterThan(2);
  const copy = await lane.locator('.moments-group').nth(1).locator('.moment-photo').evaluateAll(elements => elements.map(element => ({ id: (element as HTMLElement).dataset.photoId, tilt: (element as HTMLElement).style.getPropertyValue('--photo-tilt'), offset: (element as HTMLElement).style.getPropertyValue('--photo-offset') })));
  expect(copy).toEqual(poses);
});

test('sparse moment rows distribute the same horizontal spacing within a group and across its loop seam', async ({ page, database }) => {
  const gallery = await database.homeMomentsGallery.findUniqueOrThrow({ where: { id: 'home' } });
  const photos = gallery.photos as Array<Record<string, import('@prisma/client').Prisma.JsonValue>>;
  await database.homeMomentsGallery.update({ where: { id: 'home' }, data: { photos: photos.slice(0, 3).map((photo, index) => ({ ...photo, slot: index })) } });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const gaps = await page.locator('.moments-lane').first().evaluate(element => {
      const photos = [...element.querySelectorAll<HTMLElement>('.moments-group:first-child .moment-photo')];
      const next = element.querySelector<HTMLElement>('.moments-group:nth-child(2) .moment-photo')!;
      return photos.map((photo, index) => {
        const following = photos[index + 1] ?? next;
        return following.offsetLeft - photo.offsetLeft - photo.offsetWidth;
      });
    });
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThanOrEqual(2);
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(15);
  }
});
