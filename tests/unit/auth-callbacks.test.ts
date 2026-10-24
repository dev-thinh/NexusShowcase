import bcrypt from 'bcryptjs';
import type { NextAuthConfig } from 'next-auth';
import type { CredentialsConfig } from 'next-auth/providers/credentials';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ config: null as NextAuthConfig | null, findUnique: vi.fn(), findFirst: vi.fn() }));
vi.mock('next-auth', () => ({ default: (config: NextAuthConfig) => { mocks.config = config; return {}; } }));
vi.mock('@/server/db/prisma', () => ({ prisma: { user: { findUnique: mocks.findUnique, findFirst: mocks.findFirst } } }));
vi.stubEnv('AUTH_SECRET', 'unit-test-config-only');
await import('@/features/identity/server/auth');

describe('installed auth callbacks', () => {
  beforeEach(() => vi.clearAllMocks());
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
    mocks.findFirst.mockResolvedValue({ id: 'user', role: 'MEMBER', fullName: 'Test', status: 'ACTIVE', passwordHash, mustChangePassword: true, sessionVersion: 1 });
    expect(await authorize({ email: 'member', password: 'correct-password' }, new Request('http://localhost'))).toMatchObject({ id: 'user', mustChangePassword: true, sessionVersion: 1 });
    expect(await authorize({ email: 'member', password: 'wrong-password' }, new Request('http://localhost'))).toBeNull();
    mocks.findFirst.mockResolvedValue({ status: 'SUSPENDED', passwordHash });
    expect(await authorize({ email: 'member', password: 'correct-password' }, new Request('http://localhost'))).toBeNull();
    mocks.findFirst.mockResolvedValue({ status: 'ACTIVE', deletedAt: new Date(), passwordHash });
    expect(await authorize({ email: 'member', password: 'correct-password' }, new Request('http://localhost'))).toBeNull();
  });
});
