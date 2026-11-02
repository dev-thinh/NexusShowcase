import { expect, it } from 'vitest';
import { changePasswordSchema } from '@/features/identity/model/password-input';
import { createMemberInputSchema } from '@/features/identity/model/member-input';
import { formErrors } from '@/shared/lib/form-validation';

it('accepts eight characters with uppercase, number and special character for a password change', () => {
  expect(changePasswordSchema.safeParse({ currentPassword: 'old123', newPassword: 'Abcdef1!' }).success).toBe(true);
});

it.each(['Abcd1!', 'abcdef1!', 'Abcdefg!', 'Abcdef12', 'Abcdef1 '])('rejects a password missing a required condition: %s', newPassword => {
  const parsed = changePasswordSchema.safeParse({ currentPassword: 'old123', newPassword });
  expect(parsed.success).toBe(false);
  if (!parsed.success) expect(formErrors(parsed.error).newPassword).toBe('Mật khẩu mới cần ít nhất 8 ký tự, có chữ hoa, số và ký tự đặc biệt.');
});

it('preserves the existing administrator-specified initial password policy', () => {
  const input = { fullName: 'Member', email: 'member' };
  expect(createMemberInputSchema.safeParse({ ...input, password: 'Abcdef1!' }).success).toBe(false);
  expect(createMemberInputSchema.safeParse({ ...input, password: 'a'.repeat(15) }).success).toBe(true);
  expect(createMemberInputSchema.safeParse(input).success).toBe(true);
});

it('reports composition and byte-length requirements together in a single field error', () => {
  const parsed = changePasswordSchema.safeParse({ currentPassword: 'old123', newPassword: 'a'.repeat(73) });
  expect(parsed.success).toBe(false);
  if (!parsed.success) {
    expect(parsed.error.issues).toHaveLength(1);
    expect(formErrors(parsed.error).newPassword).toBe('Mật khẩu mới cần ít nhất 8 ký tự, có chữ hoa, số và ký tự đặc biệt. Mật khẩu tối đa 72 byte UTF-8.');
  }
});
