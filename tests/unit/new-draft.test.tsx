import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { NewDraft } from '@/features/submissions/components/new-draft';

const hooks = vi.hoisted(() => ({ states: [] as unknown[], refs: [] as { current: unknown }[], cursor: 0, refCursor: 0, effect: undefined as (() => void | (() => void)) | undefined, create: vi.fn(), replace: vi.fn(), history: vi.fn() }));
vi.mock('react', async original => ({
  ...await original<typeof import('react')>(),
  useState: (initial: unknown) => {
    const i = hooks.cursor++;
    if (!(i in hooks.states)) hooks.states[i] = initial;
    return [hooks.states[i], (value: unknown) => { hooks.states[i] = value; }];
  },
  useRef: (initial: unknown) => hooks.refs[hooks.refCursor++] ?? (hooks.refs[hooks.refCursor - 1] = { current: initial }),
  useEffect: (effect: typeof hooks.effect) => { hooks.effect = effect; },
  startTransition: (run: () => void) => run(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: hooks.replace }) }));
vi.mock('@/features/submissions/server/actions', () => ({ createShowcaseDraftAction: hooks.create }));
vi.mock('@/features/submissions/components/submission-editor', () => ({ SubmissionEditor: () => null }));
import { SubmissionEditor } from '@/features/submissions/components/submission-editor';

const currentUser = { id: 'author', fullName: 'Author', role: 'CORE_MEMBER' as const };
const categories = [{ id: 'category', name: 'Project', slug: 'robotics-iot' }];
const storage = new Map<string, string>();
beforeEach(() => {
  vi.clearAllMocks();
  hooks.states = []; hooks.refs = []; hooks.effect = undefined;
  storage.clear();
  vi.stubGlobal('window', { history: { replaceState: hooks.history }, sessionStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) } });
  hooks.create.mockResolvedValue({ success: true, data: { id: 'draft-id', status: 'DRAFT', reviewVersion: 0 } });
});
afterEach(() => vi.unstubAllGlobals());
function render() {
  hooks.cursor = 0; hooks.refCursor = 0;
  return NewDraft({ accountId: currentUser.id, currentUser, categories });
}

it('opens the created workspace without a second server navigation and clears the creation receipt', async () => {
  render();
  hooks.effect?.();
  await vi.waitFor(() => expect(hooks.history).toHaveBeenCalledWith(null, '', '/my-works/draft-id/edit'));
  const editor = render() as ReactElement<Record<string, unknown>>;
  expect(editor.type).toBe(SubmissionEditor);
  expect(editor.props).toMatchObject({ currentUser, categories, initialData: { id: 'draft-id', reviewVersion: 0, draftSnapshot: true, citationEnabled: false } });
  expect(hooks.replace).not.toHaveBeenCalled();
  expect(storage.has('nexus:new-draft:author')).toBe(false);
});

it('retains the same mutation ID after a failed creation so retries cannot duplicate drafts', async () => {
  hooks.create.mockResolvedValue({ success: false, error: 'Try again' });
  render(); hooks.effect?.();
  await vi.waitFor(() => expect(hooks.create).toHaveBeenCalledOnce());
  expect(storage.get('nexus:new-draft:author')).toBe(hooks.create.mock.calls[0][0].mutationId);
  expect(hooks.history).not.toHaveBeenCalled();
  expect(render().type).not.toBe(SubmissionEditor);
});
