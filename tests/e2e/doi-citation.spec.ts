import { readFile } from 'node:fs/promises';
import { Prisma } from '@prisma/client';
import { expect, test } from './fixtures';

test('DOI citation uses registered formats, retries errors and caches previously viewed tabs', async ({ page, database }) => {
  const item = await database.showcaseItem.findFirstOrThrow({ where: { status: 'PUBLISHED', visibility: 'PUBLIC' } });
  await database.showcaseItem.update({ where: { id: item.id }, data: { citationEnabled: true, conference: { name: 'Journal', status: 'PUBLISHED', paperUrl: 'https://doi.org/10.1038/nphys1170', publicationDate: '2009-01-01', rankings: [] } } });
  const calls: Record<string, number> = {};
  const citations: Record<string, string> = {
    bibtex: '@article{Aspelmeyer2009,\n  title = {Measured measurement},\n  doi = {10.1038/nphys1170}\n}',
    apa: 'Aspelmeyer, M. (2009). Measured measurement. Nature Physics, 5(1), 11–12. https://doi.org/10.1038/nphys1170',
    ieee: '[1] M. Aspelmeyer, “Measured measurement,” Nature Phys, vol. 5, no. 1, pp. 11–12, Jan. 2009, doi: 10.1038/nphys1170.',
  };
  await page.route('**/api/citation?*', async route => {
    const params = new URL(route.request().url()).searchParams;
    expect(params.get('doi')).toBe('10.1038/nphys1170');
    const style = params.get('style')!; calls[style] = (calls[style] ?? 0) + 1;
    if (style === 'bibtex' && calls[style] === 1) return route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ error: 'Chưa tải được trích dẫn DOI.' }) });
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ citation: citations[style] }) });
  });
  try {
    await page.goto(`/works/${item.slug}`);
    await page.getByRole('button', { name: 'Trích dẫn khoa học (Cite)', exact: true }).click();
    const modal = page.getByRole('dialog', { name: 'Trích dẫn', exact: true });
    await expect(modal.getByRole('alert')).toContainText('Chưa tải được trích dẫn DOI');
    await expect(modal.getByRole('button', { name: 'Sao chép BIBTEX', exact: true })).toBeDisabled();
    await modal.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await expect(modal.locator('pre')).toContainText('Aspelmeyer2009');
    await expect(modal.locator('pre')).not.toContainText('organization =');
    const downloadEvent = page.waitForEvent('download');
    await modal.getByRole('button', { name: 'Tải file .bib', exact: true }).click();
    const download = await downloadEvent;
    expect(await readFile((await download.path())!, 'utf8')).toBe(citations.bibtex);
    await modal.getByRole('button', { name: 'APA 7th', exact: true }).click();
    await expect(modal.locator('pre')).toHaveText(citations.apa);
    await modal.getByRole('button', { name: 'IEEE', exact: true }).click();
    await expect(modal.locator('pre')).toHaveText(citations.ieee);
    await modal.getByRole('button', { name: 'APA 7th', exact: true }).click();
    await expect(modal.locator('pre')).toHaveText(citations.apa);
    expect(calls.apa).toBe(1);
    expect(calls.ieee).toBe(1);
  } finally {
    await database.showcaseItem.update({ where: { id: item.id }, data: { conference: item.conference ?? Prisma.DbNull, citationEnabled: item.citationEnabled } });
  }
});
