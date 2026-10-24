import { finishNavigation, navigationTarget } from '@/shared/navigation/state';
import { expect, it } from 'vitest';
it('keeps the newest pending destination when an older request completes', () => {
  const current = { id: 2, pathname: '/members' };
  expect(finishNavigation(current, 1)).toBe(current);
  expect(finishNavigation(current, 2)).toBeNull();
});
it('treats a query change as navigation and preserves native same-page/hash or external behavior', () => {
  expect(navigationTarget('/?q=robot', 'https://nexus.test/?q=paper')).toBe('/');
  expect(navigationTarget('/?q=paper#results', 'https://nexus.test/?q=paper')).toBeNull();
  expect(navigationTarget('https://other.test/', 'https://nexus.test/')).toBeNull();
});
