import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import { describe, expect, it } from 'vitest';

describe('heading gutter utilities', () => {
  it('compiles an icon outside the text flow while keeping a safe mobile offset', async () => {
    const input = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');
    const result = await postcss([
      tailwindcss({
        content: [{ raw: '<div class="heading-gutter relative"><svg class="heading-gutter-icon absolute right-full top-0 mr-1 sm:mr-3" /></div>' }],
      }),
    ]).process(input, { from: resolve(process.cwd(), 'src/app/globals.css') });

    expect(result.css).toMatch(/\.heading-gutter\s*{[^}]*position:\s*relative/s);
    expect(result.css).toMatch(/\.heading-gutter-icon\s*{[^}]*position:\s*absolute[^}]*right:\s*100%/s);
    expect(result.css).toMatch(/@media \(min-width:\s*640px\)[\s\S]*\.heading-gutter-icon\s*{[^}]*margin-right:\s*0\.75rem/s);
  });
});
