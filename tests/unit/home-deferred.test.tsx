import React from 'react';
import { expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ publications: vi.fn().mockResolvedValue([]), members: vi.fn().mockResolvedValue([]), session: vi.fn().mockResolvedValue(null) }));
vi.stubGlobal('React', React);
vi.mock('server-only', () => ({}));
vi.mock('@/features/identity/server/session', () => ({ getSession: mocks.session }));
vi.mock('@/features/publications/server/queries', () => ({ getHomePublications: mocks.publications, listPublications: vi.fn() }));
vi.mock('@/features/members/server/queries', () => ({ getHomeMembers: mocks.members }));
import HomePage from '@/app/(shell)/(site)/page';
it('does not start home section queries before the visitor approaches them', async () => {
  await HomePage({ searchParams: Promise.resolve({}) });
  await Promise.resolve();
  expect(mocks.publications).not.toHaveBeenCalled();
  expect(mocks.members).not.toHaveBeenCalled();
  expect(mocks.session).not.toHaveBeenCalled();
});
