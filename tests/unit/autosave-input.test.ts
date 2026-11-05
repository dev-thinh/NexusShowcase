import { expect, it } from 'vitest';
import { showcaseDraftInputSchema, showcaseSubmissionInputSchema } from '@/features/submissions/model/input';
import { ARTICLE_PREFIX } from '@/features/submissions/model/article';

it('round trips empty titles and unfinished fields without trimming', () => {
  const draft = { title: '', summary: '  writing\n', resources: [{ kind: 'LINK', label: '', url: 'https://git', linkType: 'GITHUB' }], conference: { name: '', rankings: [{ system: '', rank: '' }] }, contributors: [{ role: 'CUSTOM', displayOrder: 0, externalLink: 'https://' }] };
  const parsed = showcaseDraftInputSchema.parse(draft);
  expect(parsed).toMatchObject(draft);
  expect(showcaseSubmissionInputSchema.safeParse(draft).success).toBe(false);
});
it('preserves unfinished section urls and whitespace but rejects malformed article structures', () => {
  const content = ARTICLE_PREFIX + JSON.stringify({ version: 1, sections: [{ id: 's', title: '  ', blocks: [{ id: 'b', kind: 'LINK', url: 'https://', caption: '', alt: '' }] }] });
  expect(showcaseDraftInputSchema.parse({ title: '', content }).content).toBe(content);
  expect(showcaseSubmissionInputSchema.safeParse({ title: 'Valid', summary: 'Summary', content }).success).toBe(false);
  expect(showcaseDraftInputSchema.safeParse({ title: '', content: ARTICLE_PREFIX + '{"sections":"bad"}' }).success).toBe(false);
  expect(showcaseDraftInputSchema.safeParse({ title: 'x'.repeat(201) }).success).toBe(false);
});
it.each(['javascript:alert(1)', 'data:text/html,unsafe', 'https://example.org/'+ 'a'.repeat(2048), '/uploads/../secret.pdf'])('rejects unsafe or oversized article urls even while editing: %s', url => {
 const content=ARTICLE_PREFIX+JSON.stringify({version:1,sections:[{id:'s',title:'Section',blocks:[{id:'b',kind:'LINK',url,caption:'',alt:''}]}]});
 expect(showcaseDraftInputSchema.safeParse({title:'Draft',content}).success).toBe(false);
});
