import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/current-user', () => ({ getCurrentUser: vi.fn() }));
import { createShowcaseItemAction, updateShowcaseItemAction, reviewShowcaseItemAction } from '@/actions/showcase-actions';

describe('legacy showcase mutations', () => {
  it('requires the section workspace and direct review instead of bypassing snapshots', async () => {
    expect((await createShowcaseItemAction({} as never)).success).toBe(false);
    expect((await updateShowcaseItemAction('cjr012345678901234567890', {} as never)).success).toBe(false);
    expect((await reviewShowcaseItemAction('cjr012345678901234567890', { action: 'PUBLISH' })).success).toBe(false);
  });
});
