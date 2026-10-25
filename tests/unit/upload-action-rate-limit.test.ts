import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ rate: vi.fn(), upload: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/features/identity/server/actor', () => ({ getActor: async () => ({ id: 'author', role: 'CORE_MEMBER' }) }));
vi.mock('@/features/identity/server/rate-limit', () => ({ consumeRateLimit: mocks.rate }));
vi.mock('@/features/assets/server/upload-command', () => ({ uploadAsset: mocks.upload }));
vi.mock('@/server/db/prisma', () => ({ prisma: { user: { updateMany: async () => ({ count: 1 }) } } }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
import { uploadFileAction } from '@/features/assets/server/actions';
import { uploadAvatarAction } from '@/features/assets/server/avatar-actions';
beforeEach(() => { vi.resetAllMocks(); mocks.rate.mockResolvedValue({ allowed: false, retryAfterSeconds: 30 }); mocks.upload.mockResolvedValue({ success: true, data: { url: '/uploads/thumbnails/new.png' } }); });
it.each([uploadFileAction, uploadAvatarAction])('throttles direct server action writes', async action => {
  const data = new FormData(); data.set('file', new File(['image'], 'image.png', { type: 'image/png' })); data.set('type', 'thumbnail');
  expect(await action(data)).toMatchObject({ success: false, code: 'RATE_LIMITED' });
  expect(mocks.upload).not.toHaveBeenCalled();
  expect(mocks.rate).toHaveBeenCalledWith({ scope: 'upload', key: 'author', limit: 60, windowMs: 60_000 });
});
