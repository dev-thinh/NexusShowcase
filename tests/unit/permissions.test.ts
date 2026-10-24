import {
canUserReview,
canUserUpload
} from '@/features/identity/model/permissions';
import { describe, expect, it } from 'vitest';

describe('RBAC Permission Helpers', () => {
  it('should allow CORE_MEMBER and ADMIN to upload (Member and Guest denied)', () => {
    expect(canUserUpload({ role: 'ADMIN' })).toBe(true);
    expect(canUserUpload({ role: 'CORE_MEMBER' })).toBe(true);
    expect(canUserUpload({ role: 'MEMBER' })).toBe(false);
    expect(canUserUpload({ role: 'GUEST' })).toBe(false);
    expect(canUserUpload(null)).toBe(false);
  });

  it('allows only admins to review submissions', () => {
    expect(canUserReview({ role: 'ADMIN' })).toBe(true);
    expect(canUserReview({ role: 'EDITOR' })).toBe(false);
    expect(canUserReview({ role: 'CORE_MEMBER' })).toBe(false);
    expect(canUserReview({ role: 'MEMBER' })).toBe(false);
    expect(canUserReview(null)).toBe(false);
  });
});
