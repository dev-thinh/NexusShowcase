import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { MediaImage } from '@/shared/ui/media-image';

it('serves responsive thumbnails instead of original uploads when optimization is requested', () => {
  const html = renderToStaticMarkup(<MediaImage optimized src="/uploads/thumbnails/photo.jpg" alt="Photo" width={180} height={120} sizes="200px" />);
  expect(html).toContain('/uploads/thumbnails/photo.jpg?w=');
  expect(html).toContain('srcSet=');
  expect(html).toContain('sizes="200px"');
  expect(html).toContain('decoding="async"');
});

it('keeps the shared placeholder for an empty optimized image', () => {
  const html = renderToStaticMarkup(<MediaImage optimized alt="Photo" width={180} height={120} />);
  expect(html).toContain('data-media-placeholder="true"');
  expect(html).not.toContain('<img');
});
