import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { expect, it } from 'vitest';
import { z } from 'zod';
import { ValidatedForm } from '@/shared/ui/validated-form';

it('disables native validation while preserving accessible required inputs', () => {
  const html = renderToStaticMarkup(<ValidatedForm schema={z.object({ name: z.string().min(1) })}><input name="name" required /></ValidatedForm>);
  expect(html).toContain('noValidate=""');
  expect(html).toContain('required=""');
});

it('routes application forms through shared validation or the schema-backed submission editor', () => {
  const failures: string[] = [];
  function inspect(folder: string) {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = join(folder, entry.name);
      if (entry.isDirectory()) { inspect(path); continue; }
      if (!entry.name.endsWith('.tsx')) continue;
      const name = relative('src', path).replaceAll('\\', '/');
      if (name === 'shared/ui/validated-form.tsx') continue;
      const source = readFileSync(path, 'utf8');
      const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      function visit(node: ts.Node) {
        if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === 'next/form') failures.push(name);
        if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(ast) === 'form') {
          const noValidate = node.attributes.properties.some(prop => ts.isJsxAttribute(prop) && prop.name.getText(ast) === 'noValidate');
          if (name !== 'features/submissions/components/submission-editor.tsx' || !noValidate) failures.push(name);
        }
        ts.forEachChild(node, visit);
      }
      visit(ast);
    }
  }
  inspect('src');
  expect(failures).toEqual([]);
});
