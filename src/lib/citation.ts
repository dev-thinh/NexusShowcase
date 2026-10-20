export interface CitationItem {
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

  if (rawNames.length === 0) return ['CLB Robotics & IoT'];
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
  const firstAuthor = authors[0] || 'robotics';
  const firstWord = firstAuthor.split(' ')[0] || 'author';
  const cleanFirstWord = removeDiacritics(firstWord).toLowerCase().replace(/[^a-z0-9]/g, '');
  const year = item.publishedYear ?? new Date().getFullYear();

  const titleWord = removeDiacritics(item.title.split(' ')[0] || 'paper')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  return `${cleanFirstWord || 'paper'}${year}${titleWord || 'work'}`;
}

export function generateBibTeX(item: CitationItem): string {
  const key = getCitationKey(item);
  const authors = normalizeAuthorNames(item);
  const authorsBib = authors.join(' and ');
  const venue = item.issuer || 'CLB Robotics & IoT, Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM';
  const year = item.publishedYear ?? new Date().getFullYear();

  return `@inproceedings{${key},
  title = {{${item.title}}},
  author = {${authorsBib}},
  booktitle = {${venue}},
  year = {${year}},
  organization = {Trường Đại Học Khoa Học Tự Nhiên, ĐHQG-HCM},
  url = {https://robotics-iot.hcmus.edu.vn/showcase/${item.slug}}
}`;
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
  if (formattedAuthors.length === 1) {
    authorString = formattedAuthors[0];
  } else if (formattedAuthors.length === 2) {
    authorString = `${formattedAuthors[0]}, & ${formattedAuthors[1]}`;
  } else {
    authorString = `${formattedAuthors.slice(0, -1).join(', ')}, & ${formattedAuthors[formattedAuthors.length - 1]}`;
  }

  const venue = item.issuer || 'CLB Robotics & IoT';
  const year = item.publishedYear ?? new Date().getFullYear();
  return `${authorString} (${year}). ${item.title}. ${venue}. https://robotics-iot.hcmus.edu.vn/showcase/${item.slug}`;
}

export function generateIEEE(item: CitationItem): string {
  const authors = normalizeAuthorNames(item);
  const formattedAuthors = authors.map((name) => {
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0];
    const initials = parts.slice(1).map((p) => `${p.charAt(0)}.`).join(' ');
    return `${initials} ${parts[0]}`;
  });

  const authorStr = formattedAuthors.length === 1
    ? formattedAuthors[0]
    : formattedAuthors.slice(0, -1).join(', ') + ' and ' + formattedAuthors[formattedAuthors.length - 1];

  const venue = item.issuer || 'CLB Robotics & IoT';
  const year = item.publishedYear ?? new Date().getFullYear();
  return `${authorStr}, "${item.title}," ${venue}, ${year}.`;
}
