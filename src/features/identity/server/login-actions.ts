'use server';

import { signIn } from '@/features/identity/server/auth';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';

export type LoginState = {
  error?: string;
  success?: boolean;
} | null;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const destination = formData.get('redirectTo');
  const redirectTo = typeof destination === 'string' && /^\/(?![\/\\])/.test(destination) && !/[\u0000-\u0020]/.test(destination)
    ? destination : '/my-works';

  if (!email || !password) {
    return { error: 'Vui lòng nhập đầy đủ email và mật khẩu.' };
  }

  try {
    await signIn('credentials', {
      email: email.trim(),
      password,
      redirectTo,
      redirect: false,
    });
    // Keep the session cookie and destination on the same browser host.
    redirect(redirectTo);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          if ('code' in error && error.code === 'rate_limited') {
            return { error: 'Bạn đã đăng nhập quá nhiều lần. Vui lòng chờ tối đa 15 phút rồi thử lại.' };
          }
          return { error: 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.' };
        case 'CallbackRouteError':
          return { error: 'Email hoặc mật khẩu không chính xác hoặc tài khoản chưa kích hoạt.' };
        default:
          return { error: 'Đăng nhập không thành công. Vui lòng thử lại.' };
      }
    }
    // NEXT_REDIRECT must be rethrown so Next.js can perform the redirect
    throw error;
  }
}
