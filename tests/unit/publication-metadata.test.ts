import { beforeEach, expect, it, vi } from 'vitest';
import { generateMetadata } from '@/app/(shell)/(site)/works/[slug]/page';

const mocks = vi.hoisted(() => ({ session: vi.fn(), item: vi.fn() }));
vi.mock('@/features/identity/server/session', () => ({ getSession: mocks.session }));
vi.mock('@/server/db/prisma', () => ({ prisma: { showcaseItem: { findUnique: mocks.item } } }));
vi.mock('@/features/publications/server/admin-actions', () => ({}));
vi.mock('@/features/publications/components/card-admin-controls', () => ({ CardAdminControls: () => null }));

const metadata = () => generateMetadata({ params: Promise.resolve({ slug: 'work' }) });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue(null);
  mocks.item.mockResolvedValue({ title: 'Robot tự hành', status: 'PUBLISHED', visibility: 'PUBLIC', creatorId: 'owner' });
});
it('uses the visible article title', async () => {
  expect(await metadata()).toEqual({ title: 'Robot tự hành' });
});
it('does not reveal private article titles to guests', async () => {
  mocks.item.mockResolvedValue({ title: 'Private title', status: 'PUBLISHED', visibility: 'PRIVATE', creatorId: 'owner' });
  await expect(metadata()).rejects.toThrow('NEXT_REDIRECT');
});
it('does not reveal unpublished article titles to other members', async () => {
  mocks.session.mockResolvedValue({ user: { id: 'other', role: 'MEMBER' } });
  mocks.item.mockResolvedValue({ title: 'Draft title', status: 'DRAFT', visibility: 'PUBLIC', creatorId: 'owner' });
  await expect(metadata()).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
});
it.each([{ id: 'owner', role: 'CORE_MEMBER' }, { id: 'admin', role: 'ADMIN' }])('allows authorized preview metadata for %s', async user => {
  mocks.session.mockResolvedValue({ user });
  mocks.item.mockResolvedValue({ title: 'Draft title', status: 'DRAFT', visibility: 'PRIVATE', creatorId: 'owner' });
  expect(await metadata()).toEqual({ title: 'Draft title' });
});
it('does not render metadata for missing articles', async () => {
  mocks.item.mockResolvedValue(null);
  await expect(metadata()).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
});
