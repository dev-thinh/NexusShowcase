import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ params: new URLSearchParams() }));
vi.mock('@/components/navbar', () => ({ Navbar: () => React.createElement('header', null, 'CLB Robotics & IoT') }));
vi.mock('next/navigation', () => ({ useSearchParams: () => mocks.params }));
vi.mock('@/app/login/actions', () => ({ loginAction: vi.fn() }));
vi.stubGlobal('React', React);

import LoginPage from '@/app/login/page';
import { LoginForm } from '@/app/login/login-form';

beforeEach(() => { mocks.params = new URLSearchParams(); });

describe('login page', () => {
  it('restores the original split-screen login layout', async () => {
    const html = renderToStaticMarkup(await LoginPage());
    expect(html).toContain('lg:grid-cols-12');
    expect(html).toContain('Ươm mầm nghiên cứu');
    expect(html).toContain('max-w-7xl');
    expect(html).toContain('sm:px-6');
    expect(html).toContain('lg:px-8');
    expect(html.match(/<h1\b/g)).toHaveLength(2);
    expect(html).toContain('max-w-lg');
    expect(html).not.toContain('<footer');
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/contact"');
  });

  it('preserves the original branding, background and navigation links', async () => {
    const html = renderToStaticMarkup(await LoginPage());
    expect(html).toContain('CLB Robotics &amp; IoT');
    expect(html).toContain('Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM');
    expect(html).toContain('href="/contact"');
    expect(html).toContain('href="/"');
    expect(html).toContain('blur-3xl');
  });

  it('provides labeled inputs, password-manager autocomplete and password visibility control', () => {
    const html = renderToStaticMarkup(React.createElement(LoginForm));
    expect(html).toContain('for="identifier"');
    expect(html).toContain('for="password"');
    expect(html).toContain('autoComplete="username"');
    expect(html).toContain('autoComplete="current-password"');
    expect(html).toContain('type="password"');
    expect(html).toContain('aria-label="Hiện mật khẩu"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('type="submit"');
    expect(html).toContain('uppercase');
  });

  it('shows the password-change confirmation', () => {
    mocks.params = new URLSearchParams('passwordChanged=1');
    const html = renderToStaticMarkup(React.createElement(LoginForm));
    expect(html).toContain('role="status"');
    expect(html).toContain('Đã đổi mật khẩu thành công');
  });
});
