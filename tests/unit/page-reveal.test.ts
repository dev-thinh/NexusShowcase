import { PageReveal } from '@/shared/ui/page-reveal';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({ pathname: '/', ref: undefined as { current: string | null } | undefined, effect: undefined as (() => void | (() => void)) | undefined }));
vi.mock('react', () => ({ useRef: (value: string) => hooks.ref ??= { current: value }, useEffect: (effect: () => void | (() => void)) => { hooks.effect = effect; } }));
vi.mock('next/navigation', () => ({ usePathname: () => hooks.pathname }));

class ElementStub {
  dataset: Record<string, string> = {};
  style = { setProperty: vi.fn(), removeProperty: vi.fn() };
  parentElement = null;
  animation = { playState: 'running', pause: vi.fn(() => { this.animation.playState = 'paused'; }), play: vi.fn(() => { this.animation.playState = 'running'; }), cancel: vi.fn(), onfinish: null };
  animate = vi.fn(() => this.animation);
  constructor(public top: number) {}
  closest() { return null; }
  matches() { return true; }
  querySelectorAll() { return []; }
  querySelector() { return null; }
  getBoundingClientRect() { return { top: this.top, bottom: this.top + 100 }; }
}

let intersect: (entries: { target: ElementStub; isIntersecting: boolean }[]) => void;
let mutate: (records: Array<{ addedNodes: ElementStub[] }>) => void;
const queryAll = vi.fn();
let reduced = false;
let elements: ElementStub[];
const observe = vi.fn();
const unobserve = vi.fn();
const disconnect = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  reduced = false;
  hooks.pathname = '/';
  hooks.ref = undefined;
  elements = [new ElementStub(40), new ElementStub(1200)];
  const media = { get matches() { return reduced; }, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  const Observer = class {
    constructor(callback: typeof intersect) { intersect = callback; }
    observe = observe;
    unobserve = unobserve;
    disconnect = disconnect;
  };
  vi.stubGlobal('HTMLElement', ElementStub);
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('IntersectionObserver', Observer);
  vi.stubGlobal('MutationObserver', class { constructor(callback: typeof mutate) { mutate = callback; } observe() {} disconnect() {} });
  vi.stubGlobal('window', {
    innerHeight: 800, matchMedia: () => media, IntersectionObserver: Observer,
    location: { hash: '' }, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  });
  vi.stubGlobal('document', {
    body: {}, querySelectorAll: queryAll.mockImplementation(() => elements),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  });
});
afterEach(() => vi.unstubAllGlobals());

const mount = () => { PageReveal(); return hooks.effect?.(); };

describe('page content reveal', () => {
  it('freezes a moving click target through pointer focus and resumes after pointerup', () => {
    mount();
    const listener = (type: string) => vi.mocked(document.addEventListener).mock.calls.find(([name]) => name === type)![1] as (event: unknown) => void;
    listener('pointerdown')({ target: elements[0] });
    listener('focusin')({ target: elements[0] });
    expect(elements[0].animation.pause).toHaveBeenCalledOnce();
    expect(elements[0].animation.cancel).not.toHaveBeenCalled();
    listener('pointerup')({});
    expect(elements[0].animation.play).not.toHaveBeenCalled();
    (vi.mocked(requestAnimationFrame).mock.calls[0][0] as () => void)();
    expect(elements[0].animation.play).toHaveBeenCalledOnce();
  });
  it('releases completed animations without replaying them on later observer callbacks', () => {
    const cleanup = mount();
    const target = elements[0];
    (target.animation.onfinish as unknown as () => void)();
    intersect([{ target, isIntersecting: true }]);
    expect(target.animate).toHaveBeenCalledOnce();
    if (typeof cleanup === 'function') cleanup();
    expect(target.animation.cancel).toHaveBeenCalledOnce();
  });
  it('waits until content is clearly inside the viewport rather than revealing at its bottom edge', () => {
    elements = [new ElementStub(750)];
    mount();
    expect(elements[0].animate).not.toHaveBeenCalled();
    expect(observe.mock.calls.some(([node]) => node === elements[0])).toBe(true);
    intersect([{ target: elements[0], isIntersecting: true }]);
    const options = elements[0].animate.mock.calls[0] as unknown as [unknown, { delay: number; duration: number; fill: string }];
    expect(options[1]).toMatchObject({ delay: 100, duration: 600, fill: 'backwards' });
  });
  it('reveals visible content immediately and waits for scroll on offscreen content', () => {
    mount();
    expect(elements[0].animate).toHaveBeenCalled();
    expect(elements[1].animate).not.toHaveBeenCalled();
    expect(elements[0].animation.pause).not.toHaveBeenCalled();
    expect(observe.mock.calls.some(([node]) => node === elements[1])).toBe(true);
    intersect([{ target: elements[1], isIntersecting: true }]);
    expect(elements[1].animate).toHaveBeenCalled();
    expect(unobserve.mock.calls.some(([node]) => node === elements[1])).toBe(true);
  });

  it('also reveals content after a route change, with a perceptible smooth duration', () => {
    const cleanup = mount();
    if (typeof cleanup === 'function') cleanup();
    hooks.pathname = '/members';
    elements = [new ElementStub(80)];
    mount();
    expect(elements[0].animate).toHaveBeenCalled();
    const options = elements[0].animate.mock.calls[0] as unknown as [unknown, { duration: number }];
    expect(options[1].duration).toBeGreaterThanOrEqual(300);
  });

  it('leaves all content untouched when reduced motion is enabled', () => {
    reduced = true;
    mount();
    expect(elements.every(element => Object.keys(element.dataset).length === 0)).toBe(true);
    expect(observe).not.toHaveBeenCalled();
  });

  it('disconnects observers and restores visible content on route cleanup', () => {
    const cleanup = mount();
    if (typeof cleanup === 'function') cleanup();
    expect(disconnect).toHaveBeenCalled();
    expect(elements[0].animation.cancel).toHaveBeenCalled();
    expect(elements[1].animate).not.toHaveBeenCalled();
    expect(elements.every(element => Object.keys(element.dataset).length === 0)).toBe(true);
  });
  it('registers streamed subtrees without rescanning the entire document on every mutation', () => {
    mount();
    const streamed = new ElementStub(80);
    for (let index = 0; index < 20; index++) mutate([{ addedNodes: [streamed] }]);
    expect(queryAll).toHaveBeenCalledTimes(1);
    expect(streamed.animate).toHaveBeenCalledTimes(1);
  });
  it('settles focused content without moving the target during a pointer click', () => {
    mount();
    const target = elements[1];
    const focus = vi.mocked(document.addEventListener).mock.calls.find(([type]) => type === 'focusin')![1] as (event: unknown) => void;
    focus({ target });
    expect(target.animate).not.toHaveBeenCalled();
    expect(unobserve.mock.calls.some(([node]) => node === target)).toBe(true);
    intersect([{ target, isIntersecting: true }]);
    expect(target.animate).not.toHaveBeenCalled();
  });
  it('cancels an active entry animation when its controls receive focus', () => {
    mount();
    const focus = vi.mocked(document.addEventListener).mock.calls.find(([type]) => type === 'focusin')![1] as (event: unknown) => void;
    focus({ target: elements[0] });
    expect(elements[0].animation.cancel).toHaveBeenCalledOnce();
  });
});
