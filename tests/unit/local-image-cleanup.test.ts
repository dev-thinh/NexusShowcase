import { expect, it } from 'vitest';
import { clearLocalImageReferences } from '../../scripts/local-image-cleanup';

it('removes exact local image references without removing documents, external images or text', () => {
  const targets = new Set(['/uploads/thumbnails/photo.png']);
  const value = { thumbnailUrl: '/uploads/thumbnails/photo.png', avatarUrl: 'https://example.test/avatar.png', resources: [{ url: '/uploads/thumbnails/photo.png', kind: 'IMAGE' }, { url: '/uploads/documents/paper.pdf', kind: 'DOCUMENT' }], content: 'Keep this text', photos: [{ src: '/uploads/thumbnails/photo.png' }] };
  expect(clearLocalImageReferences(value, targets)).toEqual({ thumbnailUrl: null, avatarUrl: value.avatarUrl, resources: [value.resources[1]], content: value.content, photos: [] });
});
it('cleans media inside structured article strings and retains section text', () => {
  const value = 'nexus-sections:v1\n' + JSON.stringify({ version: 1, sections: [{ id: 's', blocks: [{ kind: 'IMAGE', url: '/uploads/thumbnails/photo.png' }, { kind: 'TEXT', text: 'Keep' }] }] });
  expect(clearLocalImageReferences(value, new Set(['/uploads/thumbnails/photo.png']))).toBe('nexus-sections:v1\n' + JSON.stringify({ version: 1, sections: [{ id: 's', blocks: [{ kind: 'TEXT', text: 'Keep' }] }] }));
});
