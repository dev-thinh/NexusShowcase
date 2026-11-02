import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ signIn: vi.fn(), signOut: vi.fn(), redirect: vi.fn(), assign: vi.fn() }));
vi.mock('@/features/identity/server/auth', () => ({ signIn: mocks.signIn }));
vi.mock('next-auth', () => ({ AuthError: class AuthError extends Error {} }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('next-auth/react', () => ({ signOut: mocks.signOut }));
import { loginAction } from '@/features/identity/server/login-actions';
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal('window', { location: { assign: mocks.assign } }); });
it('keeps login on the current host instead of following the configured auth origin', async () => {
 mocks.signIn.mockResolvedValue('http://127.0.0.1:3002/dashboard');
 const data = new FormData(); data.set('email', 'member1@gmail.com'); data.set('password', 'demo'); data.set('redirectTo', '/dashboard?filter=PUBLISHED');
 await loginAction(null, data);
 expect(mocks.signIn).toHaveBeenCalledWith('credentials', expect.objectContaining({ redirect: false }));
 expect(mocks.redirect).toHaveBeenCalledWith('/dashboard?filter=PUBLISHED');
});
it.each(['https://other.test/', '//other.test/', '/\\other.test/'])('rejects an external login destination %s', async destination => {
 const data = new FormData(); data.set('email', 'member1@gmail.com'); data.set('password', 'demo'); data.set('redirectTo', destination);
 await loginAction(null, data);
 expect(mocks.redirect).toHaveBeenCalledWith('/dashboard');
});
it('clears the current host session before reloading that same host on sign out', async () => {
 mocks.signOut.mockResolvedValue({ url: 'http://localhost:3002/' });
 const { signOutOnCurrentHost } = await import('@/features/identity/components/sign-out-current-host');
 await signOutOnCurrentHost('/');
 expect(mocks.signOut).toHaveBeenCalledWith({ redirect: false, redirectTo: '/' });
 expect(mocks.assign).toHaveBeenCalledWith('/');
});

it('explains a temporary login limit instead of claiming the password is wrong', async () => {
 const { AuthError } = await import('next-auth');
 const error = Object.assign(new AuthError(), { type: 'CredentialsSignin', code: 'rate_limited' });
 mocks.signIn.mockRejectedValueOnce(error);
 const data = new FormData(); data.set('email', 'member1@gmail.com'); data.set('password', 'demo');
 const result = await loginAction(null, data);
 expect(result?.error).toContain('15 phút');
 expect(result?.error).not.toContain('không chính xác');
 expect(mocks.redirect).not.toHaveBeenCalled();
});
