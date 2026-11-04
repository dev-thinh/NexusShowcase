import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { AcademicFooter } from '@/shared/ui/academic-footer';

it('removes secondary publication tabs rather than hiding them on mobile', () => {
  const category = readFileSync('src/app/(shell)/(site)/category/[slug]/page.tsx', 'utf8');
  const explore = readFileSync('src/app/(shell)/(site)/explore/page.tsx', 'utf8');
  expect(category).not.toContain('PublicationNavigation');
  expect(explore).not.toContain('PublicationNavigation');
});
it('keeps category footer destinations without the citation support sentence', () => {
  const html = renderToStaticMarkup(<AcademicFooter />);
  expect(html).not.toContain('Hỗ trợ trích dẫn');
  expect(html).not.toContain('/explore');
  expect(html).toContain('/category/bai-bao-khoa-hoc');
  expect(html).toContain('/category/robotics-iot');
});
