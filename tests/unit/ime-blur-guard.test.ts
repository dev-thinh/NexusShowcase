import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installImeBlurGuard } from '@/lib/ime-blur-guard';

class Input extends EventTarget {
  type = 'text';
  isConnected = true;
  private text = '';
  get value() { return this.text; }
  set value(value: string) { this.text = value; }
}
class Textarea extends Input {
  get value() { return super.value; }
  set value(value: string) { super.value = value; }
}
let document: EventTarget & { activeElement: Input | null };
let field: Input;
let dispose: () => void;
function emit(type: string, target: Input, props: Record<string, unknown> = {}) {
  const event = new Event(type);
  Object.defineProperty(event, 'target', { value: target });
  for (const [key, value] of Object.entries(props)) Object.defineProperty(event, key, { value });
  document.dispatchEvent(event);
}
function compose() {
  field.value = 'con ';
  emit('compositionstart', field);
  field.value = 'con sóc';
}
function losePreedit() {
  field.value = 'con ';
  emit('compositionend', field, { data: '' });
  document.activeElement = new Input();
  emit('blur', field);
}
beforeEach(() => {
  vi.stubGlobal('HTMLInputElement', Input);
  vi.stubGlobal('HTMLTextAreaElement', Textarea);
  field = new Input();
  document = Object.assign(new EventTarget(), { activeElement: field as Input | null });
  dispose = installImeBlurGuard(document as unknown as Document);
});
afterEach(() => { dispose(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('IME focus changes', () => {
  it.each(['input', 'textarea'])('preserves an uncommitted Vietnamese word in %s when clicking another field', async kind => {
    if (kind === 'textarea') field = new Textarea();
    const saved: string[] = [];
    field.addEventListener('input', () => saved.push(field.value));
    compose();
    emit('pointerdown', new Input());
    losePreedit();
    await Promise.resolve();
    expect(field.value).toBe('con sóc');
    expect(saved).toEqual(['con sóc']);
  });
  it('preserves the word when moving to another field with Tab', () => {
    compose();
    emit('keydown', field, { key: 'Tab' });
    losePreedit();
    expect(field.value).toBe('con sóc');
  });
  it('does not keep a stale snapshot when the IME consumes Tab without moving focus', async () => {
    vi.useFakeTimers();
    compose();
    emit('keydown', field, { key: 'Tab' });
    await vi.runAllTimersAsync();
    losePreedit();
    expect(field.value).toBe('con ');
  });
  it('does not resurrect an explicitly cancelled composition', () => {
    compose();
    emit('keydown', field, { key: 'Escape' });
    emit('pointerdown', new Input());
    losePreedit();
    expect(field.value).toBe('con ');
  });
  it('does not resurrect text deliberately deleted before leaving the field', () => {
    compose();
    field.value = 'con ';
    emit('pointerdown', new Input());
    losePreedit();
    expect(field.value).toBe('con ');
  });
  it('leaves a normal IME commit unchanged without extra input events', () => {
    compose();
    const notify = vi.fn(); field.addEventListener('input', notify);
    emit('pointerdown', new Input());
    emit('compositionend', field, { data: 'sóc' });
    emit('blur', field);
    expect(field.value).toBe('con sóc');
    expect(notify).not.toHaveBeenCalled();
  });
  it('does not restore a cancelled composition when clicking in the same field', () => {
    compose(); emit('pointerdown', field); losePreedit();
    expect(field.value).toBe('con ');
  });
  it('retains a newer value and removes its listeners when disposed', async () => {
    compose(); emit('pointerdown', new Input());
    field.value = 'con sóc mới';
    emit('blur', field);
    await Promise.resolve();
    expect(field.value).toBe('con sóc mới');
    dispose();
    compose(); emit('pointerdown', new Input()); losePreedit();
    expect(field.value).toBe('con ');
  });
});
