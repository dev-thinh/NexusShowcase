'use client';
import { useI18n } from './provider';

/** Localize a UI label inside server-rendered presentation without moving
 * function props (for example icon components) across the client boundary. */
export function LocalizedText({ text }: { text: string }) {
  const { t } = useI18n();
  return t(text);
}
