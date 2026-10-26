import { describe, expect, it } from 'vitest';
import { changePasswordSchema } from '@/features/identity/model/password-input';
import { createMemberInputSchema } from '@/features/identity/model/member-input';
import { loginSchema } from '@/features/identity/model/login-input';

describe('bcrypt password byte boundaries', () => {
  it.each([6, 7])('rejects newly set passwords of %i characters', length => {
    const password = 'Aa1!' + 'a'.repeat(length - 4);
    expect(changePasswordSchema.safeParse({ currentPassword: 'old-password', newPassword: password }).success).toBe(false);
    expect(createMemberInputSchema.safeParse({ fullName: 'Member', email: 'member', password }).success).toBe(false);
  });
  it('accepts a compliant new password while allowing existing six-character credentials', () => {
    const password = 'Aa1!' + 'a'.repeat(11);
    expect(changePasswordSchema.safeParse({ currentPassword: 'old123', newPassword: password }).success).toBe(true);
    expect(createMemberInputSchema.safeParse({ fullName: 'Member', email: 'member', password }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'member', password: 'old123' }).success).toBe(true);
  });
  it.each(['Aa1!' + 'a'.repeat(69), 'Aa1!' + 'é'.repeat(35), 'Aa1!' + '😀'.repeat(18)])('rejects new passwords over 72 UTF-8 bytes', password => {
    expect(changePasswordSchema.safeParse({ currentPassword: 'old-password', newPassword: password }).success).toBe(false);
    expect(createMemberInputSchema.safeParse({ fullName: 'Member', email: 'member', password }).success).toBe(false);
  });
  it.each(['Aa1!' + 'a'.repeat(68), 'Aa1!' + 'é'.repeat(34), 'Aa1!' + '😀'.repeat(17)])('accepts new passwords at 72 UTF-8 bytes', password => {
    expect(changePasswordSchema.safeParse({ currentPassword: 'old-password', newPassword: password }).success).toBe(true);
    expect(createMemberInputSchema.safeParse({ fullName: 'Member', email: 'member', password }).success).toBe(true);
  });
  it('preserves historical long passwords for login and current-password verification', () => {
    const password = 'a'.repeat(128);
    expect(loginSchema.safeParse({ email: 'member', password }).success).toBe(true);
    expect(changePasswordSchema.safeParse({ currentPassword: password, newPassword: 'New-password-2026!' }).success).toBe(true);
  });
});
