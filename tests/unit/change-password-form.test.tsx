import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
vi.mock('@/features/identity/server/account-actions', () => ({ changePasswordAction: vi.fn() }));
vi.mock('next-auth/react', () => ({ signOut: vi.fn() }));
import { ChangePasswordForm } from '@/features/identity/components/change-password-form';

it('does not display password requirements or errors before validation', () => {
  const html = renderToStaticMarkup(<ChangePasswordForm embedded />);
  expect(html).toContain('Mật khẩu mới');
  expect(html).not.toContain('Cần có ít nhất 8 ký tự');
  expect(html).not.toContain('role="alert"');
  expect(html).not.toContain('new-hint');
});

it('provides an independent visibility control for every masked password field', () => {
  const html = renderToStaticMarkup(<ChangePasswordForm embedded />);
  for (const name of ['mật khẩu hiện tại', 'mật khẩu mới', 'xác nhận mật khẩu mới']) {
    expect(html).toContain(`aria-label="Hiện ${name}"`);
  }
  expect(html.match(/type="password"/g)).toHaveLength(3);
  expect(html.match(/aria-pressed="false"/g)).toHaveLength(3);
});
