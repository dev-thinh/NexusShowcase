import { describe, expect, it } from 'vitest';
import { showcaseHref, showcaseReturnTarget } from '@/lib/showcase-navigation';

const fallback = '/category/robotics-iot';
describe('showcase navigation source', () => {
  it('keeps homepage search and category pagination when returning', () => {
    expect(showcaseReturnTarget('/', fallback)).toBe('/');
    expect(showcaseReturnTarget('/?q=robot', fallback)).toBe('/?q=robot');
    expect(showcaseReturnTarget('/category/robotics-iot?page=2', fallback)).toBe('/category/robotics-iot?page=2');
    expect(showcaseHref('robot', '/')).toBe('/showcase/robot?returnTo=%2F');
  });
  it.each([undefined, 'https://example.com', '//example.com', '/login', '/\\example.com'])('rejects unsupported return target %s', raw => {
    expect(showcaseReturnTarget(raw, fallback)).toBe(fallback);
  });
});
