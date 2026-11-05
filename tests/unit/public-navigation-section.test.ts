import { expect, it } from 'vitest';
import { publicNavigationSection } from '@/shared/navigation/public-section';

it('keeps member profiles in the members section without matching unrelated prefixes', () => {
  expect(publicNavigationSection('/members/member-id')).toBe('/members');
  expect(publicNavigationSection('/memberships')).toBe('/memberships');
});
it('uses only authorized detail context matching the current work route', () => {
  expect(publicNavigationSection('/works/robot', { pathname: '/works/robot', section: '/projects' })).toBe('/projects');
  expect(publicNavigationSection('/works/paper', { pathname: '/works/paper', section: '/research' })).toBe('/research');
  expect(publicNavigationSection('/works/hidden', { pathname: '/works/robot', section: '/projects' })).toBe('/works/hidden');
  expect(publicNavigationSection('/works/unknown')).toBe('/works/unknown');
});
