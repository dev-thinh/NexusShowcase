'use server';

import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';

export type LoginState = {
  error?: string;
  success?: boolean;
} | null;

export async function loginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = (formData.get('redirectTo') as string) || '/dashboard';

  if (!email || !password) {
    return { error: 'Vui lòng nhập đầy đủ email và mật khẩu.' };
  }

  try {
    await signIn('credentials', {
      email: email.trim(),
      password,
      redirectTo,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
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
