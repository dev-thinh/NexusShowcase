import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('sitewide panel system', () => {
  const css = fs.readFileSync(path.resolve(process.cwd(), 'src/app/globals.css'), 'utf-8');

  it.each([
    '.panel-public',
    '.panel-operational',
    '.panel-detail',
    '.panel-nested',
    '.panel-callout',
    '.action-row-card',
    '.action-row-detail',
    '.action-primary-card',
    '.action-secondary-card',
    '.action-primary-detail',
    '.action-secondary-detail',
  ])('defines %s', (className) => {
    expect(css).toContain(className);
  });

  it('keeps card and detail action heights distinct', () => {
    expect(css).toMatch(/\.action-primary-card[\s\S]*@apply[^;]*h-9/);
    expect(css).toMatch(/\.action-primary-detail[\s\S]*@apply[^;]*h-10/);
  });
});
