import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';

it('links ancestors and marks only the current page without linking it', () => {
  const html = renderToStaticMarkup(<Breadcrumbs items={[{ label: 'Thành viên', href: '/members' }, { label: 'Nguyễn Văn A' }]} />);
  expect(html).toContain('aria-label="Đường dẫn"');
  expect(html).toContain('<ol');
  expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  expect(html).toContain('href="/"');
  expect(html).toContain('href="/members"');
  expect(html).toContain('aria-current="page" class="min-w-0 break-words">Nguyễn Văn A</span>');
});

it('keeps top level destinations beside one another under home', () => {
  for (const label of ['Khám phá công trình', 'Nghiên cứu khoa học', 'Robotics & IoT']) {
    const html = renderToStaticMarkup(<Breadcrumbs items={[{ label }]} />);
    expect(html.match(/<li\b/g)).toHaveLength(2);
    expect(html.match(/<a\b/g)).toHaveLength(1);
  }
});
