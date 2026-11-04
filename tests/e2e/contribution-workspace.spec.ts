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
  await page.goto(`${item.type === 'PROJECT' ? '/category/robotics-iot' : '/category/bai-bao-khoa-hoc'}?q=${encodeURIComponent(item.title)}`);
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

for (const width of [390, 1440]) {
  test(`contributor follows draft and review stages without author actions at ${width}px`, async ({ page, database, fixture }) => {
    await page.setViewportSize({ width, height: 1000 });
    const participant = fixture.users[3];
    const item = await database.showcaseItem.create({ data: {
      creatorId: fixture.users[1].id, slug: `contributor-tracking-${width}`, title: `Theo dõi đóng góp ${width}`, summary: 'Theo dõi giai đoạn xử lý',
      status: 'DRAFT', contributors: { create: { userId: participant.id, role: 'CONTRIBUTOR' } },
    } });
    await login(page, participant);
    for (const [status, label] of [['DRAFT', 'Bản nháp'], ['PENDING_REVIEW', 'Chờ duyệt']] as const) {
      await database.showcaseItem.update({ where: { id: item.id }, data: { status } });
      await page.goto(`/dashboard?filter=${status}&q=${encodeURIComponent(item.title)}`);
      const work = page.locator('article').filter({ hasText: item.title });
      await expect(work).toBeVisible();
      await expect(work.getByText(label, { exact: true })).toBeVisible();
      await expect(work.getByText('Chỉ theo dõi', { exact: true })).toBeVisible();
      await expect(work.getByRole('link', { name: /Chỉnh sửa|Xem trước|Soạn bản cập nhật/ })).toHaveCount(0);
      await expect(work.getByRole('button', { name: /Rút bài/ })).toHaveCount(0);
    }
    await database.showcaseItem.update({ where: { id: item.id }, data: { status: 'PUBLISHED' } });
    await page.goto(`/dashboard?filter=PUBLISHED&q=${encodeURIComponent(item.title)}`);
    const work = page.locator('article').filter({ hasText: item.title });
    await expect(work.getByRole('link', { name: 'Xem bài', exact: true })).toBeVisible();
  });
}
