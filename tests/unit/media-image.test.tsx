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

it('automatically sizes stored thumbnails while retaining original external images', () => {
  const stored = renderToStaticMarkup(<MediaImage src="/uploads/thumbnails/photo.jpg" width={240} height={180} sizes="240px" />);
  expect(stored).toContain('photo.jpg?w=256');
  expect(stored).toContain('srcSet=');
  const external = renderToStaticMarkup(<MediaImage src="https://example.com/photo.jpg" width={240} height={180} />);
  expect(external).not.toContain('srcSet=');
  const original = renderToStaticMarkup(<MediaImage optimized={false} src="/uploads/thumbnails/photo.jpg" width={240} height={180} />);
  expect(original).not.toContain('srcSet=');
});
