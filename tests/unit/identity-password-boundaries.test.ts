import { describe, expect, it } from 'vitest';
import { changePasswordSchema } from '@/features/identity/model/password-input';
import { createMemberInputSchema } from '@/features/identity/model/member-input';
import { loginSchema } from '@/features/identity/model/login-input';

describe('bcrypt password byte boundaries', () => {
  it.each([6, 14])('rejects newly set passwords of %i characters', length => {
    const password = 'a'.repeat(length);
    expect(changePasswordSchema.safeParse({ currentPassword: 'old-password', newPassword: password }).success).toBe(false);
    expect(createMemberInputSchema.safeParse({ fullName: 'Member', email: 'member', password }).success).toBe(false);
  });
  it('accepts a 15-character new password while allowing existing six-character credentials', () => {
    const password = 'a'.repeat(15);
    expect(changePasswordSchema.safeParse({ currentPassword: 'old123', newPassword: password }).success).toBe(true);
    expect(createMemberInputSchema.safeParse({ fullName: 'Member', email: 'member', password }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'member', password: 'old123' }).success).toBe(true);
  });
  it.each(['a'.repeat(73), 'é'.repeat(37), '😀'.repeat(19)])('rejects new passwords over 72 UTF-8 bytes', password => {
    expect(changePasswordSchema.safeParse({ currentPassword: 'old-password', newPassword: password }).success).toBe(false);
    expect(createMemberInputSchema.safeParse({ fullName: 'Member', email: 'member', password }).success).toBe(false);
  });
  it.each(['a'.repeat(72), 'é'.repeat(36), '😀'.repeat(18)])('accepts new passwords at 72 UTF-8 bytes', password => {
    expect(changePasswordSchema.safeParse({ currentPassword: 'old-password', newPassword: password }).success).toBe(true);
    expect(createMemberInputSchema.safeParse({ fullName: 'Member', email: 'member', password }).success).toBe(true);
  });
  it('preserves historical long passwords for login and current-password verification', () => {
    const password = 'a'.repeat(128);
    expect(loginSchema.safeParse({ email: 'member', password }).success).toBe(true);
    expect(changePasswordSchema.safeParse({ currentPassword: password, newPassword: 'new-password-2026' }).success).toBe(true);
  });
});
