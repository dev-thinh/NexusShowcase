'use client';

import { useEffect, useRef, type InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue'> & { query: string; completeLength?: number };

/** Keeps a newer draft intact while server results for an older query arrive. */
export function LiveSearchInput({ query, completeLength, ...props }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const composing = useRef(false);
  const dirty = useRef(false);
  const cancel = () => clearTimeout(timer.current);
  const schedule = () => {
    cancel();
    const control = input.current;
    if (!control || composing.current || completeLength && control.value && control.value.length !== completeLength) return;
    timer.current = setTimeout(() => control.form?.requestSubmit(), 300);
  };
  useEffect(() => {
    const control = input.current;
    if (control && (!dirty.current || control.value === query)) { control.value = query; dirty.current = false; }
  }, [query]);
  useEffect(() => {
    const form = input.current?.form;
    const reset = () => { cancel(); dirty.current = false; };
    const back = () => {
      reset();
      if (input.current) input.current.value = new URLSearchParams(window.location.search).get(input.current.name) ?? '';
    };
    form?.addEventListener('submit', cancel);
    form?.addEventListener('reset', reset);
    window.addEventListener('popstate', back);
    return () => { cancel(); form?.removeEventListener('submit', cancel); form?.removeEventListener('reset', reset); window.removeEventListener('popstate', back); };
  }, []);
  return <input {...props} ref={input} defaultValue={query}
    onChange={event => { dirty.current = true; props.onChange?.(event); schedule(); }}
    onCompositionStart={event => { composing.current = true; cancel(); props.onCompositionStart?.(event); }}
    onCompositionEnd={event => { composing.current = false; dirty.current = true; props.onCompositionEnd?.(event); schedule(); }}
    onKeyDown={event => {
      props.onKeyDown?.(event);
      if (event.key === 'Enter' && !composing.current && !event.nativeEvent.isComposing) { event.preventDefault(); cancel(); event.currentTarget.form?.requestSubmit(); }
    }} />;
}
