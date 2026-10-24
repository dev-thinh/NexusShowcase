import { expect, test } from './fixtures';

test('empty galleries, cards and members share the same missing-image component', async ({ page, database }) => {
  await database.homeMomentsGallery.deleteMany();
  await page.goto('/');
  await page.locator('[data-deferred-section="research"]').scrollIntoViewIfNeeded();
  await expect(page.locator('.research-directions [data-media-placeholder]')).toHaveCount(3);
  await page.locator('[data-deferred-section="moments"]').scrollIntoViewIfNeeded();
  await expect(page.locator('.moments-wall [data-media-placeholder]')).toHaveCount(1);
  await page.goto('/explore');
  await expect(page.locator('[data-media-placeholder]').first()).toBeVisible();
  await page.goto('/members');
  await expect(page.locator('[data-media-placeholder]').first()).toBeVisible();
});

test('a broken post image recovers into the shared placeholder', async ({ page, database }) => {
  const item = await database.showcaseItem.findFirstOrThrow({ where: { status: 'PUBLISHED', visibility: 'PUBLIC' }, select: { id: true, slug: true, title: true, thumbnailUrl: true } });
  try {
    await database.showcaseItem.update({ where: { id: item.id }, data: { thumbnailUrl: '/uploads/thumbnails/missing-image-test.png' } });
    await page.goto(`/showcase/${item.slug}`);
    await expect(page.getByRole('img', { name: `Hình minh họa: ${item.title}: Chưa có ảnh`, exact: true })).toHaveAttribute('data-media-placeholder', 'true');
  } finally {
    await database.showcaseItem.update({ where: { id: item.id }, data: { thumbnailUrl: item.thumbnailUrl } });
  }
});
