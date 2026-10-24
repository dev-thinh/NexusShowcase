type TextField = HTMLInputElement | HTMLTextAreaElement;
interface Composition {
  field: TextField;
  before: string;
}
interface Departure extends Composition {
  draft: string;
}

function textField(target: EventTarget | null): TextField | null {
  if (target instanceof HTMLTextAreaElement) return target;
  return target instanceof HTMLInputElement && ['text', 'search', 'email', 'url', 'tel', 'password'].includes(target.type) ? target : null;
}

/** Preserve a preedit that an IME discards specifically because focus leaves it. */
export function installImeBlurGuard(document: Document) {
  let composition: Composition | null = null;
  let departure: Departure | null = null;

  const snapshot = () => {
    if (!composition || composition.field.value === composition.before) return;
    departure = { ...composition, draft: composition.field.value };
  };
  const restore = () => {
    if (!departure) return;
    const { field, before, draft } = departure;
    // A normal commit, explicit edit, or replacement must remain untouched.
    if (!field.isConnected || field.value !== before || draft === before) return;
    const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (!setter) return;
    setter.call(field, draft);
    // Notify React as well as native forms, so the saved value matches the DOM.
    field.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const onStart = (event: Event) => {
    const field = textField(event.target);
    composition = field ? { field, before: field.value } : null;
    departure = null;
  };
  const onPointerDown = (event: PointerEvent) => {
    if (composition && event.target !== composition.field) snapshot();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      snapshot();
      const pending = departure;
      // IME candidate selection can consume Tab without moving focus.
      setTimeout(() => {
        if (departure === pending && pending?.field === document.activeElement) departure = null;
      }, 0);
    }
    else if (event.key === 'Escape') { composition = null; departure = null; }
  };
  const onEnd = (event: CompositionEvent) => {
    if (composition?.field !== event.target) return;
    if (!event.data) restore();
    composition = null;
  };
  const onBlur = (event: FocusEvent) => {
    if (departure?.field !== event.target) return;
    restore();
    const pending = departure;
    // Some IMEs deliver their final cancellation input after blur.
    queueMicrotask(() => {
      if (departure !== pending) return;
      restore();
      departure = null;
    });
  };
  const onPointerUp = () => {
    // A prevented focus change must not leave a stale snapshot behind.
    if (departure?.field === document.activeElement) departure = null;
  };

  document.addEventListener('compositionstart', onStart, { capture: true });
  document.addEventListener('compositionend', onEnd, { capture: true });
  document.addEventListener('pointerdown', onPointerDown, { capture: true });
  document.addEventListener('pointerup', onPointerUp, { capture: true });
  document.addEventListener('keydown', onKeyDown, { capture: true });
  document.addEventListener('blur', onBlur, { capture: true });
  return () => {
    composition = null;
    departure = null;
    document.removeEventListener('compositionstart', onStart, { capture: true });
    document.removeEventListener('compositionend', onEnd, { capture: true });
    document.removeEventListener('pointerdown', onPointerDown, { capture: true });
    document.removeEventListener('pointerup', onPointerUp, { capture: true });
    document.removeEventListener('keydown', onKeyDown, { capture: true });
    document.removeEventListener('blur', onBlur, { capture: true });
  };
}
