import { beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { HomeContentProvider, HomeText } from '@/features/publications/components/home-content-provider';
import { defaultHomeText, defaultEnglishHomeText, type HomeContentPayload, type HomeText as HomeTextValues, type HomeTextKey } from '@/features/publications/model/home-content';

const mocks = vi.hoisted(() => ({ read: vi.fn(), actor: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/features/publications/server/home-content', () => ({ readHomeContent: mocks.read }));
vi.mock('@/features/identity/server/actor', () => ({ getActor: mocks.actor }));
import HomePage from '@/app/(shell)/(site)/page';

const text = Object.fromEntries(Object.keys(defaultHomeText).map(key => [key, `Nội dung đã lưu ${key}`])) as HomeTextValues;
const initialContent: HomeContentPayload = { version: 7, englishText: defaultEnglishHomeText, text, isAdmin: false };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.read.mockResolvedValue({ version: 7, englishText: defaultEnglishHomeText, text });
  mocks.actor.mockResolvedValue(null);
});

it('renders every editable field from the saved snapshot on the first server render', () => {
  const markup = renderToStaticMarkup(<HomeContentProvider initialContent={initialContent}>
    {(Object.keys(text) as HomeTextKey[]).map(field => <HomeText key={field} field={field}>{defaultHomeText[field]}</HomeText>)}
  </HomeContentProvider>);
  for (const field of Object.keys(text) as HomeTextKey[]) {
    expect(markup).toContain(text[field]);
    expect(markup).not.toContain(defaultHomeText[field]);
  }
});

it('loads the saved document on the server and passes it to the home provider', async () => {
  const page = await HomePage({ searchParams: Promise.resolve({}) });
  expect(mocks.read).toHaveBeenCalledOnce();
  expect(page.props.initialContent).toEqual(initialContent);
});

it('derives initial admin permission from the active actor', async () => {
  mocks.actor.mockResolvedValue({ id: 'admin', role: 'ADMIN' });
  const page = await HomePage({ searchParams: Promise.resolve({}) });
  expect(page.props.initialContent).toEqual({ ...initialContent, isAdmin: true });
});

it('does not substitute default copy when reading the saved document fails', async () => {
  mocks.read.mockRejectedValue(new Error('Content unavailable'));
  await expect(HomePage({ searchParams: Promise.resolve({}) })).rejects.toThrow('Content unavailable');
});
