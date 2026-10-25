import { expect, it } from 'vitest';
import { getProfileLinks, profileInputSchema } from '@/features/identity/model/profile-input';

it('preserves custom titles and trims valid URLs', () => {
  const profile = profileInputSchema.parse({ fullName: 'Member', bio: '', avatarUrl: '', links: [{ title: '  Facebook của tôi  ', url: ' https://facebook.com/member ' }] });
  expect(profile.links).toEqual([{ title: 'Facebook của tôi', url: 'https://facebook.com/member' }]);
});
it('keeps legacy links until the new list is saved', () => {
  expect(getProfileLinks({ profileLinks: null, githubUrl: 'https://github.com/member' })).toEqual([{ title: 'GitHub', url: 'https://github.com/member' }]);
});
it('does not resurrect legacy links after the user deletes every link', () => {
  expect(getProfileLinks({ profileLinks: [], githubUrl: 'https://github.com/member' })).toEqual([]);
});
it('never renders unsafe stored links', () => {
  expect(getProfileLinks({ profileLinks: [{ title: 'Unsafe', url: 'javascript:alert(1)' }] })).toEqual([]);
});
