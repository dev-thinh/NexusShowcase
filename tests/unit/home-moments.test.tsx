import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HomeMoments } from '@/app/(shell)/(site)/home-moments';
import { defaultMoments } from '../fixtures/moments';

describe('homepage photo wall', () => {
  it('shows the pencil only to an admin and excludes hidden images from the wall', () => {
    const gallery = { photos: [{ ...defaultMoments[0], visible: false }, defaultMoments[1]], version: 1 };
    const admin = renderToStaticMarkup(<HomeMoments initialGallery={{ ...gallery, isAdmin: true }} />);
    const guest = renderToStaticMarkup(<HomeMoments initialGallery={{ ...gallery, isAdmin: false }} />);
    expect(admin).toContain('aria-label="Chỉnh sửa ảnh khoảnh khắc"');
    expect(guest).not.toContain('aria-label="Chỉnh sửa ảnh khoảnh khắc"');
    expect(admin).not.toContain(defaultMoments[0].src);
    expect(decodeURIComponent(admin)).toContain(defaultMoments[1].src);
  });
  it('handles empty galleries without animation lanes or broken images', () => {
    const html = renderToStaticMarkup(<HomeMoments initialGallery={{ photos: [], version: 1, isAdmin: true }} />);
    expect(html).toContain('data-media-placeholder="true"');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('class="moments-lane"');
    expect(html).toContain('aria-label="Chỉnh sửa ảnh khoảnh khắc"');
  });
  it('renders the existing six images once in the top row with decorative loop copies', () => {
    const html = renderToStaticMarkup(<HomeMoments initialGallery={{ version: 0, isAdmin: false, photos: defaultMoments }} />);
    expect(html.match(/class="moments-lane"/g)).toHaveLength(1);
    expect(html.match(/class="moments-group" aria-hidden="true"/g)).toHaveLength(1);
    expect(html.match(/tabindex="-1"/g)).toHaveLength(6);
    expect(html).toContain('Tạm dừng chuyển động');
    expect(html).not.toContain('Rê chuột để dừng.');
    expect(html).not.toContain('Vuốt để khám phá.');
    expect(html).not.toContain('Chạm ảnh để nhìn gần hơn.');
    expect(html).toContain(defaultMoments[0].title);
    expect(html).not.toContain('role="dialog"');
    const images = [...html.matchAll(/<img[^>]+>/g)].map(match => match[0]);
    expect(images).toHaveLength(12);
    expect(images.every(img => img.includes('loading="eager"') && img.includes('?w=') && img.includes('width=') && img.includes('height='))).toBe(true);
  });
  it.each([0, 1, 2, 3, 6])('applies the per-row animation threshold with %i photos', count => {
    const html = renderToStaticMarkup(<HomeMoments initialGallery={{ version: 0, isAdmin: false, photos: defaultMoments.slice(0, count) }} />);
    if (!count) { expect(html).not.toContain('data-motion='); return; }
    expect(html).toContain(`data-motion="${count >= 3}"`);
    expect(html.match(/class="moments-group" aria-hidden="true"/g)?.length ?? 0).toBe(count >= 3 ? 1 : 0);
    expect(html.includes('aria-label="Tạm dừng chuyển động"')).toBe(count >= 3);
  });
  it('renders different photos in each row with independent motion', () => {
    const html = renderToStaticMarkup(<HomeMoments initialGallery={{ version: 0, isAdmin: false, photos: defaultMoments.map((photo, index) => ({ ...photo, slot: index < 2 ? index : index + 4 })) }} />);
    expect(html).toContain('data-row="0" data-motion="false"');
    expect(html).toContain('data-row="1" data-motion="true"');
    const top = decodeURIComponent(html.slice(html.indexOf('data-row="0"'), html.indexOf('data-row="1"')));
    const bottom = decodeURIComponent(html.slice(html.indexOf('data-row="1"')));
    expect(top).toContain(defaultMoments[0].src);
    expect(top).not.toContain(defaultMoments[2].src);
    expect(bottom).not.toContain(defaultMoments[0].src);
    expect(bottom).toContain(defaultMoments[2].src);
  });
});

it('renders an empty production gallery using the shared placeholder', () => {
 const html = renderToStaticMarkup(<HomeMoments />);
 expect(html).not.toContain('<img');
 expect(html).toContain('data-media-placeholder="true"');
 expect(html).not.toContain('class="moments-lane"');
});
