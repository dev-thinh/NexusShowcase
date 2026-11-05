import { expect, it } from 'vitest';
import { publicationSearchPredicate, publicationSearchOrder, boundedPublicationQuery } from '../../src/features/publications/server/search';
it('bounds search input and escapes literal wildcards after Vietnamese folding',()=>{
 expect(boundedPublicationQuery('  Đặng  ')).toBe('Đặng');
 expect(boundedPublicationQuery('x'.repeat(1000))).toHaveLength(200);
 const predicate=publicationSearchPredicate({authenticated:false,q:'Đặng 100%_'});
 expect(predicate.values).toContain('%dang 100\\%\\_%');
 expect(predicate.text).toContain("visibility = 'PUBLIC'");
 expect(predicate.text).toContain('item_contributors');
 expect(predicate.text).toContain('externalName');
 expect(predicate.text).toContain('fullName');
 expect(publicationSearchPredicate({authenticated:true,q:'a'}).text).not.toContain("visibility = 'PUBLIC'");
});
it('preserves deterministic ordering for all supported sorts',()=>{
 for(const sort of ['title','newest','oldest','featured'] as const) expect(publicationSearchOrder(sort).text).toMatch(/id ASC$/);
 expect(publicationSearchOrder('featured').text).toContain('"isPinned" DESC');
});

it('does not match hidden user identities when searching publication contributors', () => {
  expect(publicationSearchPredicate({ authenticated: true, q: 'hidden' }).text).toContain('author."hiddenFromDirectory" = false');
});
