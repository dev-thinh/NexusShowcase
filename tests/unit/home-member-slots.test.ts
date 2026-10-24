import { describe, expect, it } from 'vitest';
import { homeMemberSlots } from '@/features/members/model/home';

describe('homepage member slots', () => {
  it('shows all members when there are at most thirty', () => {
    expect(homeMemberSlots({ ADMIN: 2, CORE_MEMBER: 15, MEMBER: 5 })).toEqual({ ADMIN: 2, CORE_MEMBER: 15, MEMBER: 5 });
    expect(homeMemberSlots({ ADMIN: 0, CORE_MEMBER: 0, MEMBER: 0 })).toEqual({ ADMIN: 0, CORE_MEMBER: 0, MEMBER: 0 });
    expect(homeMemberSlots({ ADMIN: 2, CORE_MEMBER: 10, MEMBER: 18 })).toEqual({ ADMIN: 2, CORE_MEMBER: 10, MEMBER: 18 });
  });
  it('reserves the last position for the remainder and caps the core sample', () => {
    expect(homeMemberSlots({ ADMIN: 3, CORE_MEMBER: 20, MEMBER: 27 })).toEqual({ ADMIN: 3, CORE_MEMBER: 10, MEMBER: 16 });
  });
  it('uses remaining slots for ordinary members when there are fewer core members', () => {
    expect(homeMemberSlots({ ADMIN: 2, CORE_MEMBER: 3, MEMBER: 50 })).toEqual({ ADMIN: 2, CORE_MEMBER: 3, MEMBER: 24 });
  });
  it('keeps the thirty-position limit even if administration eventually grows', () => {
    expect(homeMemberSlots({ ADMIN: 35, CORE_MEMBER: 20, MEMBER: 50 })).toEqual({ ADMIN: 29, CORE_MEMBER: 0, MEMBER: 0 });
  });
});
