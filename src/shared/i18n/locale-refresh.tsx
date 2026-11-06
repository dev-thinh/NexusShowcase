'use client';
import { useEffect, useRef, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigationTransition } from '@/shared/navigation/navigation-transition';
import { useI18n } from './provider';

/** A locale refresh must not cancel an in-flight push or replace its history
 * entry. Wait for navigation to commit, then refresh the latest destination. */
export function LocaleRefresh() {
  const { revision } = useI18n();
  const destination = useNavigationTransition()?.pathname;
  const router = useRouter();
  const applied = useRef(revision);
  useEffect(() => {
    if (destination || applied.current === revision) return;
    applied.current = revision;
    startTransition(() => router.refresh());
  }, [revision, destination, router]);
  return null;
}
