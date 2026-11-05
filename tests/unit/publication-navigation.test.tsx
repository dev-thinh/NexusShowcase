import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { AcademicFooter } from '@/shared/ui/academic-footer';

it('removes secondary publication tabs rather than hiding them on mobile', () => {
  const category = readFileSync('src/features/publications/components/category-page.tsx', 'utf8');
  const research = readFileSync('src/app/(shell)/(site)/research/page.tsx', 'utf8');
  expect(category).not.toContain('PublicationNavigation');
  expect(research).not.toContain('PublicationNavigation');
});
it('keeps category footer destinations without the citation support sentence', () => {
  const html = renderToStaticMarkup(<AcademicFooter />);
  expect(html).not.toContain('Hỗ trợ trích dẫn');
  expect(html).not.toContain('/explore');
  expect(html).toContain('/research');
  expect(html).toContain('/projects');
});
