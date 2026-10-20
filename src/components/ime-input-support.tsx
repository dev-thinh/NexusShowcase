'use client';

import { useEffect } from 'react';
import { installImeBlurGuard } from '@/lib/ime-blur-guard';

export function ImeInputSupport() {
  useEffect(() => installImeBlurGuard(document), []);
  return null;
}
