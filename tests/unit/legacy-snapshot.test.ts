import { resolveLegacySnapshot } from '@/features/review/server/legacy-snapshot';
import type { SubmissionSnapshot } from '@/features/submissions/model/snapshot';
import { snapshotRelations } from '@/features/submissions/server/snapshot-relations';
import { expect, it } from 'vitest';
const snapshot: SubmissionSnapshot = { title: 'Submitted', summary: 'Summary', content: '', publishedYear: 2026, suggestedField: '', customProjectType: '', contributors: [{ role: 'CONTRIBUTOR', displayOrder: 0, externalName: 'Author' }], resources: [{ kind: 'LINK', label: 'Source', url: 'https://example.com/source', linkType: 'OTHER' }] };
it('never applies legacy override to a new submission', () => {
  const original = JSON.stringify(snapshot);
  expect(resolveLegacySnapshot({ snapshot, reviewVersion: 1, overrides: { title: 'Old editorial' } })).toEqual(snapshot);
  expect(resolveLegacySnapshot({ snapshot, reviewVersion: 0, overrides: { title: 'Old editorial' } })).toMatchObject({ title: 'Old editorial', contributors: snapshot.contributors });
  expect(JSON.stringify(snapshot)).toBe(original);
});
it('maps resource relations without duplicate URLs or mutation', () => {
  const duplicate = { ...snapshot, resources: [...snapshot.resources, ...snapshot.resources] };
  const relations = snapshotRelations(duplicate);
  expect(relations.links).toEqual([{ type: 'OTHER', label: 'Source', url: 'https://example.com/source' }]);
  expect(relations.contributors[0]).not.toHaveProperty('displayName');
  expect(duplicate.resources).toHaveLength(2);
});
