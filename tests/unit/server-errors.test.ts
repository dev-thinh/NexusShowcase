import { reportServerError } from '@/server/observability/errors';
import { expect, it, vi } from 'vitest';

it('records safe error metadata without messages, payloads, URLs or stacks', () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const error = Object.assign(new Error('postgres://user:secret@host/db payload'), { code: 'P2034' });
  reportServerError('draft.save', error, { actorId: 'member-1', itemId: 'item-1' });
  expect(log).toHaveBeenCalledWith('[server]', { event: 'draft.save', name: 'Error', code: 'P2034', actorId: 'member-1', itemId: 'item-1' });
  expect(JSON.stringify(log.mock.calls)).not.toContain('secret');
  log.mockRestore();
});
