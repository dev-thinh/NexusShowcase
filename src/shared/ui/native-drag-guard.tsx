'use client';

import { useEffect } from 'react';

/** Block browser drag ghosts without changing text selection or pointer-based editors. */
export function NativeDragGuard() {
  useEffect(() => {
    const preventNativeDrag = (event: DragEvent) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('input, textarea, [contenteditable="true"]')) return;
      if (event.target.closest('img, svg, canvas, a, button, [role="button"]')) event.preventDefault();
    };
    document.addEventListener('dragstart', preventNativeDrag, true);
    return () => document.removeEventListener('dragstart', preventNativeDrag, true);
  }, []);
  return null;
}
