import { describe, it, expect } from 'vitest';
import {
  canUserEditPublication,
  canUserPublish,
  canUserUpload,
  canUserReview,
  isMemberOrHigher,
} from '@/lib/permissions';

describe('RBAC Permission Helpers', () => {
  it('should allow CORE_MEMBER and ADMIN to upload (Member and Guest denied)', () => {
    expect(canUserUpload({ role: 'ADMIN' })).toBe(true);
    expect(canUserUpload({ role: 'CORE_MEMBER' })).toBe(true);
    expect(canUserUpload({ role: 'MEMBER' })).toBe(false);
    expect(canUserUpload({ role: 'GUEST' })).toBe(false);
    expect(canUserUpload(null)).toBe(false);
  });

  it('allows editors and admins to review submissions', () => {
    expect(canUserReview({ role: 'ADMIN' })).toBe(true);
    expect(canUserReview({ role: 'EDITOR' })).toBe(true);
    expect(canUserReview({ role: 'CORE_MEMBER' })).toBe(false);
    expect(canUserReview({ role: 'MEMBER' })).toBe(false);
    expect(canUserReview(null)).toBe(false);
  });

  it('separates publication editing from final publishing', () => {
    expect(canUserEditPublication({ role: 'EDITOR' })).toBe(true);
    expect(canUserEditPublication({ role: 'ADMIN' })).toBe(true);
    expect(canUserEditPublication({ role: 'CORE_MEMBER' })).toBe(false);
    expect(canUserPublish({ role: 'EDITOR' })).toBe(false);
    expect(canUserPublish({ role: 'ADMIN' })).toBe(true);
  });

  it('should check if user is official club member', () => {
    expect(isMemberOrHigher({ role: 'ADMIN' })).toBe(true);
    expect(isMemberOrHigher({ role: 'CORE_MEMBER' })).toBe(true);
    expect(isMemberOrHigher({ role: 'MEMBER' })).toBe(true);
    expect(isMemberOrHigher({ role: 'GUEST' })).toBe(false);
  });
});
