import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
it('preserves incremental SQL across Git LF/CRLF checkouts', () => {
  const expected = {
    '20261014_submission_editor_workflow': 'c1cedfcf1d8f8d332be2c32b88d60c95382564b273bc5beffe4e34e2c2b79268',
    '20261018_author_sections_direct_review': '366406d4099878a2825e9555f761a22d733948a1c20389650ae8339492754034',
    '20261019_remove_item_tags': '624a64d903fdf8c191a007b1fe4723467438890ca6c7bdfb354e2772db8e9144',
  };
  for (const [name, digest] of Object.entries(expected)) {
    expect(createHash('sha256').update(readFileSync(`prisma/migrations/${name}/migration.sql`, 'utf8').replace(/\r\n/g, '\n')).digest('hex')).toBe(digest);
  }
});
