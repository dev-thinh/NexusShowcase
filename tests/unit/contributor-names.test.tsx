import { ContributorNames } from '@/features/publications/components/contributor-names';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
it('uses profile links and normal names that become bold on hover, and labels external authors', () => {
 const html=renderToStaticMarkup(<ContributorNames contributors={[
  {id:'a',role:'CONTRIBUTOR',user:{id:'member',fullName:'Nguyễn An'},externalName:null},
  {id:'b',role:'ADVISOR',user:null,externalName:'Trần Bình'},
 ]}/>);
 expect(html).toContain('/members/member');
 expect(html).toContain('font-normal');
 expect(html).toContain('hover:font-semibold');
 expect(html).toContain('Tác giả ngoài CLB');
 expect(html).not.toContain('Người hướng dẫn');
 expect(html).not.toContain('†');
 expect(html).not.toContain('<sup');
 expect(html).not.toContain('>+</span>');
 expect(html).toContain('underline decoration-dotted underline-offset-4');
 expect(html).toContain('relative z-[2]');
 expect(html).not.toContain('<svg');
 expect(html).toContain('Trần Bình');
});

 it('does not emphasize an external author on hover because no profile is linked', () => {
 const html=renderToStaticMarkup(<ContributorNames contributors={[{id:'external',role:'CONTRIBUTOR',user:null,externalName:'Khách'}]}/>);
 expect(html).not.toContain('hover:font-semibold');
 expect(html).not.toContain('<a');
 expect(html).toContain('decoration-dotted');
 });
