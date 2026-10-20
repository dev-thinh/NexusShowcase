import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({ effect: undefined as (() => void | (() => void)) | undefined }));
vi.mock('react', () => ({ useRef: (value: string) => ({ current: value }), useEffect: (effect: () => void | (() => void)) => { hooks.effect = effect; } }));
vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
import { PageReveal } from '@/components/page-reveal';

class ElementStub {
  dataset: Record<string, string> = {};
  style = { setProperty: vi.fn(), removeProperty: vi.fn() };
  parentElement = null;
  animation = { playState: 'running', pause: vi.fn(() => { this.animation.playState = 'paused'; }), play: vi.fn(() => { this.animation.playState = 'running'; }), cancel: vi.fn(), onfinish: null };
  animate() { return this.animation; }
  constructor(public top: number) {}
  closest() { return null; }
  getBoundingClientRect() { return { top: this.top, bottom: this.top + 100 }; }
}

let intersect: (entries: { target: ElementStub; isIntersecting: boolean }[]) => void;
let reduced = false;
let elements: ElementStub[];
const observe = vi.fn();
const unobserve = vi.fn();
const disconnect = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  reduced = false;
  elements = [new ElementStub(40), new ElementStub(1200)];
  const media = { get matches() { return reduced; }, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  const Observer = class {
    constructor(callback: typeof intersect) { intersect = callback; }
    observe = observe;
    unobserve = unobserve;
    disconnect = disconnect;
  };
  vi.stubGlobal('HTMLElement', ElementStub);
  vi.stubGlobal('IntersectionObserver', Observer);
  vi.stubGlobal('MutationObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('window', {
    innerHeight: 800, matchMedia: () => media, IntersectionObserver: Observer,
    location: { hash: '' }, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  });
  vi.stubGlobal('document', {
    body: {}, querySelectorAll: () => elements,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  });
});
afterEach(() => vi.unstubAllGlobals());

const mount = () => { PageReveal(); return hooks.effect?.(); };

describe('page content reveal', () => {
  it('reveals visible content immediately and waits for scroll on offscreen content', () => {
    mount();
    expect(elements[0].animation.play).toHaveBeenCalled();
    expect(elements[1].animation.play).not.toHaveBeenCalled();
    expect(observe.mock.calls.some(([node]) => node === elements[1])).toBe(true);
    intersect([{ target: elements[1], isIntersecting: true }]);
    expect(elements[1].animation.play).toHaveBeenCalled();
    expect(unobserve.mock.calls.some(([node]) => node === elements[1])).toBe(true);
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
    expect(elements.every(element => element.animation.cancel.mock.calls.length > 0)).toBe(true);
    expect(elements.every(element => Object.keys(element.dataset).length === 0)).toBe(true);
  });
});
