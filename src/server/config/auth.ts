export function readAuthSecret(env: Partial<Pick<NodeJS.ProcessEnv, 'AUTH_SECRET' | 'NEXTAUTH_SECRET'>>): string {
  for (const value of [env.AUTH_SECRET, env.NEXTAUTH_SECRET]) {
    if (value?.trim()) return value;
  }
  throw new Error('AUTH_SECRET must be explicitly configured.');
}
