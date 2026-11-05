'use client';

import { createContext, useContext, useEffect, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import type { PublicSectionContext } from './public-section';

const Context = createContext<{ detail: PublicSectionContext | null; setDetail: Dispatch<SetStateAction<PublicSectionContext | null>> } | null>(null);

export function PublicSectionProvider({ children }: { children: ReactNode }) {
  const [detail, setDetail] = useState<PublicSectionContext | null>(null);
  return <Context.Provider value={{ detail, setDetail }}>{children}</Context.Provider>;
}

/** Mounted only after the server has authorized access to this article. */
export function PublicSectionMarker({ pathname, section }: PublicSectionContext) {
  const setDetail = useContext(Context)?.setDetail;
  useEffect(() => {
    setDetail?.({ pathname, section });
    return () => setDetail?.(current => current?.pathname === pathname ? null : current);
  }, [pathname, section, setDetail]);
  return null;
}

export function usePublicSectionContext() {
  return useContext(Context)?.detail;
}
