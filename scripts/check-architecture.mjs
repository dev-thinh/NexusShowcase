import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const normalize = value => value.split(path.sep).join('/');
const defaultDependencies = {
  identity: [], assets: ['identity'], publications: ['identity'],
  submissions: ['identity', 'assets', 'publications', 'members'],
  review: ['identity', 'submissions', 'publications'], members: ['identity', 'publications'],
};

export function sourceFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const name = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(name) : /\.[cm]?[jt]sx?$/.test(name) && !name.endsWith('.d.ts') ? [name] : [];
  });
}

export function readModuleGraph(root, files = sourceFiles(path.join(root, 'src'))) {
  const graph = new Map();
  for (const absolute of files) {
    const file = normalize(path.relative(root, absolute));
    const source = ts.createSourceFile(absolute, fs.readFileSync(absolute, 'utf8'), ts.ScriptTarget.Latest, true);
    const dependencies = [];
    function add(specifier, typeOnly = false) {
      let candidate;
      if (specifier.startsWith('@/')) candidate = path.join(root, 'src', specifier.slice(2));
      else if (specifier.startsWith('.')) candidate = path.resolve(path.dirname(absolute), specifier);
      const target = candidate && [candidate, ...['.ts', '.tsx', '.js', '.mjs', '/index.ts', '/index.tsx'].map(extension => candidate + extension)].find(name => fs.existsSync(name) && fs.statSync(name).isFile());
      dependencies.push({ specifier, typeOnly, target: target ? normalize(path.relative(root, target)) : null });
    }
    function visit(node) {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const clause = node.importClause;
        const names = clause?.namedBindings;
        const typeOnly = !!clause?.isTypeOnly || !!(clause && !clause.name && names && ts.isNamedImports(names) && names.elements.length && names.elements.every(name => name.isTypeOnly));
        add(node.moduleSpecifier.text, typeOnly);
      } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) add(node.moduleSpecifier.text, node.isTypeOnly);
      else if (ts.isCallExpression(node) && node.arguments.length && ts.isStringLiteral(node.arguments[0]) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || ts.isIdentifier(node.expression) && node.expression.text === 'require')) add(node.arguments[0].text);
      ts.forEachChild(node, visit);
    }
    visit(source);
    const directives = source.statements.filter(ts.isExpressionStatement).map(statement => ts.isStringLiteral(statement.expression) ? statement.expression.text : '');
    graph.set(file, { file, dependencies, client: directives.includes('use client'), action: directives.includes('use server') });
  }
  return graph;
}

export function checkArchitecture(root) {
  root = path.resolve(root);
  const manifest = path.join(root, 'scripts/architecture-map.json');
  const allowed = fs.existsSync(manifest) ? JSON.parse(fs.readFileSync(manifest, 'utf8')).allowedFeatureDependencies : defaultDependencies;
  const graph = readModuleGraph(root);
  const violations = [];
  const feature = file => file?.match(/^src\/features\/([^/]+)\//)?.[1];
  function add(file, dependency, rule) { violations.push({ file, dependency, rule }); }
  for (const module of graph.values()) {
    for (const dependency of module.dependencies) {
      if (!dependency.target) continue;
      const targetFeature = feature(dependency.target), owner = feature(module.file);
      if (module.file.startsWith('src/shared/') && targetFeature) add(module.file, dependency.target, 'shared-imports-feature');
      if (owner && targetFeature && owner !== targetFeature && !(allowed[owner] ?? []).includes(targetFeature)) add(module.file, dependency.target, 'feature-dependency');
    }
    if (module.client) {
      const seen = new Set();
      function walk(file) {
        if (seen.has(file)) return;
        seen.add(file);
        const current = graph.get(file);
        if (!current || current.action) return;
        if (current.dependencies.some(dependency => dependency.specifier === 'server-only') || file.includes('/server/')) { add(module.file, file, 'client-imports-server'); return; }
        for (const dependency of current.dependencies) if (!dependency.typeOnly && dependency.target) walk(dependency.target);
      }
      walk(module.file);
    }
  }
  const done = new Set(), active = new Set();
  function cycle(file) {
    if (done.has(file)) return;
    active.add(file);
    for (const dependency of graph.get(file)?.dependencies ?? []) {
      if (dependency.typeOnly || !dependency.target) continue;
      if (active.has(dependency.target)) add(file, dependency.target, 'runtime-cycle');
      else cycle(dependency.target);
    }
    active.delete(file); done.add(file);
  }
  for (const file of graph.keys()) cycle(file);
  return { violations };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = checkArchitecture(process.cwd());
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.violations.length ? 1 : 0;
}
