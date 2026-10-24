import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PublicationNavigation } from '@/features/publications/components/publication-navigation';

describe('publication section navigation', () => {
  it.each(['/explore', '/category/bai-bao-khoa-hoc', '/category/robotics-iot'])('marks only %s as current', currentHref => {
    const html = renderToStaticMarkup(<PublicationNavigation currentHref={currentHref} />);
    expect(html).toContain('Tất cả công trình');
    expect(html).toContain('Nghiên cứu khoa học');
    expect(html).toContain('Robotics &amp; IoT');
    const links = html.match(/<a\b[^>]*>/g) ?? [];
    expect(links).toHaveLength(3);
    const active = links.filter(link => link.includes('aria-current="page"'));
    expect(active).toHaveLength(1);
    expect(active[0]).toContain(`href="${currentHref}"`);
  });
});
