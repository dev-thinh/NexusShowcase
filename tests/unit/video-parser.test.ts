import { describe, it, expect } from 'vitest';
import { parseVideoEmbedUrl } from '@/lib/video-parser';

describe('Video Embed Parser', () => {
  it('should parse standard YouTube watch URL', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    expect(parseVideoEmbedUrl(url)).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('should parse shortened youtu.be URL', () => {
    const url = 'https://youtu.be/dQw4w9WgXcQ';
    expect(parseVideoEmbedUrl(url)).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('should parse Loom share URL', () => {
    const url = 'https://www.loom.com/share/abc123xyz456';
    expect(parseVideoEmbedUrl(url)).toBe('https://www.loom.com/embed/abc123xyz456');
  });

  it('should parse Google Drive preview URL', () => {
    const url = 'https://drive.google.com/file/d/1A2B3C4D5E/view?usp=sharing';
    expect(parseVideoEmbedUrl(url)).toBe('https://drive.google.com/file/d/1A2B3C4D5E/preview');
  });

  it('should return null for invalid or unsupported URLs', () => {
    expect(parseVideoEmbedUrl('https://example.com/not-a-video')).toBeNull();
  });
});
