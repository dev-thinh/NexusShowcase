const safeLabel = /^[A-Za-z][A-Za-z0-9_.:-]{0,79}$/;
function label(value: unknown): string | undefined {
  return typeof value === 'string' && safeLabel.test(value) ? value : undefined;
}

// Deliberately exclude messages, stacks and payloads: upstream errors may embed credentials.
export function reportServerError(event: string, error: unknown, context?: { itemId?: string; actorId?: string }): void {
  const code = error && typeof error === 'object' && 'code' in error ? label(error.code) : undefined;
  console.error('[server]', {
    event: label(event) ?? 'unknown',
    name: error instanceof Error ? label(error.name) ?? 'Error' : 'UnknownError',
    code,
    itemId: label(context?.itemId),
    actorId: label(context?.actorId),
  });
}
