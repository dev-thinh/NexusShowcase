'use client';

import { installImeBlurGuard } from '@/shared/lib/ime-blur-guard';
import { useEffect } from 'react';

export function ImeInputSupport() {
  useEffect(() => installImeBlurGuard(document), []);
  return null;
}
