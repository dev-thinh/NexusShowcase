import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import { describe, expect, it } from 'vitest';

describe('sitewide panel system', () => {
  const css = fs.readFileSync(path.resolve(process.cwd(), 'src/app/globals.css'), 'utf-8');

  it.each([
    '.panel-public',
    '.panel-operational',
    '.panel-detail',
    '.panel-nested',
    '.panel-callout',
    '.action-secondary-card',
    '.action-primary-detail',
    '.action-secondary-detail',
  ])('defines %s', (className) => {
    expect(css).toContain(className);
  });

  it('keeps card and detail action heights distinct', () => {
    expect(css).toMatch(/\.action-secondary-card[\s\S]*@apply[^;]*h-9/);
    expect(css).toMatch(/\.action-primary-detail[\s\S]*@apply[^;]*h-10/);
  });

  it('compiles restrained radii for content and nested panels', async () => {
    const result = await postcss([
      tailwindcss({
        content: [{ raw: '<div class="panel-public panel-detail panel-nested rounded-lg rounded-md" />' }],
      }),
    ]).process(css, { from: path.resolve(process.cwd(), 'src/app/globals.css') });

    expect(result.css).toMatch(/\.panel-public\s*{[^}]*border-radius:\s*0\.5rem/s);
    expect(result.css).toMatch(/\.panel-detail\s*{[^}]*border-radius:\s*0\.5rem/s);
    expect(result.css).toMatch(/\.panel-nested\s*{[^}]*border-radius:\s*0\.375rem/s);
  });
});
