/** Harness-only numeric events. Never attach query text, arguments or auth results. */
function emit(name: 'auth' | 'query', durationMs: number) {
  if (process.env.PERF_METRICS !== '1' || !Number.isFinite(durationMs) || durationMs < 0) return;
  console.log(`[perf] ${JSON.stringify({ name, durationMs, timestamp: Date.now() })}`);
}

export async function measureServerOperation<T>(name: 'auth' | 'query', operation: () => Promise<T>): Promise<T> {
  if (process.env.PERF_METRICS !== '1') return operation();
  const start = performance.now();
  try { return await operation(); } finally { emit(name, performance.now() - start); }
}

export function recordQueryDuration(durationMs: number): void { emit('query', durationMs); }
