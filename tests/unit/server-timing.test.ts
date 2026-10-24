import { measureServerOperation, recordQueryDuration } from '@/server/observability/timing';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
describe('opt-in server timing', () => {
  it('preserves results and errors while emitting nothing by default', async () => {
    vi.stubEnv('PERF_METRICS', '0');
    const output = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(await measureServerOperation('auth', async () => 'private-result')).toBe('private-result');
    const error = new Error('private-error');
    await expect(measureServerOperation('query', async () => { throw error; })).rejects.toBe(error);
    recordQueryDuration(12);
    expect(output).not.toHaveBeenCalled();
  });
  it('emits only numeric timing and a fixed operation name, including failures', async () => {
    vi.stubEnv('PERF_METRICS', '1');
    const output = vi.spyOn(console, 'log').mockImplementation(() => {});
    await expect(measureServerOperation('auth', async () => { throw Error('secret'); })).rejects.toThrow('secret');
    recordQueryDuration(7.5);
    recordQueryDuration(Number.NaN);
    recordQueryDuration(-1);
    const records = output.mock.calls.map(call => JSON.parse(String(call[0]).replace('[perf] ', '')));
    expect(records).toHaveLength(2);
    expect(records[0]).toEqual({ name: 'auth', durationMs: expect.any(Number), timestamp: expect.any(Number) });
    expect(records[1]).toEqual({ name: 'query', durationMs: 7.5, timestamp: expect.any(Number) });
    expect(JSON.stringify(records)).not.toContain('secret');
  });
});
