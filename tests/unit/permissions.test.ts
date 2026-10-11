import { describe, it, expect } from 'vitest';
import { canUserUpload, canUserReview, isMemberOrHigher } from '@/lib/permissions';

describe('RBAC Permission Helpers', () => {
  it('should only allow CORE_MEMBER to upload (Admin reviews only)', () => {
    expect(canUserUpload({ role: 'ADMIN' })).toBe(false);
    expect(canUserUpload({ role: 'CORE_MEMBER' })).toBe(true);
    expect(canUserUpload({ role: 'MEMBER' })).toBe(false);
    expect(canUserUpload({ role: 'GUEST' })).toBe(false);
    expect(canUserUpload(null)).toBe(false);
  });

  it('should only allow ADMIN to review/publish submissions', () => {
    expect(canUserReview({ role: 'ADMIN' })).toBe(true);
    expect(canUserReview({ role: 'CORE_MEMBER' })).toBe(false);
    expect(canUserReview({ role: 'MEMBER' })).toBe(false);
    expect(canUserReview(null)).toBe(false);
  });

  it('should check if user is official club member', () => {
    expect(isMemberOrHigher({ role: 'ADMIN' })).toBe(true);
    expect(isMemberOrHigher({ role: 'CORE_MEMBER' })).toBe(true);
    expect(isMemberOrHigher({ role: 'MEMBER' })).toBe(true);
    expect(isMemberOrHigher({ role: 'GUEST' })).toBe(false);
  });
});
