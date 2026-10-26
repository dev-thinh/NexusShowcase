import { expect, it } from 'vitest';
import { formErrors, searchFormSchema } from '@/shared/lib/form-validation';
import { changePasswordFormSchema } from '@/features/identity/model/password-input';
import { createMemberInputSchema } from '@/features/identity/model/member-input';
import { profileFormSchema } from '@/features/identity/model/profile-input';
import { reviewFeedbackSchema } from '@/features/review/model/decision';
it.each(['1899', '2101', '2026.5', 'abc', '26'])('rejects an invalid year %s without relying on browser validation', year => {
  const parsed = searchFormSchema.safeParse({ year });
  expect(parsed.success).toBe(false);
  if (!parsed.success) expect(formErrors(parsed.error)).toHaveProperty('year');
});
it('accepts an empty year and valid role and sort filters', () => {
  expect(searchFormSchema.safeParse({ year: '', q: 'robot', role: 'ADMIN', sort: 'newest' }).success).toBe(true);
});
it('rejects oversized queries and invalid filters', () => {
  expect(searchFormSchema.safeParse({ q: 'a'.repeat(201) }).success).toBe(false);
  expect(searchFormSchema.safeParse({ filter: 'unknown' }).success).toBe(false);
});
it('puts password mismatch errors on the confirmation field', () => {
  const parsed = changePasswordFormSchema.safeParse({ currentPassword: 'old', newPassword: 'New-password-2026!', confirmPassword: 'different' });
  expect(parsed.success).toBe(false);
  if (!parsed.success) expect(Object.keys(formErrors(parsed.error))).toEqual(['confirmPassword']);
});
it('allows generated member passwords but rejects short supplied passwords', () => {
  const member = { fullName: 'Member', email: 'member', password: '' };
  expect(createMemberInputSchema.safeParse(member).success).toBe(true);
  expect(createMemberInputSchema.safeParse({ ...member, password: '123' }).success).toBe(false);
});
it('keeps link error indexes when an earlier editable row is blank', () => {
  const profile = { fullName: 'Member', bio: '', links: [{ title: '', url: '' }, { title: 'Website', url: 'javascript:alert(1)' }] };
  const parsed = profileFormSchema.safeParse(profile);
  expect(parsed.success).toBe(false);
  if (!parsed.success) expect(formErrors(parsed.error)).toHaveProperty('links.1.url');
  expect(profileFormSchema.safeParse({ ...profile, links: [{ title: '', url: '' }] }).success).toBe(true);
});
it('requires both the title and URL of a populated link', () => {
  for (const link of [{ title: 'Website', url: '' }, { title: '', url: 'https://example.com' }]) {
    expect(profileFormSchema.safeParse({ fullName: 'Member', bio: '', links: [link] }).success).toBe(false);
  }
});
it('rejects whitespace-only review feedback', () => {
  expect(reviewFeedbackSchema.safeParse({ reason: '   ' }).success).toBe(false);
});
