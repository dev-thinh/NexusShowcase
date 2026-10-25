import bcrypt from 'bcryptjs';
import type { NextAuthConfig } from 'next-auth';
import type { CredentialsConfig } from 'next-auth/providers/credentials';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ config: null as NextAuthConfig | null, findUnique: vi.fn(), findMany: vi.fn(), throttle: vi.fn(async (_input: { key: string }) => ({ allowed: true, retryAfterSeconds: 0 })) }));
vi.mock('next-auth', () => ({ default: (config: NextAuthConfig) => { mocks.config = config; return {}; } }));
vi.mock('@/server/db/prisma', () => ({ prisma: { $queryRaw: mocks.findMany, user: { findUnique: mocks.findUnique } } }));
vi.mock('@/features/identity/server/rate-limit', () => ({ consumeRateLimit: mocks.throttle }));
vi.stubEnv('AUTH_SECRET', 'unit-test-config-only');
await import('@/features/identity/server/auth');

beforeEach(() => { vi.clearAllMocks(); mocks.throttle.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 }); });

describe('installed auth callbacks', () => {
  it.each([null, { status: 'SUSPENDED', sessionVersion: 1 }, { status: 'ACTIVE', deletedAt: new Date(), sessionVersion: 1 }, { status: 'ACTIVE', sessionVersion: 2 }])('revokes invalid database identity %j', async row => {
    mocks.findUnique.mockResolvedValue(row);
    const jwt = mocks.config!.callbacks!.jwt!;
    expect(await jwt({ token: { id: 'user', status: 'ACTIVE', sessionVersion: 1 } } as unknown as Parameters<typeof jwt>[0])).toBeNull();
  });
  it('refreshes role and password policy from the database', async () => {
    mocks.findUnique.mockResolvedValue({ role: 'MEMBER', status: 'ACTIVE', mustChangePassword: true, sessionVersion: 1 });
    const jwt = mocks.config!.callbacks!.jwt!;
    expect(await jwt({ token: { id: 'user', sessionVersion: 1 } } as unknown as Parameters<typeof jwt>[0])).toMatchObject({ role: 'MEMBER', mustChangePassword: true });
  });
  it('never exposes an authenticated user for an invalid token', async () => {
    const session = mocks.config!.callbacks!.session!;
    const result = await session({ session: { expires: 'future', user: {} }, token: { status: 'SUSPENDED' } } as unknown as Parameters<typeof session>[0]);
    expect(result?.user).toBeUndefined();
  });

  it('uses the actual credentials provider and rejects suspended or deleted accounts', async () => {
    const provider = mocks.config!.providers[0] as CredentialsConfig & { options: Partial<CredentialsConfig> };
    const authorize = provider.options.authorize!;
    const passwordHash = await bcrypt.hash('correct-password', 4);
    mocks.findMany.mockResolvedValue([{ id: 'user', role: 'MEMBER', fullName: 'Test', status: 'ACTIVE', passwordHash, mustChangePassword: true, sessionVersion: 1 }]);
    expect(await authorize({ email: 'member', password: 'correct-password' }, new Request('http://localhost'))).toMatchObject({ id: 'user', mustChangePassword: true, sessionVersion: 1 });
    expect(await authorize({ email: 'member', password: 'wrong-password' }, new Request('http://localhost'))).toBeNull();
    mocks.findMany.mockResolvedValue([{ status: 'SUSPENDED', passwordHash }]);
    expect(await authorize({ email: 'member', password: 'correct-password' }, new Request('http://localhost'))).toBeNull();
    mocks.findMany.mockResolvedValue([{ status: 'ACTIVE', deletedAt: new Date(), passwordHash }]);
    expect(await authorize({ email: 'member', password: 'correct-password' }, new Request('http://localhost'))).toBeNull();
  });
});

it('rejects ambiguous legacy aliases before password verification', async () => {
 const provider = mocks.config!.providers[0] as CredentialsConfig & { options: Partial<CredentialsConfig> };
 mocks.findMany.mockResolvedValue([{ id: 'one' }, { id: 'two' }]);
 expect(await provider.options.authorize!({ email: 'member', password: 'correct-password' }, new Request('http://localhost'))).toBeNull();
});


it('keeps both historic domain aliases and normalizes login casing', async () => {
 const provider = mocks.config!.providers[0] as CredentialsConfig & { options: Partial<CredentialsConfig> };
 mocks.findMany.mockResolvedValue([]);
 await provider.options.authorize!({ email: '  Member  ', password: 'correct-password' }, new Request('http://localhost'));
 expect(mocks.findMany.mock.calls[0][0].values).toEqual(['member', 'member@robotics.hcmus.edu.vn', 'member@nexus.hcmus.edu.vn']);
});
it('rejects login before database identity lookup when shared throttle denies it', async () => {
 const provider = mocks.config!.providers[0] as CredentialsConfig & { options: Partial<CredentialsConfig> };
 mocks.throttle.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 1 });
 mocks.findMany.mockClear();
 expect(await provider.options.authorize!({ email: 'member', password: 'correct-password' }, new Request('http://localhost'))).toBeNull();
 expect(mocks.findMany).not.toHaveBeenCalled();
});

it('shares a login throttle across institutional aliases without changing unrelated emails', async () => {
 const provider = mocks.config!.providers[0] as CredentialsConfig & { options: Partial<CredentialsConfig> };
 mocks.findMany.mockResolvedValue([]);
 for (const email of ['Member', 'Member@robotics.hcmus.edu.vn', 'Member@nexus.hcmus.edu.vn', 'Member@example.test']) {
   await provider.options.authorize!({ email, password: 'correct-password' }, new Request('http://localhost'));
 }
 expect(mocks.throttle.mock.calls.map(call => (call[0] as { key: string }).key)).toEqual(['member', 'member', 'member', 'member@example.test']);
});
