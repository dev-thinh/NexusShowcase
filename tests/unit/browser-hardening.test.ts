import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import nextConfig from '../../next.config';

describe('Browser Hardening & Security Headers', () => {
  it('configures security headers for all routes in next.config.ts', async () => {
    expect(nextConfig.headers).toBeDefined();
    const headersConfig = await nextConfig.headers!();
    expect(headersConfig.length).toBeGreaterThan(0);

    const rootHeader = headersConfig.find((h: any) => h.source === '/:path*');
    expect(rootHeader).toBeDefined();

    const headersMap = new Map(rootHeader!.headers.map((h: any) => [h.key, h.value]));

    expect(headersMap.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headersMap.get('X-Frame-Options')).toBe('DENY');
    expect(headersMap.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headersMap.get('Permissions-Policy')).toContain('camera=()');

    const csp = headersMap.get('Content-Security-Policy');
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain('https://www.youtube.com');
    expect(csp).toContain('https://www.loom.com');
    expect(csp).toContain('https://drive.google.com');
    expect(csp).toContain('https://fonts.googleapis.com');
  });

  it('ensures login form contains no hardcoded default credentials in source code', () => {
    const loginFormPath = path.resolve(__dirname, '../../src/features/identity/components/login-form.tsx');
    const content = fs.readFileSync(loginFormPath, 'utf-8');

    expect(content).not.toContain('admin123');
    expect(content).not.toContain('member123');
  });

  it('ensures .gitignore ignores .env but preserves .env.example', () => {
    const gitignorePath = path.resolve(__dirname, '../../.gitignore');
    const content = fs.readFileSync(gitignorePath, 'utf-8');

    expect(content).toMatch(/^\.env$/m);
    expect(content).toMatch(/^!\.env\.example$/m);
  });
});
