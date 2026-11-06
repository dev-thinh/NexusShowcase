import { extractDoi } from './doi';
import { readConference } from './conference';

export interface CitationItem {
  citationEnabled?: boolean;
  conference?: unknown;
  title: string;
  slug: string;
  publishedYear?: number | null;
  issuer?: string | null;
  contributors: Array<{
    user?: { fullName: string } | null;
    externalName?: string | null;
  }>;
}

function cleanAcademicTitles(name: string): string {
  return name
    .replace(/^(PGS\.TS\.|GS\.TS\.|TS\.|ThS\.|BS\.CKII|BS\.|Prof\.|Dr\.)\s+/i, '')
    .trim();
}

function normalizeAuthorNames(item: CitationItem): string[] {
  const rawNames = item.contributors
    .map((c) => c.user?.fullName || c.externalName)
    .filter(Boolean) as string[];

  if (rawNames.length === 0) return [];
  return rawNames.map(cleanAcademicTitles);
}

function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function getCitationKey(item: CitationItem): string {
  const authors = normalizeAuthorNames(item);
  const firstAuthor = authors[0] || 'paper';
  const firstWord = firstAuthor.split(' ')[0] || 'author';
  const cleanFirstWord = removeDiacritics(firstWord).toLowerCase().replace(/[^a-z0-9]/g, '');
  const year = (Number(readConference(item.conference)?.publicationDate?.slice(0, 4)) || item.publishedYear) ?? 'nd';

  const titleWord = removeDiacritics(item.title.split(' ')[0] || 'paper')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  return `${cleanFirstWord || 'paper'}${year}${titleWord || 'work'}`;
}

export function generateBibTeX(item: CitationItem): string {
  const key = getCitationKey(item);
  const authors = normalizeAuthorNames(item);
  const conference = readConference(item.conference);
  const venue = conference?.name || item.issuer;
  const year = Number(conference?.publicationDate?.slice(0, 4)) || item.publishedYear;
  const doi = extractDoi(conference?.paperUrl ?? '');
  const journal = !!venue && /journal|tạp chí/i.test(venue);
  const proceeding = !!venue && /conference|proceedings|hội nghị/i.test(venue);
  const entry = journal ? 'article' : proceeding ? 'inproceedings' : 'misc';
  const escape = (value: string) => value.replace(/[\\{}%&#_$]/g, char => char === '\\' ? '\\textbackslash{}' : `\\${char}`).replace(/[\r\n]+/g, ' ');
  const fields = [
    `title = {{${escape(item.title)}}}`,
    ...(authors.length ? [`author = {${authors.map(name => { const [family, ...given] = name.split(/\s+/); return escape(given.length ? `${family}, ${given.join(' ')}` : name); }).join(' and ')}}`] : []),
    ...(venue ? [`${journal ? 'journal' : proceeding ? 'booktitle' : 'howpublished'} = {${escape(venue)}}`] : []),
    ...(year ? [`year = {${year}}`] : []),
    ...(doi ? [`doi = {${doi}}`] : conference?.paperUrl ? [`url = {${conference.paperUrl}}`] : []),
  ];
  return `@${entry}{${key},\n  ${fields.join(',\n  ')}\n}`;
}

export function generateAPA(item: CitationItem): string {
  const authors = normalizeAuthorNames(item);
  const formattedAuthors = authors.map((name) => {
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0];
    const lastName = parts[0];
    const initials = parts.slice(1).map((p) => `${p.charAt(0)}.`).join(' ');
    return `${lastName}, ${initials}`;
  });

  let authorString = '';
  if (formattedAuthors.length === 0) {
    authorString = '';
  } else if (formattedAuthors.length > 20) {
    authorString = `${formattedAuthors.slice(0, 19).join(', ')}, … ${formattedAuthors.at(-1)}`;
  } else if (formattedAuthors.length === 1) {
    authorString = formattedAuthors[0];
  } else if (formattedAuthors.length === 2) {
    authorString = `${formattedAuthors[0]}, & ${formattedAuthors[1]}`;
  } else {
    authorString = `${formattedAuthors.slice(0, -1).join(', ')}, & ${formattedAuthors[formattedAuthors.length - 1]}`;
  }

  const venue = readConference(item.conference)?.name || item.issuer || '';
  const year = (Number(readConference(item.conference)?.publicationDate?.slice(0, 4)) || item.publishedYear) ?? 'nd';
  return [authorString ? `${authorString} (${year === 'nd' ? 'n.d.' : year}). ${item.title}.` : `${item.title}. (${year === 'nd' ? 'n.d.' : year}).`, venue ? `${venue}.` : '', readConference(item.conference)?.paperUrl || ''].filter(Boolean).join(' ');
}

export function generateIEEE(item: CitationItem): string {
  const authors = normalizeAuthorNames(item);
  const formattedAuthors = authors.map((name) => {
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0];
    const initials = parts.slice(1).map((p) => `${p.charAt(0)}.`).join(' ');
    return `${initials} ${parts[0]}`;
  });

  const authorStr = !formattedAuthors.length ? '' : formattedAuthors.length > 6 ? `${formattedAuthors[0]} et al.` : formattedAuthors.length === 1
    ? formattedAuthors[0]
    : formattedAuthors.slice(0, -1).join(', ') + ' and ' + formattedAuthors[formattedAuthors.length - 1];

  const venue = readConference(item.conference)?.name || item.issuer || '';
  const year = (Number(readConference(item.conference)?.publicationDate?.slice(0, 4)) || item.publishedYear) ?? 'nd';
  const doi = extractDoi(readConference(item.conference)?.paperUrl ?? '');
  return `${authorStr ? `${authorStr}, ` : ''}"${item.title}," ${[venue, year === 'nd' ? '' : String(year)].filter(Boolean).join(', ')}${doi ? `, doi: ${doi}` : ''}.`;
}
