import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ actor: vi.fn(), upload: vi.fn(), updateMany: vi.fn(), revalidatePath: vi.fn() }));
vi.mock('@/features/identity/server/actor', () => ({ getActor: mocks.actor }));
vi.mock('@/features/assets/server/upload-command', () => ({ uploadAsset: mocks.upload }));
vi.mock('@/server/db/prisma', () => ({ prisma: { user: { updateMany: mocks.updateMany } } }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
import { uploadAvatarAction, removeAvatarAction } from '@/features/assets/server/avatar-actions';

beforeEach(() => { vi.resetAllMocks(); mocks.actor.mockResolvedValue({ id: 'member', role: 'MEMBER' }); mocks.updateMany.mockResolvedValue({ count: 1 }); });
it('requires authentication before accepting an avatar', async () => {
  mocks.actor.mockResolvedValue(null);
  expect(await uploadAvatarAction(new FormData())).toMatchObject({ success: false, code: 'UNAUTHORIZED' });
  expect(mocks.upload).not.toHaveBeenCalled();
});
it('lets a regular member upload only an image owned by their session identity', async () => {
  const file = new File(['image'], 'avatar.png', { type: 'image/png' });
  const data = new FormData(); data.set('file', file); data.set('type', 'resource'); data.set('ownerId', 'other');
  mocks.upload.mockResolvedValue({ success: true, data: { url: '/uploads/thumbnails/avatar.png' } });
  expect(await uploadAvatarAction(data)).toMatchObject({ success: true });
  expect(mocks.upload).toHaveBeenCalledWith(file, 'thumbnail', 'member');
  expect(mocks.updateMany).toHaveBeenCalledWith({ where: { id: 'member', status: 'ACTIVE', deletedAt: null, mustChangePassword: false }, data: { avatarUrl: '/uploads/thumbnails/avatar.png' } });
  expect(mocks.revalidatePath).toHaveBeenCalledWith('/members/member');
});
it('does not change the avatar if uploading fails', async () => {
  const data = new FormData(); data.set('file', new File(['invalid'], 'bad.png', { type: 'image/png' }));
  mocks.upload.mockResolvedValue({ success: false, code: 'VALIDATION', error: 'Invalid image' });
  expect(await uploadAvatarAction(data)).toMatchObject({ success: false });
  expect(mocks.updateMany).not.toHaveBeenCalled();
});
it('rejects an account disabled during upload', async () => {
  const data = new FormData(); data.set('file', new File(['image'], 'avatar.png', { type: 'image/png' }));
  mocks.upload.mockResolvedValue({ success: true, data: { url: '/uploads/thumbnails/avatar.png' } });
  mocks.updateMany.mockResolvedValue({ count: 0 });
  expect(await uploadAvatarAction(data)).toMatchObject({ success: false, code: 'FORBIDDEN' });
});
it('rejects missing or non-file data', async () => {
  const data = new FormData(); data.set('file', 'not-a-file');
  expect(await uploadAvatarAction(data)).toMatchObject({ success: false, code: 'VALIDATION' });
  expect(mocks.upload).not.toHaveBeenCalled();
});
it('clears only the authenticated user avatar to restore the initial-letter fallback', async () => {
  expect(await removeAvatarAction()).toMatchObject({ success: true });
  expect(mocks.updateMany).toHaveBeenCalledWith({ where: { id: 'member', status: 'ACTIVE', deletedAt: null, mustChangePassword: false }, data: { avatarUrl: null } });
  expect(mocks.revalidatePath).toHaveBeenCalledWith('/members/member');
  expect(mocks.upload).not.toHaveBeenCalled();
});
it('does not allow anonymous avatar removal', async () => {
  mocks.actor.mockResolvedValue(null);
  expect(await removeAvatarAction()).toMatchObject({ success: false, code: 'UNAUTHORIZED' });
  expect(mocks.updateMany).not.toHaveBeenCalled();
});
