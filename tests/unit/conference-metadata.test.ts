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
