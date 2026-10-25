import { beforeEach, expect, it, vi } from 'vitest';
const session = vi.hoisted(() => vi.fn());
vi.mock('@/features/identity/server/session', () => ({ getSession: session }));
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw Error(`redirect:${url}`); } }));
import ChangePasswordPage from '@/app/(shell)/(account)/account/change-password/page';

beforeEach(() => vi.clearAllMocks());
it('opens the password modal on the owner profile for older account links', async () => {
  session.mockResolvedValue({ user: { id: 'member' } });
  await expect(ChangePasswordPage()).rejects.toThrow('redirect:/members/member?password=change');
});
it('requires authentication before opening the modal', async () => {
  session.mockResolvedValue(null);
  await expect(ChangePasswordPage()).rejects.toThrow('redirect:/login');
});
