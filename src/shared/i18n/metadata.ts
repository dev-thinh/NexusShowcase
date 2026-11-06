import 'server-only';
import type { Metadata } from 'next';
import { getServerI18n } from './server';

export function localizedMetadata(metadata: Metadata) {
  return async (): Promise<Metadata> => {
    const { t } = await getServerI18n();
    return {
      ...metadata,
      title: typeof metadata.title === 'string' ? t(metadata.title) : metadata.title,
      description: metadata.description ? t(metadata.description) : metadata.description,
    };
  };
}
