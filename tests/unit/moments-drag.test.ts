import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({ effects: [] as Array<() => void | (() => void)>, setDrag: vi.fn() }));
vi.mock('react', () => ({
  useEffect: (effect: () => void | (() => void)) => hooks.effects.push(effect),
  useRef: (value: unknown) => ({ current: value }),
  useState: () => [null, hooks.setDrag],
}));
import { useMomentsDrag } from '@/features/publications/components/use-moments-drag';

class PhotoElement extends EventTarget {
  dataset = { momentDrag: 'photo' };
  closest() { return this; }
  contains() { return true; }
  matches() { return false; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 }; }
}
let root: PhotoElement;
let windowTarget: EventTarget;
let cleanup: (() => void) | void;
const dispatch = (target: EventTarget, type: string, props: Record<string, unknown>) => {
  const event = new Event(type, { cancelable: true });
  Object.assign(event, props);
  target.dispatchEvent(event);
};
const down = () => dispatch(root, 'pointerdown', { pointerType: 'mouse', button: 0, buttons: 1, isPrimary: true, pointerId: 1, clientX: 10, clientY: 10 });

beforeEach(() => {
  vi.useFakeTimers(); hooks.effects.length = 0; hooks.setDrag.mockClear();
  root = new PhotoElement(); windowTarget = new EventTarget();
  vi.stubGlobal('Element', PhotoElement);
  vi.stubGlobal('window', windowTarget);
  vi.stubGlobal('document', { elementFromPoint: () => null });
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  useMomentsDrag({ current: root as unknown as HTMLDivElement }, false, vi.fn());
  cleanup = hooks.effects[0]();
});
afterEach(() => { cleanup?.(); vi.useRealTimers(); vi.unstubAllGlobals(); });

it('does not start dragging when the mouse is held still over a photo', () => {
  down(); vi.advanceTimersByTime(500);
  expect(requestAnimationFrame).not.toHaveBeenCalled();
});

it('cancels a drag after a lost mouse release instead of continuing to auto-scroll', () => {
  down();
  dispatch(windowTarget, 'pointermove', { pointerId: 1, buttons: 1, clientX: 30, clientY: 30 });
  expect(requestAnimationFrame).toHaveBeenCalledOnce();
  hooks.setDrag.mockClear();
  dispatch(windowTarget, 'pointermove', { pointerId: 1, buttons: 0, clientX: 35, clientY: 35 });
  expect(hooks.setDrag).toHaveBeenLastCalledWith(null);
  expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
});

it('cancels photo dragging when the user switches to the mouse wheel', () => {
  down();
  dispatch(windowTarget, 'pointermove', { pointerId: 1, buttons: 1, clientX: 30, clientY: 30 });
  hooks.setDrag.mockClear();
  dispatch(root, 'wheel', {});
  expect(hooks.setDrag).toHaveBeenLastCalledWith(null);
});
