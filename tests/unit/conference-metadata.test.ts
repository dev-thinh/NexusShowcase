import { describe, expect, it } from 'vitest';
import { showcaseDraftInputSchema, showcaseSubmissionInputSchema } from '@/features/submissions/model/input';
import { buildSubmissionSnapshot } from '@/features/submissions/model/snapshot-mapper';

const conference = { name: 'Hội nghị Robotics quốc tế', status: 'ACCEPTED', eventDate: '2027-02-18', acceptedDate: '2026-12-01', rankings: [{ system: 'Hệ thống A', rank: 'Hạng 1' }, { system: 'Hệ thống B', rank: 'Hạng 2' }] };
const draft = { title: 'Nghiên cứu thử nghiệm', type: 'RESEARCH_PAPER', conference };

describe('optional conference metadata', () => {
  it('preserves conference dates and multiple ranking systems', () => {
    expect(showcaseDraftInputSchema.parse(draft).conference).toEqual(conference);
  });
  it('allows old drafts and a conference whose dates and ranks are not yet known', () => {
    expect(showcaseDraftInputSchema.parse({ title: 'Old draft' }).conference).toBeNull();
    expect(showcaseDraftInputSchema.parse({ ...draft, conference: { name: 'Đang nộp' } }).conference).toMatchObject({ name: 'Đang nộp', rankings: [] });
  });
  it.each([
    { ...conference, name: '  ' },
    { ...conference, eventDate: '2026-02-30' },
    { ...conference, acceptedDate: 'yesterday' },
    { ...conference, publicationDate: '2027-02-30' },
    { ...conference, status: 'UNKNOWN' },
    { ...conference, rankings: [{ system: 'A', rank: '' }] },
    { ...conference, rankings: Array.from({ length: 9 }, () => ({ system: 'A', rank: 'B' })) },
    { ...conference, rankings: [{ system: 'A', rank: 'B' }, { system: ' a ', rank: ' b ' }] },
  ])('rejects malformed or unbounded conference information: %j', value => {
    expect(showcaseSubmissionInputSchema.safeParse({ ...draft, summary: 'Summary', contributors: [{ externalName: 'Author', role: 'CONTRIBUTOR', displayOrder: 0 }], resources: [{ kind: 'LINK', label: 'Paper', url: 'https://example.org', linkType: 'PAPER_URL' }], conference: value }).success).toBe(false);
  });
  it('preserves conference data on project submissions', () => {
    expect(showcaseDraftInputSchema.parse({ ...draft, type: 'PROJECT' }).conference).toEqual(conference);
  });
  it('stores a publication date separately from acceptance and event dates', () => {
    const value = { ...conference, status: 'PUBLISHED', publicationDate: '2027-03-01' };
    expect(showcaseDraftInputSchema.parse({ ...draft, conference: value }).conference).toEqual(value);
  });
  it('preserves conference metadata when rebuilding a saved snapshot', () => {
    const snapshot = buildSubmissionSnapshot({ ...draft, type: 'RESEARCH_PAPER', summary: 'Summary', contributors: [] });
    expect(snapshot.conference).toEqual(conference);
  });
});

const publishedSubmission = { title: 'Paper', summary: 'Abstract', type: 'RESEARCH_PAPER', contributors: [{ externalName: 'Author', role: 'CONTRIBUTOR', displayOrder: 0 }], resources: [{ kind: 'LINK', label: 'Paper', url: 'https://example.org', linkType: 'PAPER_URL' }], conference: { name: 'Journal', status: 'PUBLISHED', rankings: [] } };
it('requires an HTTP(S) paper link for published submissions but allows unfinished drafts', () => {
  expect(showcaseDraftInputSchema.safeParse(publishedSubmission).success).toBe(true);
  expect(showcaseSubmissionInputSchema.safeParse(publishedSubmission).success).toBe(false);
  expect(showcaseSubmissionInputSchema.safeParse({ ...publishedSubmission, conference: { ...publishedSubmission.conference, paperUrl: 'javascript:alert(1)' } }).success).toBe(false);
});
it('enables citation automatically for a published paper and ignores a manual override', () => {
  const result = showcaseSubmissionInputSchema.parse({ ...publishedSubmission, citationEnabled: false, conference: { ...publishedSubmission.conference, paperUrl: 'https://doi.org/10.1234/paper' } });
  expect(result.citationEnabled).toBe(true);
  expect(result.conference?.paperUrl).toBe('https://doi.org/10.1234/paper');
  expect(showcaseDraftInputSchema.parse({ title: 'Project', citationEnabled: true }).citationEnabled).toBe(false);
});

it('accepts the published paper link as the full-text link without a duplicate resource', () => {
  expect(showcaseSubmissionInputSchema.safeParse({ ...publishedSubmission, resources: [], conference: { ...publishedSubmission.conference, paperUrl: 'https://doi.org/10.1234/paper' } }).success).toBe(true);
});
