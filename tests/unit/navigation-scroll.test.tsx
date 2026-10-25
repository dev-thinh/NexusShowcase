import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { NavigationTransitionProvider } from '@/shared/navigation/navigation-transition';

const state = vi.hoisted(() => ({ pathname: '/members', pending: false, cursor: 0, values: [] as unknown[], effects: [] as Array<() => unknown>, push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: () => state.pathname, useRouter: () => ({ push: state.push, replace: state.replace }) }));
vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useRef: (value: unknown) => {
    const index = state.cursor++;
    return state.values[index] ??= { current: value };
  },
  useState: (value: unknown) => {
    const index = state.cursor++;
    state.values[index] ??= value;
    return [state.values[index], (next: unknown) => { state.values[index] = typeof next === 'function' ? next(state.values[index]) : next; }];
  },
  useCallback: (callback: unknown) => callback,
  useTransition: () => [state.pending, (action: () => void) => { state.pending = true; action(); }],
  useMemo: (callback: () => unknown) => callback(),
  useLayoutEffect: (effect: () => unknown) => { state.effects.push(effect); },
}));

const renderProvider = () => {
  state.cursor = 0; state.effects = [];
  return NavigationTransitionProvider({ children: null });
};
const render = () => renderProvider().props.value;
beforeEach(() => {
  vi.useFakeTimers(); state.pathname = '/members'; state.pending = false; state.values = []; vi.clearAllMocks();
  vi.stubGlobal('window', { location: { href: 'https://nexus.test/members', pathname: '/members', hash: '' }, scrollY: 1200, innerHeight: 900, scrollTo: vi.fn(), matchMedia: () => ({ matches: false }), addEventListener: vi.fn(), removeEventListener: vi.fn() });
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

it('navigates immediately without scrolling the previous page', () => {
  const navigation = render();
  expect(navigation.navigate('/contact', {})).toBe(true);
  expect(state.push).toHaveBeenCalledWith('/contact', { scroll: false });
  expect(window.scrollTo).not.toHaveBeenCalled();
});
it('keeps the existing admin workspace visible during navigation between its tabs and detail pages', () => {
  window.location.pathname = '/admin';
  window.location.href = 'https://nexus.test/admin';
  const navigation = render();
  expect(navigation.navigate('/admin/members', {})).toBe(false);
  expect(navigation.begin('/admin/reviews/submission', false)).toBeNull();
  expect(render().pathname).toBeNull();
  expect(state.push).not.toHaveBeenCalled();
  expect(window.scrollTo).not.toHaveBeenCalled();
});

it('starts smooth scrolling only after the destination commits', () => {
  render().navigate('/contact', {});
  expect(render().pathname).toBe('/contact');
  state.pathname = '/contact';
  render(); state.effects[0]();
  expect(window.scrollTo).not.toHaveBeenCalled();
  const animate = vi.mocked(requestAnimationFrame).mock.calls[0][0];
  animate(0);
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 1200, left: 0, behavior: 'instant' });
  vi.mocked(requestAnimationFrame).mock.calls[1][0](16);
  expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'smooth' });
});

it('leaves filter changes and explicit scroll=false to native navigation', () => {
  const navigation = render();
  expect(navigation.navigate('/members?page=2', {})).toBe(false);
  expect(navigation.navigate('/contact', { scroll: false })).toBe(false);
  expect(navigation.navigate('/contact#team', {})).toBe(false);
  expect(window.scrollTo).not.toHaveBeenCalled();
  expect(state.push).not.toHaveBeenCalled();
});

it('only scrolls for the latest destination when tabs are clicked rapidly', () => {
  const navigation = render();
  navigation.navigate('/contact', {});
  navigation.navigate('/', {});
  state.pathname = '/contact'; render(); state.effects[0]();
  expect(requestAnimationFrame).not.toHaveBeenCalled();
  state.pathname = '/'; render(); state.effects[0]();
  expect(requestAnimationFrame).toHaveBeenCalledOnce();
});

it.each(['/login', '/members'])('releases the loading shell when navigation redirects to %s', redirectedPath => {
  render().navigate('/dashboard', {});
  expect(renderProvider().props.children[1].props.style).toEqual({ minHeight: 2100 });
  render(); state.effects[0]();
  state.pathname = redirectedPath;
  state.pending = false;
  render(); state.effects[0]();
  expect(render().pathname).toBeNull();
  expect(window.scrollTo).not.toHaveBeenCalled();
  vi.mocked(requestAnimationFrame).mock.calls[0][0](0);
  expect(renderProvider().props.children[1].props.style).toBeUndefined();
  vi.mocked(requestAnimationFrame).mock.calls[1][0](16);
  expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'smooth' });
});

it('does not let completion of an older transition clear a newer navigation', () => {
  render().navigate('/dashboard', {});
  render(); state.effects[0]();
  state.pending = false;
  render();
  const completeOlder = state.effects[0];
  render().navigate('/contact', {});
  completeOlder();
  expect(render().pathname).toBe('/contact');
  expect(requestAnimationFrame).not.toHaveBeenCalled();
});

it('uses instant destination scrolling after a redirect when reduced motion is requested', () => {
  vi.spyOn(window, 'matchMedia').mockImplementation(() => ({ matches: true }) as MediaQueryList);
  render().navigate('/dashboard', { replace: true });
  expect(state.replace).toHaveBeenCalledWith('/dashboard', { scroll: false });
  render(); state.effects[0]();
  state.pathname = '/login'; state.pending = false;
  render(); state.effects[0]();
  vi.mocked(requestAnimationFrame).mock.calls[0][0](0);
  vi.mocked(requestAnimationFrame).mock.calls[1][0](16);
  expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'instant' });
});
