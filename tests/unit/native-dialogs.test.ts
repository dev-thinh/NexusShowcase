import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? sources(file) : /\.tsx?$/.test(file) ? [file] : [];
  });
}

describe('application feedback', () => {
  it('uses application dialogs instead of blocking browser alerts, confirms and prompts', () => {
    const nativeDialog = /\b(?:window|globalThis)\s*\.\s*(?:alert|confirm|prompt)\s*\(|(?<![\w.])(?:alert|confirm|prompt)\s*\(/;
    const offenders = sources(path.resolve('src')).filter(file => nativeDialog.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
