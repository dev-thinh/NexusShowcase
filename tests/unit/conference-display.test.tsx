import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { ConferenceDetails } from '@/features/publications/components/conference-details';
import { ConferenceCardBanner } from '@/features/publications/components/conference-card-banner';
import { PublicationCardMeta } from '@/features/publications/components/publication-card-meta';
import { PublicationCardDescription } from '@/features/publications/components/publication-card-description';

const conference = { name: 'Conference name', status: 'ACCEPTED', eventDate: '2027-03-08', acceptedDate: '2026-12-20', publicationDate: '2027-03-01', rankings: Array.from({ length: 4 }, (_, i) => ({ system: `System ${i}`, rank: `Rank ${i}` })) };
it('keeps abstracts unchanged and places conference information in a separate banner for both publication types', () => {
  const html = renderToStaticMarkup(<PublicationCardDescription summary="Original summary" />);
  expect(html).toContain('Original summary');
  expect(html).toContain('h-12');
  expect(html).not.toContain('Conference name');
  const card = renderToStaticMarkup(<ConferenceCardBanner value={conference} />);
  expect(card).toContain('Conference name');
  expect(card).toContain('System 0');
  expect(card).toContain('+2');
  expect(card).not.toContain('System 3');
  expect(card).toContain('Đã chấp nhận');
  expect(card).toContain('20/12/2026');
  expect(card).toContain('08/03/2027');
  expect(card).not.toContain('01/03/2027');
});
it('shows only the active milestone date on cards and detail without discarding the other date', () => {
  const published = { ...conference, status: 'PUBLISHED' };
  const card = renderToStaticMarkup(<ConferenceCardBanner value={published} />);
  expect(card).toContain('Đã công bố');
  expect(card).toContain('01/03/2027');
  expect(card).not.toContain('20/12/2026');
  const detail = renderToStaticMarkup(<ConferenceDetails value={published} />);
  expect(detail).toContain('08/03/2027');
  expect(detail).toContain('01/03/2027');
  expect(detail).not.toContain('20/12/2026');
  expect(detail).toContain('System 3');
  expect(published.acceptedDate).toBe('2026-12-20');
});
it('does not render absent metadata and supports a milestone whose date is not yet known', () => {
  expect(renderToStaticMarkup(<ConferenceDetails value={null} />)).toBe('');
  expect(renderToStaticMarkup(<ConferenceDetails value={{ name: '' }} />)).toBe('');
  const card = renderToStaticMarkup(<PublicationCardMeta type="PROJECT" year={2026} />);
  expect(renderToStaticMarkup(<ConferenceCardBanner value={null} />)).toBe('');
  expect(card).not.toContain('data-card-conference');
  const accepted = renderToStaticMarkup(<ConferenceDetails value={{ name: 'Name only' }} />);
  expect(accepted).toContain('Name only');
  expect(accepted).toContain('Đã chấp nhận');
  expect(accepted).not.toContain('<time');
});

it.each(['ACCEPTED', 'PUBLISHED'])('hides the %s milestone label when its date is missing', status => {
  const card = renderToStaticMarkup(<ConferenceCardBanner value={{ ...conference, status, acceptedDate: null, publicationDate: null }} />);
  expect(card).toContain('08/03/2027');
  expect(card).not.toContain('Đã chấp nhận');
  expect(card).not.toContain('Đã công bố');
});
it('omits the dates row when no dates are available', () => {
  const card = renderToStaticMarkup(<ConferenceCardBanner value={{ name: 'Name only', status: 'PUBLISHED' }} />);
  expect(card).toContain('Name only');
  expect(card).not.toContain('conference-card-banner__dates');
  expect(card).not.toContain('Đã công bố');
});
