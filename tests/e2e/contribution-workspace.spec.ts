import { expect, login, test } from './fixtures';

test('contributed works appear read-only and author presentation is consistent in cards and detail', async ({ page, database, fixture }) => {
  const participant = fixture.users[3];
  const item = await database.showcaseItem.findFirstOrThrow({ where: { status: 'PUBLISHED', creatorId: fixture.users[1].id } });
  await database.showcaseItem.update({ where: { id: item.id }, data: { issuer: 'Hội nghị nghiên cứu sinh viên · Dữ liệu minh họa' } });
  await database.itemContributor.createMany({ data: [
    { itemId: item.id, userId: participant.id, role: 'CONTRIBUTOR', displayOrder: 10 },
    { itemId: item.id, externalName: 'Tác giả khách mời', externalAffiliation: 'Trường khác', role: 'ADVISOR', displayOrder: 11 },
  ] });
  await login(page, participant);
  await expect(page.getByRole('heading', { level: 1, name: 'Công trình của tôi', exact: true })).toBeVisible();
  const work = page.locator('article').filter({ hasText: item.title });
  await expect(work).toBeVisible();
  await expect(work.getByRole('link', { name: /Soạn bản cập nhật|Chỉnh sửa/ })).toHaveCount(0);
  await work.getByRole('link', { name: 'Xem bài', exact: true }).click();
  await expect(page.getByText('Hội nghị nghiên cứu sinh viên · Dữ liệu minh họa', { exact: true })).toHaveCount(0);
  const author = page.locator('main p a').filter({ hasText: 'Benchmark Member 003' }).first();
  await expect(author).toHaveCSS('font-weight', '400');
  await author.hover();await expect(author).toHaveCSS('font-weight', '600');
  await expect(page.locator('p [title="Tác giả ngoài CLB"]').first()).toBeVisible();
  await page.goto(`/explore?q=${encodeURIComponent(item.title)}`);
  const card = page.locator('article').filter({ hasText: item.title });
  const external = card.locator('[title="Tác giả ngoài CLB"]');
  await expect(external).toBeVisible();
  await expect(external).toHaveCSS('text-decoration-style', 'dotted');
  await expect(external).toHaveCSS('font-weight', '400');
  await external.hover();await expect(external).toHaveCSS('font-weight', '400');
  await expect(external).toHaveCSS('cursor', 'default');
  await expect(card.getByText('Hội nghị nghiên cứu sinh viên · Dữ liệu minh họa')).toHaveCount(0);
  const cardAuthor = card.getByRole('link', { name: 'Benchmark Member 003', exact: true });
  await expect(cardAuthor).toHaveCSS('font-weight', '400');
  await cardAuthor.hover();await expect(cardAuthor).toHaveCSS('font-weight', '600');
});
