import { toCitationDto } from '@/features/publications/model/contracts';
import { publishedWhere } from '@/features/publications/model/visibility';
import { publicationCardSelect } from '@/features/publications/server/selects';
import { expect, it } from 'vitest';

it('restricts guests to public published records', () => {
  expect(publishedWhere(false)).toEqual({ status: 'PUBLISHED', visibility: 'PUBLIC' });
  expect(publishedWhere(true)).toEqual({ status: 'PUBLISHED' });
});
it('projects citation metadata without article or user internals', () => {
  const input = { title: 'Title', slug: 'title', publishedYear: 2026, issuer: 'Club', content: 'private-content', authorDraft: 'private-draft', contributors: [{ user: { fullName: 'Author', email: 'private-email', studentId: 'private-id', passwordHash: 'private-hash' } }] };
  expect(toCitationDto(input)).toEqual({ title: 'Title', slug: 'title', publishedYear: 2026, issuer: 'Club', contributors: [{ user: { fullName: 'Author' }, externalName: undefined }] });
  expect(JSON.stringify(toCitationDto(input))).not.toContain('private-');
  expect(publicationCardSelect).not.toHaveProperty('content');
  expect(publicationCardSelect).not.toHaveProperty('authorDraft');
  expect(publicationCardSelect).not.toHaveProperty('attachments');
});
