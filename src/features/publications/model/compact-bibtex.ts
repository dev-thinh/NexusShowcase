/** Retain bibliographic fields, omitting resolver duplicates and unrelated metadata. */
export function compactBibtex(source: string): string {
  const text = source.trim();
  const first = text.indexOf(',');
  if (!/^@\w+\s*\{/.test(text) || first < 0) return text;
  const fields: Array<{ name: string; value: string }> = [];
  let depth = 1, quoted = false, escaped = false, start = first + 1;
  const collect = (end: number) => {
    const match = text.slice(start, end).trim().match(/^([a-z][a-z\d_-]*)\s*=\s*([\s\S]+)$/i);
    if (match) fields.push({ name: match[1].toLowerCase(), value: match[2].trim() });
  };
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (escaped) { escaped = false; continue; }
    if (char === '\\') { escaped = true; continue; }
    if (char === '"' && depth === 1) quoted = !quoted;
    if (!quoted) {
      if (char === '{') depth++;
      if (char === '}') depth--;
    }
    if (!quoted && (depth === 0 || char === ',' && depth === 1)) {
      collect(i); start = i + 1;
      if (depth === 0) break;
    }
  }
  if (!fields.length || depth !== 0) return text;
  const allowed = new Set(['title', 'author', 'journal', 'booktitle', 'year', 'volume', 'number', 'pages', 'doi', 'url', 'editor', 'publisher', 'edition', 'address', 'series', 'chapter']);
  const doi = fields.some(field => field.name === 'doi');
  const article = /^@article\s*\{/i.test(text);
  const kept = fields.filter(field => allowed.has(field.name) && !(doi && field.name === 'url') && !(article && field.name === 'publisher'));
  return `${text.slice(0, first)},\n${kept.map(field => `  ${field.name} = ${field.name === 'pages' ? field.value.replace(/[–—]/g, '--') : field.value}`).join(',\n')}\n}`;
}
