import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const normalize = value => value.replace(/\s+/g, ' ').trim();
const placeholders = value => [...value.matchAll(/\{(\d+)\}/g)].map(match => match[1]).sort();
// These are source-code templates accidentally included in the inventory. They
// intentionally remain byte-for-byte unchanged and are never interface copy.
const technicalTemplates = new Set([
  "regexp_replace(translate(normalize(lower({0}), NFD), 'đ', 'd'), {1}, '', 'g')",
]);

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (['messages', 'fixtures', '__fixtures__', '__tests__', 'node_modules'].includes(entry.name)) return [];
      return walkFiles(location);
    }
    return /\.(ts|tsx)$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name) ? [location] : [];
  });
}

/** Audit static interface keys; dynamic/user-authored content is deliberately ignored. */
export function auditI18n(root = process.cwd()) {
  const dictionaryDirectory = path.join(root, 'src/shared/i18n/messages');
  const keys = new Set();
  const translations = new Map();
  const translationConflicts = [];
  const placeholderMismatches = [];
  for (const filename of fs.readdirSync(dictionaryDirectory).filter(name => name.endsWith('.en.json')).sort()) {
    const file = path.join(dictionaryDirectory, filename);
    const dictionary = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const [key, value] of Object.entries(dictionary)) {
      const normalizedKey = normalize(key);
      keys.add(normalizedKey);
      const previous = translations.get(normalizedKey);
      if (previous && previous.value !== value) translationConflicts.push({ key: normalizedKey, file: path.relative(root, file), previousFile: previous.file, previousValue: previous.value, value });
      translations.set(normalizedKey, { file: path.relative(root, file), value });
      if (typeof value !== 'string' || JSON.stringify(placeholders(key)) !== JSON.stringify(placeholders(value))) {
        placeholderMismatches.push({ file: path.relative(root, file), key, value });
      }
    }
  }
  const missingKeys = [];
  const files = walkFiles(path.join(root, 'src')).sort();
  for (const file of files) {
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ['t', 'tr'].includes(node.expression.text)) {
        const first = node.arguments[0];
        if (first && (ts.isStringLiteral(first) || ts.isNoSubstitutionTemplateLiteral(first))) {
          const key = normalize(first.text);
          if (key && !keys.has(key) && !technicalTemplates.has(key)) {
            const position = source.getLineAndCharacterOfPosition(first.getStart(source));
            missingKeys.push({ file: path.relative(root, file), line: position.line + 1, key });
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  return { missingKeys, placeholderMismatches, translationConflicts, filesScanned: files.length, dictionaryKeys: keys.size };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = auditI18n();
  for (const item of result.missingKeys) console.error(`${item.file}:${item.line}: missing translation ${JSON.stringify(item.key)}`);
  for (const item of result.placeholderMismatches) console.error(`${item.file}: placeholder mismatch for ${JSON.stringify(item.key)}`);
  for (const item of result.translationConflicts) console.error(`${item.file}: conflicting translation for ${JSON.stringify(item.key)} (also in ${item.previousFile})`);
  console.log(`i18n: ${result.dictionaryKeys} keys, ${result.filesScanned} source files; ${result.missingKeys.length} missing keys, ${result.placeholderMismatches.length} placeholder mismatches, ${result.translationConflicts.length} translation conflicts.`);
  if (process.argv.includes('--check') && (result.missingKeys.length || result.placeholderMismatches.length || result.translationConflicts.length)) process.exitCode = 1;
}
