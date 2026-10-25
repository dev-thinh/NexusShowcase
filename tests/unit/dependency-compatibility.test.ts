import { loadConfigFromFile } from '@prisma/config';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
import { showcaseDraftInputSchema, showcaseSubmissionInputSchema } from '@/features/submissions/model/input';
import { validationFailure } from '@/features/submissions/model/validation-result';

it('preserves trimmed draft values, defaults and strict field validation', () => {
  expect(showcaseDraftInputSchema.parse({ title: ' Draft ' })).toMatchObject({
    title: 'Draft', summary: '', content: '', type: 'PROJECT', contributors: [], resources: [],
  });
  expect(showcaseDraftInputSchema.safeParse({ title: 'Draft', unexpected: true }).success).toBe(false);
});

it('preserves localized submission errors grouped by their top-level field', () => {
  const result = showcaseSubmissionInputSchema.safeParse({ title: ' ', resources: [{ kind: 'LINK', label: '', url: 'javascript:alert(1)' }] });
  expect(result.success).toBe(false);
  if (result.success) throw new Error('Expected invalid submission');
  expect(validationFailure(result.error)).toMatchObject({
    success: false,
    code: 'VALIDATION',
    fieldErrors: {
      title: ['Vui lòng nhập tiêu đề.'],
      summary: ['Vui lòng nhập abstract / tóm tắt.'],
      contributors: ['Vui lòng thêm ít nhất một người đóng góp.'],
      resources: expect.any(Array),
    },
  });
});

it('loads Prisma configuration through the patched deepmerge dependency without a database', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'nexus-prisma-config-'));
  try {
    await writeFile(path.join(directory, 'prisma.config.mjs'), 'export default { schema: "schema.prisma", migrations: { path: "migrations", seed: "node seed.js" } };');
    const result = await loadConfigFromFile({ configRoot: directory });
    expect(result.error).toBeUndefined();
    expect(result.config).toMatchObject({ migrations: { seed: 'node seed.js' } });
    expect(result.config?.schema).toBe(path.join(directory, 'schema.prisma'));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
