import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/current-user', () => ({ getCurrentUser: vi.fn(async () => null) }));
import * as legacy from '@/actions/editorial-actions';

describe('retired editorial endpoints', () => {
  it.each(Object.entries(legacy).filter(([name]) => !['archiveShowcaseAction', 'reopenShowcaseAction'].includes(name)))('%s cannot mutate articles through the retired workflow', async (_name, action) => {
    expect((await action('cjr012345678901234567890')).success).toBe(false);
  });
});
