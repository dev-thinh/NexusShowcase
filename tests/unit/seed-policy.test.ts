import { expect, it } from 'vitest';
import { assertDemoSeedAllowed, readBootstrapAdmin } from '../../prisma/seed-policy';

it('requires a private bootstrap password with at least 15 characters within bcrypt byte limits', () => {
 for (const password of [undefined, '', '123456', 'a'.repeat(73), '界'.repeat(25)]) {
   expect(() => readBootstrapAdmin({ BOOTSTRAP_ADMIN_EMAIL: 'admin01', BOOTSTRAP_ADMIN_PASSWORD: password })).toThrow();
 }
 expect(readBootstrapAdmin({ BOOTSTRAP_ADMIN_EMAIL: ' Admin01 ', BOOTSTRAP_ADMIN_PASSWORD: 'private-long-password-2026' })).toEqual({ email: 'admin01', password: 'private-long-password-2026' });
});

it('requires explicit demo opt-in, a nonproduction process, and a demo database name segment', () => {
 const valid = { ALLOW_DEMO_SEED: 'true', NODE_ENV: 'development', DATABASE_URL: 'postgresql://user:private@localhost/nexus_demo' };
 expect(() => assertDemoSeedAllowed(valid)).not.toThrow();
 for (const invalid of [{ ALLOW_DEMO_SEED: undefined }, { ALLOW_DEMO_SEED: 'false' }, { NODE_ENV: 'production' }, { DATABASE_URL: 'postgresql://demo:private@localhost/nexus' }, { DATABASE_URL: 'postgresql://user:private@localhost/nexus_demography' }, { DATABASE_URL: 'invalid-private-url' }]) {
   expect(() => assertDemoSeedAllowed({ ...valid, ...invalid })).toThrow();
 }
});
