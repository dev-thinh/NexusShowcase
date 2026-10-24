import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { checkArchitecture } from '../../scripts/check-architecture.mjs';
const owned: string[] = [];
function fixture(files: Record<string, string>) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-architecture-'));
  owned.push(root);
  for (const [file, source] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), source); }
  return root;
}
afterEach(() => {
  for (const root of owned.splice(0)) {
    if (path.dirname(root) !== path.resolve(os.tmpdir()) || !path.basename(root).startsWith('nexus-architecture-')) throw Error('Invalid test fixture cleanup');
    fs.rmSync(root, { recursive: true, force: true });
  }
});
it('rejects shared imports of a feature', () => {
  const root = fixture({ 'src/shared/ui/a.ts': "export * from '@/features/identity/model/user'", 'src/features/identity/model/user.ts': 'export const user = 1;' });
  expect(checkArchitecture(root).violations).toContainEqual(expect.objectContaining({ rule: 'shared-imports-feature' }));
});
it('follows export-star and dynamic imports to detect transitive client/server leaks', () => {
  const root = fixture({ 'src/features/review/components/a.ts': "'use client'; import('./barrel');", 'src/features/review/components/barrel.ts': "export * from '../server/secret';", 'src/features/review/server/secret.ts': "import 'server-only'; export const secret = 1;" });
  expect(checkArchitecture(root).violations).toContainEqual(expect.objectContaining({ rule: 'client-imports-server' }));
});
it('detects runtime cycles including require', () => {
  const root = fixture({ 'src/features/review/a.ts': "import '../submissions/b';", 'src/features/submissions/b.ts': "require('../review/a');" });
  expect(checkArchitecture(root).violations).toContainEqual(expect.objectContaining({ rule: 'runtime-cycle' }));
});
it('allows client type imports and server action references', () => {
  const root = fixture({ 'src/features/review/components/a.ts': "'use client'; import type { Row } from '../server/types'; import { run } from '../server/actions';", 'src/features/review/server/types.ts': "export type Row = { id: string };", 'src/features/review/server/actions.ts': "'use server'; import 'server-only'; export async function run() {}" });
  expect(checkArchitecture(root).violations).toEqual([]);
});
