import { acknowledgeSuccess, expect, login, test } from './fixtures';

test('admin selects multiple accounts, disables them, permanently deletes them and can delete retained posts', async ({ page, fixture, database }) => {
  const users = await Promise.all([1, 2].map(index => database.user.create({ data: { fullName: `Lifecycle bulk fixture ${index}`, email: `lifecycle-bulk-${index}@test.invalid`, role: 'MEMBER', status: 'ACTIVE' } })));
  const post = await database.showcaseItem.create({ data: { title: 'Lifecycle retained post fixture', slug: 'lifecycle-retained-post-fixture', summary: 'Preserve this post', creatorId: users[0].id, status: 'PUBLISHED', visibility: 'PUBLIC', contributors: { create: { userId: users[0].id, role: 'FIRST_AUTHOR' } } } });
  try {
    await login(page, fixture.users[0], '/admin/members?q=Lifecycle%20bulk%20fixture');
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    for (const mode of ['Vô hiệu hóa', 'Xóa vĩnh viễn']) {
      await page.getByRole('button', { name: 'Quản lý hàng loạt', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Quản lý tài khoản hàng loạt', exact: true });
      await dialog.getByRole('button', { name: mode, exact: true }).click();
      await dialog.getByRole('searchbox', { name: 'Tìm tài khoản để quản lý' }).fill('Lifecycle bulk fixture');
      await dialog.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
      await expect(dialog.getByText('2 thành viên · Trang 1/1', { exact: true })).toBeVisible();
      await dialog.getByLabel('Chọn cả trang này', { exact: true }).check();
      await dialog.getByRole('button', { name: 'Xem lại 2 thành viên', exact: true }).click();
      const confirm = dialog.getByRole('button', { name: 'Xác nhận (2)', exact: true });
      if (mode === 'Xóa vĩnh viễn') {
        await expect(confirm).toBeDisabled();
        await dialog.getByLabel('Nhập DELETE để xác nhận').fill('DELETE');
      }
      await confirm.click();
      await acknowledgeSuccess(page);
      await expect(dialog).toHaveCount(0);
      if (mode === 'Vô hiệu hóa') await expect.poll(() => database.user.count({ where: { id: { in: users.map(user => user.id) }, status: 'SUSPENDED' } })).toBe(2);
    }
    await expect.poll(() => database.user.count({ where: { id: { in: users.map(user => user.id) } } })).toBe(0);
    expect(await database.itemContributor.findFirst({ where: { itemId: post.id } })).toMatchObject({ userId: null, externalName: users[0].fullName });
    await page.goto('/admin/works?q=Lifecycle%20retained%20post%20fixture');
    await page.getByRole('button', { name: `Xóa bài đăng ${post.title}`, exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Xóa vĩnh viễn', exact: true }).click();
    await expect.poll(() => database.showcaseItem.count({ where: { id: post.id } })).toBe(0);
  } finally {
    await database.showcaseItem.deleteMany({ where: { id: post.id } });
    await database.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } });
  }
});

test('permissions menu can permanently delete an individual disabled account', async ({ page, fixture, database }) => {
  const user = await database.user.create({ data: { fullName: 'Individual account deletion fixture', email: 'individual-delete@test.invalid', role: 'MEMBER', status: 'SUSPENDED', deletedAt: new Date() } });
  try {
    await login(page, fixture.users[0], `/admin/members?q=${encodeURIComponent(user.fullName)}`);
    await page.getByRole('button', { name: `Quản lý tài khoản ${user.fullName}`, exact: true }).click();
    await page.getByRole('button', { name: `Xóa tài khoản ${user.fullName}`, exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Xác nhận xóa tài khoản', exact: true });
    await expect(dialog.getByRole('button', { name: 'Xóa vĩnh viễn', exact: true })).toBeDisabled();
    await dialog.getByLabel('Nhập DELETE để xác nhận').fill('DELETE');
    await dialog.getByRole('button', { name: 'Xóa vĩnh viễn', exact: true }).click();
    await acknowledgeSuccess(page);
    await expect.poll(() => database.user.count({ where: { id: user.id } })).toBe(0);
  } finally { await database.user.deleteMany({ where: { id: user.id } }); }
});
