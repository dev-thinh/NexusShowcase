import { categoryPagePath } from '../../src/shared/lib/page-urls';
import { Prisma } from '@prisma/client';
import { expect, login, test } from './fixtures';

const conference = { name: 'Hội nghị Robotics và Hệ thống nhúng quốc tế với tên dài để kiểm tra hiển thị', status: 'ACCEPTED', eventDate: '2027-03-08', acceptedDate: '2026-12-20', rankings: Array.from({ length: 4 }, (_, index) => ({ system: `Hệ thống đánh giá ${index + 1}`, rank: `Hạng ${index + 1}` })) };

test('conference editor preserves both milestone dates and supports research papers and projects', async ({ page, fixture, database }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const title = 'Conference editor fixture';
  const researchCategory = await database.category.findUniqueOrThrow({ where: { slug: 'bai-bao-khoa-hoc' } });
  const projectCategory = await database.category.findUniqueOrThrow({ where: { slug: 'robotics-iot' } });
  let itemId: string | undefined;
  await login(page, fixture.users[1], '/my-works/new');
  try {
    await expect(page.getByLabel('Bài có thông tin hội nghị')).not.toBeChecked();
    await page.locator('#submission-title').fill(title);
    await page.getByRole('combobox', { name: 'Chuyên mục', exact: true }).click();
    await page.getByRole('option', { name: researchCategory.name, exact: true }).click();
    await page.getByLabel('Bài có thông tin hội nghị').check();
    await page.getByRole('button', { name: 'Lưu bản nháp', exact: true }).click();
    await expect(page.locator('[data-submission-actions]')).toContainText('Đã lưu');
    await expect(page.locator('#conference-name')).toHaveValue('');
    await page.locator('#conference-name').fill(conference.name);
    await page.locator('#conference-date').fill(conference.eventDate);
    await page.locator('#conference-accepted-date').fill(conference.acceptedDate);
    for (let index = 0; index < 2; index++) {
      await page.getByRole('button', { name: 'Thêm xếp hạng', exact: true }).click();
      await page.locator(`#conference-ranking-system-${index}`).fill(conference.rankings[index].system);
      await page.locator(`#conference-ranking-value-${index}`).fill(conference.rankings[index].rank);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const fields = page.locator('#conference-fields');
    await fields.screenshot({ path: '/tmp/nexus-conference-editor-320.png' });
    await page.locator('[data-submission-actions]').getByRole('button', { name: 'Xem trước', exact: true }).click();
    const info = page.getByRole('region', { name: 'Thông tin hội nghị', exact: true });
    await expect(info).toContainText(conference.name);
    await expect(info).toContainText('08/03/2027');
    await page.getByRole('button', { name: 'Soạn thảo', exact: true }).click();
    await page.getByRole('button', { name: 'Lưu bản nháp', exact: true }).click();
    await expect(page.locator('[data-submission-actions]')).toContainText('Đã lưu');
    const item = await database.showcaseItem.findFirstOrThrow({ where: { title, creatorId: fixture.users[1].id } });
    itemId = item.id;
    expect(item.conference).toEqual({ ...conference, rankings: conference.rankings.slice(0, 2) });
    await page.goto(`/my-works/${item.id}/edit`);
    await expect(page.locator('#conference-name')).toHaveValue(conference.name);
    await page.getByRole('button', { name: 'Xóa xếp hạng 2', exact: true }).click();
    await expect(page.locator('#conference-ranking-system-1')).toHaveCount(0);
    await page.getByRole('combobox', { name: 'Chuyên mục', exact: true }).click();
    await page.getByRole('option', { name: projectCategory.name, exact: true }).click();
    await expect(page.getByLabel('Bài có thông tin hội nghị')).toBeChecked();
    await page.getByRole('combobox', { name: 'Trạng thái công bố', exact: true }).click();
    await page.getByRole('option', { name: 'Đã công bố', exact: true }).click();
    await page.locator('#conference-publication-date').fill('2027-03-01');
    await page.locator('[data-submission-actions]').getByRole('button', { name: 'Xem trước', exact: true }).click();
    await expect(info).toContainText('Đã công bố');
    await expect(info).toContainText('01/03/2027');
    await expect(info).not.toContainText('20/12/2026');
    await page.getByRole('button', { name: 'Soạn thảo', exact: true }).click();
    await page.getByRole('button', { name: 'Lưu bản nháp', exact: true }).click();
    await expect(page.locator('[data-submission-actions]')).toContainText('Đã lưu');
    expect((await database.showcaseItem.findUniqueOrThrow({ where: { id: item.id } })).conference).toMatchObject({ status: 'PUBLISHED', acceptedDate: conference.acceptedDate, publicationDate: '2027-03-01' });
    await page.goto(`/my-works/${item.id}/edit`);
    await expect(page.locator('#conference-publication-date')).toHaveValue('2027-03-01');
    await page.getByRole('combobox', { name: 'Trạng thái công bố', exact: true }).click();
    await page.getByRole('option', { name: 'Đã chấp nhận', exact: true }).click();
    await expect(page.locator('#conference-accepted-date')).toHaveValue(conference.acceptedDate);
    await page.getByLabel('Bài có thông tin hội nghị').uncheck();
    await page.getByRole('button', { name: 'Lưu bản nháp', exact: true }).click();
    await expect(page.locator('[data-submission-actions]')).toContainText('Đã lưu');
    expect((await database.showcaseItem.findUniqueOrThrow({ where: { id: item.id } })).conference).toBeNull();
  } finally {
    await database.showcaseItem.deleteMany({ where: itemId ? { id: itemId } : { title, creatorId: fixture.users[1].id } });
  }
});

for (const type of ['RESEARCH_PAPER', 'PROJECT'] as const) test(`conference metadata, dates and unchanged abstracts align with ordinary ${type} cards`, async ({ page, database, fixture }) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await login(page, fixture.users[0], '/');
  const originals = await database.showcaseItem.findMany({ where: { isPinned: true }, orderBy: { publishedAt: 'desc' }, take: 2 });
  expect(originals).toHaveLength(2);
  const slug = type === 'RESEARCH_PAPER' ? 'bai-bao-khoa-hoc' : 'robotics-iot';
  const category = await database.category.findUniqueOrThrow({ where: { slug } });
  const titles = ['Conference alignment ngắn', 'Conference alignment nghiên cứu Robot tự hành và thị giác máy tính với tiêu đề dài'];
  const summary = 'Một tóm tắt nghiên cứu ngắn để so sánh bố cục giữa các thẻ công trình.';
  try {
    for (let index = 0; index < 2; index++) await database.showcaseItem.update({ where: { id: originals[index].id }, data: {
      type, categoryId: category.id, title: titles[index], summary, conference: index === 0 ? conference : Prisma.DbNull,
    } });
    for (const width of [320, 390, 640, 700, 768, 900, 1024, 1100, 1280, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const path of ['/', `${categoryPagePath(slug)}?q=Conference%20alignment`]) {
        await page.goto(path);
        if (path === '/') {
          const section = page.locator('[data-deferred-section="featured"]');
          await section.scrollIntoViewIfNeeded();
          await expect(section).toHaveAttribute('data-state', 'ready');
        }
        const cards = titles.map(title => page.locator('.publication-card').filter({ has: page.getByRole('heading', { name: title, exact: true }) }));
        for (const card of cards) await expect(card).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        const boxes = await Promise.all(cards.map(card => card.boundingBox()));
        const contentBoxes = await Promise.all(cards.map(card => card.locator('.publication-card__content').boundingBox()));
        expect(Math.abs(contentBoxes[0]!.height - contentBoxes[1]!.height)).toBeLessThan(2);
        for (const card of cards) {
          const titleBox = (await card.getByRole('heading').boundingBox())!;
          expect(titleBox.height).toBeLessThanOrEqual(28);
          const summaryBox = (await card.locator('[data-card-description]').boundingBox())!;
          const footerBox = (await card.locator('.publication-card__footer').boundingBox())!;
          expect(footerBox.y - summaryBox.y - summaryBox.height).toBeLessThanOrEqual(12);
        }
        for (const card of cards) {
          await expect(card.locator('[data-card-description]')).toHaveCSS('height', '48px');
          await expect(card.locator('[data-card-description]')).toHaveText(summary);
        }
        const metadata = cards[0].locator('[data-card-conference]');
        await expect(metadata.getByText('+2', { exact: true })).toBeVisible();
        await expect(metadata).toContainText('Đã chấp nhận');
        await expect(metadata).toContainText('20/12/2026');
        await expect(metadata).toContainText('08/03/2027');
        const banner = (await metadata.boundingBox())!;
        expect(Math.abs(boxes[0]!.height - boxes[1]!.height - banner.height)).toBeLessThan(2);
        expect(Math.abs(banner.width - boxes[0]!.width)).toBeLessThan(3);
        expect(Math.abs(banner.y - boxes[0]!.y)).toBeLessThan(2);
        const dates = (await metadata.locator('.conference-card-banner__dates').boundingBox())!;
        expect(Math.abs(banner.x + banner.width - dates.x - dates.width - 12)).toBeLessThan(2);
        const eventTime = (await metadata.locator(`time[datetime="${conference.eventDate}"]`).boundingBox())!;
        const acceptedTime = (await metadata.locator(`time[datetime="${conference.acceptedDate}"]`).boundingBox())!;
        expect(eventTime.x).toBeLessThan(acceptedTime.x);
        if (banner.width >= 900) {
          const ranks = (await metadata.locator('.conference-card-banner__rankings').boundingBox())!;
          expect(ranks.x + ranks.width).toBeLessThanOrEqual(dates.x);
        }
        const media = (await cards[0].locator('.publication-card__media').boundingBox())!;
        expect(media.y).toBeGreaterThanOrEqual(banner.y + banner.height - 1);
        await expect(cards[0].locator('.publication-card-meta')).not.toContainText(conference.name);
        expect(await metadata.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if ((width === 390 || width === 1440) && path !== '/') await cards[0].screenshot({ path: `/tmp/nexus-conference-${type}-${width}.png` });
      }
    }
    await database.showcaseItem.update({ where: { id: originals[0].id }, data: { conference: { ...conference, status: 'PUBLISHED', publicationDate: '2027-03-01' } } });
    await page.goto(`${categoryPagePath(slug)}?q=Conference%20alignment`);
    const metadata = page.locator('[data-card-conference]').filter({ hasText: conference.name });
    await expect(metadata).toContainText('Đã công bố');
    await expect(metadata).toContainText('01/03/2027');
    await expect(metadata).not.toContainText('20/12/2026');
    await page.goto(`/works/${originals[0].slug}`);
    const detail = page.getByRole('region', { name: 'Thông tin hội nghị', exact: true });
    await expect(detail).toContainText(conference.name);
    await expect(detail).toContainText(conference.rankings[3].system);
    await expect(detail).toContainText('01/03/2027');
    await expect(detail).not.toContainText('20/12/2026');
    await page.goto(`/works/${originals[1].slug}`);
    await expect(page.getByRole('heading', { name: titles[1], exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Thông tin hội nghị', exact: true })).toHaveCount(0);
  } finally {
    for (const item of originals) await database.showcaseItem.update({ where: { id: item.id }, data: {
      title: item.title, type: item.type, categoryId: item.categoryId, summary: item.summary, conference: item.conference ?? Prisma.DbNull,
    } });
  }
});
