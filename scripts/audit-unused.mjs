import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { sourceFiles, readModuleGraph } from './check-architecture.mjs';

export function auditUnused(root) {
  root = path.resolve(root);
  const configurations = fs.readdirSync(root).filter(name => /^(next|tailwind|postcss|vitest(?:\.integration)?|playwright)\.config\.[cm]?[jt]s$/.test(name));
  const files = [...sourceFiles(path.join(root, 'src')), ...sourceFiles(path.join(root, 'scripts')), ...sourceFiles(path.join(root, 'prisma')), ...configurations.map(file => path.join(root, file))];
  const graph = readModuleGraph(root, files);
  const pkg = path.join(root, 'package.json');
  const commands = fs.existsSync(pkg) ? Object.values(JSON.parse(fs.readFileSync(pkg, 'utf8')).scripts ?? {}).join('\n') : '';
  const roots = [...graph.keys()].filter(file => configurations.includes(file) || /^src\/app\/.*\/(page|layout|route|loading|error|not-found|global-error|template|default)\.[jt]sx?$/.test(file) || /^src\/app\/(page|layout|route|loading|error|not-found)\.[jt]sx?$/.test(file) || commands.includes(file));
  const reachable = new Set();
  function visit(file) {
    if (reachable.has(file)) return;
    reachable.add(file);
    for (const dependency of graph.get(file)?.dependencies ?? []) if (dependency.target) visit(dependency.target);
  }
  roots.forEach(visit);
  const usedNames = new Map(), dynamicReferenceWarnings = [], exported = [];
  for (const file of graph.keys()) {
    const sf = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true);
    const identifiers = new Map();
    function walk(node) {
      if (ts.isIdentifier(node)) identifiers.set(node.text, (identifiers.get(node.text) ?? 0) + 1);
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(node.arguments[0] ?? {}) && reachable.has(file)) {
        const dependency = graph.get(file).dependencies.find(dependency => dependency.specifier === node.arguments[0].text);
        if (dependency?.target) {
          const names = usedNames.get(dependency.target) ?? new Set();
          // Dynamic imports expose a module namespace, including through Promise.all.
          names.add('*');
          usedNames.set(dependency.target, names);
        }
      }
      if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || ts.isIdentifier(node.expression) && node.expression.text === 'require') && !ts.isStringLiteral(node.arguments[0] ?? {})) dynamicReferenceWarnings.push(file);
      ts.forEachChild(node, walk);
    }
    walk(sf);
    for (const statement of sf.statements) {
      if (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement) && statement.moduleSpecifier) {
        const dependency = graph.get(file).dependencies.find(dependency => dependency.specifier === statement.moduleSpecifier.text);
        if (!dependency?.target || !reachable.has(file)) continue;
        const names = usedNames.get(dependency.target) ?? new Set();
        const bindings = ts.isImportDeclaration(statement) ? statement.importClause?.namedBindings : statement.exportClause;
        if (bindings && (ts.isNamedImports(bindings) || ts.isNamedExports(bindings))) for (const name of bindings.elements) names.add(name.propertyName?.text ?? name.name.text);
        else names.add('*');
        usedNames.set(dependency.target, names);
      }
      if (!statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword) || statement.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword)) continue;
      const names = ts.isFunctionDeclaration(statement) ? [statement.name?.text] : ts.isVariableStatement(statement) ? statement.declarationList.declarations.map(declaration => declaration.name.getText(sf)) : [];
      for (const name of names.filter(Boolean)) if ((identifiers.get(name) ?? 0) === 1) exported.push({ file, name });
    }
  }
  return {
    unreachableFiles: [...graph.keys()].filter(file => !reachable.has(file)).sort(),
    unusedExports: exported.filter(({ file, name }) => reachable.has(file) && !roots.includes(file) && !usedNames.get(file)?.has(name) && !usedNames.get(file)?.has('*')),
    dynamicReferenceWarnings: [...new Set(dynamicReferenceWarnings)].sort(),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = auditUnused(process.cwd());
  console.log(JSON.stringify(result, null, 2));
  if (process.argv.includes('--check')) {
    const exceptions = JSON.parse(fs.readFileSync(new URL('./unused-exceptions.json', import.meta.url), 'utf8'));
    const unknown = result.unusedExports.filter(entry => !exceptions[`${entry.file}#${entry.name}`]);
    const observed = new Set(result.unusedExports.map(entry => `${entry.file}#${entry.name}`));
    const stale = Object.keys(exceptions).filter(key => !observed.has(key));
    if (result.unreachableFiles.length || result.dynamicReferenceWarnings.length || unknown.length || stale.length) {
      console.error(JSON.stringify({ unusedGateFailed: true, unknown, staleExceptions: stale }));
      process.exitCode = 1;
    }
  }
}
