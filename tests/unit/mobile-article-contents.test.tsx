import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { MobileArticleContents } from '@/features/submissions/components/mobile-article-contents';

it('starts collapsed with an accessible floating trigger and a native dismissible popover', () => {
  const html = renderToStaticMarkup(<MobileArticleContents><nav aria-label="Mục lục bài viết"><a href="#section-1">Phương pháp</a></nav></MobileArticleContents>);
  expect(html).toContain('aria-label="Mở mục lục"');
  expect(html).toContain('popover="auto"');
  expect(html.toLowerCase()).toContain('popovertarget=');
  expect(html.toLowerCase()).toContain('popovertargetaction="hide"');
  expect(html).toContain('aria-label="Đóng mục lục"');
  expect(html).toContain('href="#section-1"');
  expect(html).toContain('fixed');
  expect(html).toContain('lg:hidden');
});
