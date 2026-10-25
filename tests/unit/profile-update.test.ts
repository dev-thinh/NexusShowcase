import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateProfileAction } from '@/features/identity/server/profile-actions';

const mocks = vi.hoisted(() => ({ getActor: vi.fn(), updateMany: vi.fn(), revalidatePath: vi.fn() }));
vi.mock('@/features/identity/server/actor', () => ({ getActor: mocks.getActor }));
vi.mock('@/server/db/prisma', () => ({ prisma: { user: { updateMany: mocks.updateMany } } }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));

const input = { fullName: '  Nguyễn Văn A  ', bio: 'Giới thiệu', links: [{ title: 'Website của tôi', url: 'https://example.com' }] };

describe('personal profile update', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getActor.mockResolvedValue({ id: 'self', role: 'MEMBER' });
    mocks.updateMany.mockResolvedValue({ count: 1 });
  });
  it('requires a signed-in active actor', async () => {
    mocks.getActor.mockResolvedValue(null);
    expect(await updateProfileAction(input)).toMatchObject({ success: false, code: 'UNAUTHORIZED' });
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
  it('updates only the authenticated user and ignores privilege and target fields', async () => {
    expect(await updateProfileAction({ ...input, id: 'someone-else', role: 'ADMIN', email: 'other@example.com' } as typeof input)).toMatchObject({ success: true });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: 'self', status: 'ACTIVE', deletedAt: null, mustChangePassword: false },
      data: { fullName: 'Nguyễn Văn A', bio: input.bio, profileLinks: input.links, githubUrl: null, linkedinUrl: null, googleScholarUrl: null, portfolioUrl: null },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/members/self');
  });
  it.each([{ fullName: '   ' }, { links: [{ title: 'Bad link', url: 'javascript:alert(1)' }] }, { links: [{ title: '', url: 'https://example.com' }] }, { links: Array.from({ length: 13 }, () => ({ title: 'Website', url: 'https://example.com' })) }, { bio: 'a'.repeat(2001) }])('rejects invalid profile data %j', async (patch) => {
    expect(await updateProfileAction({ ...input, ...patch })).toMatchObject({ success: false, code: 'VALIDATION' });
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
  it('never overwrites the separately updated avatar when saving profile information', async () => {
    expect(await updateProfileAction({ ...input, avatarUrl: '/uploads/thumbnails/stale.png' } as typeof input)).toMatchObject({ success: true });
    expect(mocks.updateMany.mock.calls[0][0].data).not.toHaveProperty('avatarUrl');
  });
  it('rejects an account disabled before the write', async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    expect(await updateProfileAction(input)).toMatchObject({ success: false });
  });
});
