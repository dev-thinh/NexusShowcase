import { describe, expect, it } from 'vitest';
import { buildSubmissionSnapshot, mergeEditorialOverrides } from '@/lib/submission-snapshot';
import type { SubmissionSnapshot } from '@/lib/submission-types';

const snapshot: SubmissionSnapshot = {
  title: 'Bản gửi',
  summary: 'Tóm tắt gốc',
  content: 'Nội dung gốc',
  publishedYear: 2026,
  suggestedField: 'Robotics',
  customProjectType: '',
  contributors: [
    {
      userId: 'cm12345678901234567890123',
      displayName: 'Nguyễn An',
      externalName: null,
      externalAffiliation: null,
      externalLink: null,
      role: 'PROJECT_LEAD',
      customRoleTitle: null,
      displayOrder: 0,
    },
  ],
  resources: [
    { kind: 'LINK', label: 'Mã nguồn', url: 'https://example.com/repo', linkType: 'GITHUB' },
  ],
};

describe('submission snapshots', () => {
  it('builds a JSON-safe snapshot through explicit field selection', () => {
    const source = {
      ...snapshot,
      content: null,
      publishedYear: null,
      suggestedField: null,
      customProjectType: null,
      ignoredDatabaseField: 'must not leak',
    };

    expect(buildSubmissionSnapshot(source)).toEqual({
      ...snapshot,
      type: 'PROJECT', categoryId: undefined, thumbnailUrl: undefined,
      content: '',
      publishedYear: new Date().getFullYear(),
      suggestedField: '',
      customProjectType: '',
    });
    expect(buildSubmissionSnapshot(source)).not.toHaveProperty('ignoredDatabaseField');
  });

  it('falls back to the snapshot for sparse editorial overrides', () => {
    const effective = mergeEditorialOverrides(snapshot, { title: 'Bản biên tập' });

    expect(effective.title).toBe('Bản biên tập');
    expect(effective.summary).toBe(snapshot.summary);
    expect(effective.contributors).toEqual(snapshot.contributors);
    expect(effective.resources).toEqual(snapshot.resources);
  });

  it('always preserves immutable snapshot resources', () => {
    const resources = [{ kind: 'DOCUMENT' as const, label: 'Bài báo', url: '/uploads/documents/paper.pdf' }];
    expect(mergeEditorialOverrides(snapshot, { resources } as never).resources).toEqual(snapshot.resources);
  });
});
