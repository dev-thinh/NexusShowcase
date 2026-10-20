import { describe, expect, it } from 'vitest';
import { formatResourceMetadata } from '@/lib/resource-presentation';

describe('resource presentation', () => {
  it('formats a PDF without exposing its storage path', () => {
    expect(formatResourceMetadata({ kind: 'DOCUMENT', label: 'Báo cáo', url: '/uploads/documents/a.pdf', fileName: 'a.pdf', fileSize: 2048, mimeType: 'application/pdf' }))
      .toEqual({ primary: 'Báo cáo', secondary: 'a.pdf · PDF · 2 KB', preview: 'pdf' });
  });

  it('shows only the hostname for links', () => {
    expect(formatResourceMetadata({ kind: 'LINK', label: 'Mã nguồn', url: 'https://github.com/org/repo' }).secondary)
      .toBe('github.com');
  });
});
