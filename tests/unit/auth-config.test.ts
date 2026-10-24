import { readAuthSecret } from '@/server/config/auth';
import { describe, expect, it } from 'vitest';

describe('auth secret configuration', () => {
  it('requires explicit auth secret', () => {
    expect(() => readAuthSecret({})).toThrow(/AUTH_SECRET/);
    expect(() => readAuthSecret({ AUTH_SECRET: ' ', NEXTAUTH_SECRET: '\n' })).toThrow(/AUTH_SECRET/);
  });
  it('uses a nonblank explicit secret with legacy fallback', () => {
    expect(readAuthSecret({ AUTH_SECRET: 'configured', NEXTAUTH_SECRET: 'legacy' })).toBe('configured');
    expect(readAuthSecret({ AUTH_SECRET: ' ', NEXTAUTH_SECRET: 'legacy' })).toBe('legacy');
  });
});
