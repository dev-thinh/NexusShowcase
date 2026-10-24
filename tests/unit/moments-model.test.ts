import { describe, expect, it } from 'vitest';
import { momentsSaveSchema, momentRows } from '@/features/publications/model/moments';
import { defaultMoments } from '../fixtures/moments';

describe('moments gallery validation', () => {
  it('uses the trimmed title for image accessibility text even when no description is supplied', () => {
    const { alt: _alt, ...photo } = defaultMoments[0];
    const parsed = momentsSaveSchema.parse({ version: 0, photos: [{ ...photo, title: '  Tiêu đề mới  ' }] });
    expect(parsed.photos[0].alt).toBe('Tiêu đề mới');
    const legacy = momentsSaveSchema.parse({ version: 0, photos: [{ ...photo, title: 'Tiêu đề mới', alt: 'Mô tả cũ' }] });
    expect(legacy.photos[0].alt).toBe('Tiêu đề mới');
  });
  it('accepts photos without a topic and drops retired topic data from older galleries', () => {
    const parsed = momentsSaveSchema.parse({ version: 0, photos: [{ ...defaultMoments[0], topic: 'Chủ đề cũ' }] });
    expect(parsed.photos[0]).not.toHaveProperty('topic');
  });
  it('migrates legacy visible photos into distinct slots while retaining unused library photos', () => {
    const legacy = defaultMoments.map(({ slot: _slot, ...photo }) => photo);
    const saved = momentsSaveSchema.parse({ version: 1, photos: [...legacy, { ...legacy[0], id: 'unused', visible: false }] });
    expect(saved.photos.map(photo => photo.slot)).toEqual([0, 1, 2, 3, 4, 5, null]);
    expect(momentRows(saved.photos).map(row => row.length)).toEqual([6, 0]);
  });
  it('rejects duplicate or out of range slots and keeps library photos unassigned', () => {
    expect(momentsSaveSchema.safeParse({ version: 0, photos: [defaultMoments[0], { ...defaultMoments[1], slot: 0 }] }).success).toBe(false);
    expect(momentsSaveSchema.safeParse({ version: 0, photos: [{ ...defaultMoments[0], slot: 12 }] }).success).toBe(false);
    const result = momentsSaveSchema.parse({ version: 0, photos: [{ ...defaultMoments[0], slot: null }] });
    expect(result.photos[0].visible).toBe(false);
    expect(momentRows(result.photos)).toEqual([[], []]);
  });
  it('sorts each row by slot and never borrows photos from another row', () => {
    const photos = [ { ...defaultMoments[0], slot: 7 }, { ...defaultMoments[1], slot: 0 }, { ...defaultMoments[2], slot: 6 } ];
    expect(momentRows(photos).map(row => row.map(photo => photo.id))).toEqual([[defaultMoments[1].id], [defaultMoments[2].id, defaultMoments[0].id]]);
  });
  it('accepts ordered gallery edits including hidden photos and an empty gallery', () => {
    expect(momentsSaveSchema.safeParse({ version: 0, photos: defaultMoments }).success).toBe(true);
    expect(momentsSaveSchema.safeParse({ version: 2, photos: [] }).success).toBe(true);
  });
  it('rejects unsafe image sources, duplicate ids and unbounded galleries', () => {
    const first = defaultMoments[0];
    for (const src of ['javascript:alert(1)', '//example.com/a.jpg', 'https://example.com/a.jpg', '/api/secret', '/uploads/thumbnails/../secret.png']) {
      expect(momentsSaveSchema.safeParse({ version: 0, photos: [{ ...first, src }] }).success).toBe(false);
    }
    expect(momentsSaveSchema.safeParse({ version: 0, photos: [first, first] }).success).toBe(false);
    expect(momentsSaveSchema.safeParse({ version: -1, photos: [] }).success).toBe(false);
  });
});

it('starts production galleries empty', async () => {
  expect((await import('@/features/publications/model/moments')).defaultMoments).toEqual([]);
  expect((await import('@/features/publications/model/research-images')).defaultResearchImages).toEqual([]);
});
