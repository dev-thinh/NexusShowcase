type SeedEnvironment = Partial<Record<'BOOTSTRAP_ADMIN_EMAIL' | 'BOOTSTRAP_ADMIN_PASSWORD' | 'ALLOW_DEMO_SEED' | 'NODE_ENV' | 'DATABASE_URL', string>>;

export function readBootstrapAdmin(env: SeedEnvironment) {
  const email = env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || email.length > 254 || !password || [...password].length < 15 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Configure a bootstrap admin identifier and a private password of at least 15 characters and at most 72 UTF-8 bytes.');
  }
  return { email, password };
}

export function assertDemoSeedAllowed(env: SeedEnvironment) {
  let disposable = false;
  try {
    const url = new URL(env.DATABASE_URL ?? '');
    disposable = ['postgres:', 'postgresql:'].includes(url.protocol) && /(^|[-_])demo($|[-_])/.test(decodeURIComponent(url.pathname.slice(1)));
  } catch { /* Never include a connection URL in diagnostics. */ }
  if (env.ALLOW_DEMO_SEED !== 'true' || env.NODE_ENV === 'production' || !disposable) {
    throw new Error('Demo seed requires ALLOW_DEMO_SEED=true, nonproduction NODE_ENV, and a database name containing a demo segment.');
  }
}
