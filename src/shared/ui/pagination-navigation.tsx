'use client';

import { useEffect, useRef, type ComponentProps } from 'react';
import { scrollToTop } from '@/shared/navigation/scroll-to-top';

export function PaginationNavigation({ page, children, ...props }: ComponentProps<'nav'> & { page: number }) {
  const pending = useRef(false);
  const cancel = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    if (!pending.current) return;
    pending.current = false;
    cancel.current = scrollToTop();
  }, [page]);
  useEffect(() => () => cancel.current?.(), []);
  return <nav {...props} onClickCapture={event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!(event.target instanceof Element) || !event.target.closest('a[href]')) return;
    cancel.current?.();
    pending.current = true;
  }} onSubmitCapture={event => {
    if (!(event.target instanceof HTMLFormElement) || !event.target.checkValidity()) return;
    cancel.current?.();
    pending.current = true;
    const input = event.target.querySelector<HTMLInputElement>('input[type="number"]');
    input?.blur();
    if (Number(input?.value) === page) {
      pending.current = false;
      requestAnimationFrame(() => { cancel.current = scrollToTop(); });
    }
  }}>{children}</nav>;
}
