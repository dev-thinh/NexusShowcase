import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { acknowledgeSuccess, expect, login, test } from './fixtures';

const createdItems: string[] = [];
test.afterEach(async ({ database }) => {
  await database.showcaseItem.deleteMany({ where: { id: { in: createdItems } } });
  createdItems.length = 0;
});

test('admin directly approves a submission and preserves live content until update approval', async ({ page, fixture, database, browser, baseURL }) => {
  const author = fixture.users[1];
  const slug = `browser-approval-${randomUUID()}`;
  const category = await database.category.findUniqueOrThrow({ where: { slug: 'robotics-iot' } });
  const snapshot = { type: 'PROJECT', categoryId: category.id, title: 'Browser first publication', summary: 'Synthetic browser approval fixture.', content: '', publishedYear: 2026, suggestedField: '', customProjectType: '', contributors: [{ userId: author.id, displayName: 'Benchmark Member 001', role: 'CONTRIBUTOR', displayOrder: 0 }], resources: [] };
  const item = await database.showcaseItem.create({ data: { title: snapshot.title, slug, summary: snapshot.summary, creatorId: author.id, categoryId: category.id, status: 'PENDING_REVIEW', reviewVersion: 1, revisions: { create: { revisionNumber: 1, snapshot, submittedById: author.id } } } });
  createdItems.push(item.id);
  await login(page, fixture.users[0], `/admin/reviews/${item.id}`);
  const diagnostic = { pageErrors: [] as string[], posts: [] as Array<{ status: number; redirect: string | null; contentType: string | null; bodyReadable: boolean; bytes: number | null }>, failedRequests: [] as Array<{ method: string; path: string; error: string | null }> };
  page.on('pageerror', error => { diagnostic.pageErrors.push(error.name); });
  page.on('response', response => {
    if (response.request().method() !== 'POST') return;
    const entry = { status: response.status(), redirect: response.headers()['x-action-redirect'] ?? null, contentType: response.headers()['content-type'] ?? null, bodyReadable: false, bytes: null as number | null };
    diagnostic.posts.push(entry);
    // Redirect bodies may be unavailable to Playwright; this is not a completion signal.
    void response.body().then(body => { entry.bodyReadable = true; entry.bytes = body.byteLength; }, () => {});
  });
  page.on('requestfailed', request => diagnostic.failedRequests.push({ method: request.method(), path: new URL(request.url()).pathname, error: request.failure()?.errorText ?? null }));
  async function approve(expectedTitle: string) {
    const started = Date.now();
    await page.getByRole('switch').check();
    await page.getByRole('button', { name: 'Duyệt và xuất bản', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Xuất bản', exact: true }).click();
    try {
      await expect.poll(async () => database.showcaseItem.findUniqueOrThrow({ where: { id: item.id }, select: { status: true, reviewStatus: true, title: true } }), { message: 'approval persists the published snapshot' }).toEqual({ status: 'PUBLISHED', reviewStatus: null, title: expectedTitle });
      await acknowledgeSuccess(page, 'Đã duyệt và xuất bản công trình.');
      await expect(page).toHaveURL(/\/admin\/reviews$/);
    } catch (error) {
      const state = await database.showcaseItem.findUniqueOrThrow({ where: { id: item.id }, select: { status: true, reviewStatus: true, reviewVersion: true } });
      console.log(`[browser-diagnostic] ${JSON.stringify({ ...diagnostic, state })}`);
      throw error;
    }
    if (!page.url().endsWith('/admin/reviews')) {
      const events = readFileSync(process.env.HARNESS_EVENTS!, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line) as { name: string; timestamp: number; durationMs: number }).filter(event => event.timestamp >= started);
      const queries = events.filter(event => event.name === 'query');
      const state = await database.showcaseItem.findUniqueOrThrow({ where: { id: item.id }, select: { status: true, reviewStatus: true, reviewVersion: true } });
      console.log(`[browser-diagnostic] ${JSON.stringify({ ...diagnostic, state, windowQueryCount: queries.length, windowQueryMs: queries.reduce((total, event) => total + event.durationMs, 0), windowAuthMs: events.filter(event => event.name === 'auth').reduce((total, event) => total + event.durationMs, 0) })}`);
    }
  }
  await expect(page.getByRole('heading', { name: snapshot.title, exact: true })).toBeVisible();
  await approve(snapshot.title);
  const publicContext = await browser.newContext({ baseURL });
  try {
    const visitor = await publicContext.newPage();
    await visitor.goto(`/showcase/${slug}`);
    await expect(visitor.getByRole('heading', { name: snapshot.title, exact: true })).toBeVisible();
    const update = { ...snapshot, title: 'Browser approved update' };
    await database.showcaseItem.update({ where: { id: item.id }, data: { reviewStatus: 'PENDING_REVIEW', reviewVersion: 2, authorDraft: update, revisions: { create: { revisionNumber: 2, snapshot: update, submittedById: author.id } } } });
    await visitor.reload();
    await expect(visitor.getByRole('heading', { name: snapshot.title, exact: true })).toBeVisible();
    await expect(visitor.getByRole('heading', { name: update.title, exact: true })).toHaveCount(0);
    await page.goto(`/admin/reviews/${item.id}`);
    await expect(page.getByRole('heading', { name: update.title, exact: true })).toBeVisible();
    await approve(update.title);
    await visitor.reload();
    await expect(visitor.getByRole('heading', { name: update.title, exact: true })).toBeVisible();
  } finally { await publicContext.close(); }
});

test('admin requests revision and rejects through form decisions', async ({ page, fixture, database }) => {
  const author = fixture.users[1];
  const item = await database.showcaseItem.create({ data: { title: 'Browser feedback fixture', slug: `browser-feedback-${randomUUID()}`, summary: 'Pending feedback', creatorId: author.id, status: 'PENDING_REVIEW', reviewVersion: 1 } });
  createdItems.push(item.id);
  await login(page, fixture.users[0], `/admin/reviews/${item.id}`);
  await page.getByRole('button', { name: 'Yêu cầu chỉnh sửa', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Nội dung yêu cầu chỉnh sửa', { exact: false }).fill('Clarify the submitted results.');
  await page.getByRole('dialog').getByRole('button', { name: 'Gửi yêu cầu chỉnh sửa', exact: true }).click();
  await acknowledgeSuccess(page, 'Đã gửi yêu cầu chỉnh sửa cho tác giả.');
  await expect(page).toHaveURL(/\/admin\/reviews$/);
  await expect.poll(async () => database.showcaseItem.findUniqueOrThrow({ where: { id: item.id }, select: { status: true, rejectionReason: true } })).toEqual({ status: 'REVISION_REQUESTED', rejectionReason: 'Clarify the submitted results.' });
  await database.showcaseItem.update({ where: { id: item.id }, data: { status: 'PENDING_REVIEW' } });
  await page.goto(`/admin/reviews/${item.id}`);
  await page.getByRole('button', { name: 'Từ chối', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Lý do từ chối', { exact: false }).fill('Outside the publication scope.');
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận từ chối', exact: true }).click();
  await acknowledgeSuccess(page, 'Đã từ chối bài đăng.');
  await expect(page).toHaveURL(/\/admin\/reviews$/);
  await expect.poll(async () => database.showcaseItem.findUniqueOrThrow({ where: { id: item.id }, select: { status: true, rejectionReason: true } })).toEqual({ status: 'REJECTED', rejectionReason: 'Outside the publication scope.' });
});
