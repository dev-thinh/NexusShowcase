import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { assertTestDatabaseUrl, verifyTestDatabase } from '../tests/setup/database-guard';
import { auditAssetReferences } from './audit-asset-references';

const migrations = ['20261001_initial_baseline', '20261014_submission_editor_workflow', '20261018_author_sections_direct_review', '20261019_remove_item_tags'];
const ownedSchema = /^nexus_upgrade_[a-f0-9]{32}_(fresh|legacy)$/;
const schemaOf = (url: string) => new URL(url).searchParams.get('schema') ?? 'public';
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');

async function cli(args: string[], url: string, stage: string) {
  const result = await new Promise<{ code: number; output: string }>((resolve, reject) => {
    const child = spawn(process.execPath, [path.resolve('node_modules/prisma/build/index.js'), ...args], {
      env: { ...process.env, DATABASE_URL: url }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { output += chunk.toString(); });
    child.once('error', () => reject(Error(`Database verifier could not start ${stage}.`)));
    child.once('exit', code => resolve({ code: code ?? 1, output }));
  });
  if (result.code) {
    // CLI connection errors can include credentials. Keep only a known error code.
    const code = result.output.match(/\bP\d{4}\b/)?.[0] ?? `exit${result.code}`;
    throw Error(`Database verifier ${stage} failed (${code}); no runtime database was modified.`);
  }
}

async function executeMigration(name: string, url: string) {
  await cli(['db', 'execute', '--file', `prisma/migrations/${name}/migration.sql`, '--schema', 'prisma/schema.prisma'], url, name);
  await cli(['migrate', 'resolve', '--applied', name], url, `record-test-${name}`);
}

export async function inventoryIdentifierCollisions(client: PrismaClient): Promise<Array<{ normalized: string; userIds: string[] }>> {
  return client.$queryRaw`WITH identifiers AS (
    SELECT id, lower(btrim(email)) AS normalized FROM users
    UNION SELECT id, regexp_replace(lower(btrim(email)), '@(robotics|nexus)\\.hcmus\\.edu\\.vn$', '') FROM users
  ) SELECT normalized, array_agg(DISTINCT id ORDER BY id) AS "userIds" FROM identifiers
    GROUP BY normalized HAVING count(DISTINCT id) > 1`;
}

async function inventoryRuntime() {
  loadEnvConfig(process.cwd());
  const client = new PrismaClient({ log: [] });
  try {
    const collisions = await inventoryIdentifierCollisions(client);
    const [table] = await client.$queryRaw<Array<{ exists: boolean }>>`SELECT to_regclass(quote_ident(current_schema()) || '._prisma_migrations') IS NOT NULL AS exists`;
    const history = table.exists ? await client.$queryRaw<Array<{ migration_name: string; checksum: string; finished: boolean }>>`SELECT migration_name, checksum, finished_at IS NOT NULL AS finished FROM _prisma_migrations ORDER BY started_at` : [];
    const assets = await auditAssetReferences({ prisma: client, root: process.cwd() });
    const report = { timestamp: new Date().toISOString(), readOnly: true, managedHistoryPresent: table.exists, history, identifierCollisions: collisions.map(row => ({ normalizedHash: hash(row.normalized), userIds: row.userIds })), assets: { referenced: assets.referenced.length, provisionalUnreferenced: assets.unreferenced.length, incompleteSources: assets.incompleteSources }, deletedFiles: 0 };
    writeFileSync('docs/superpowers/reports/database-inventory.json', JSON.stringify(report, null, 2) + '\n');
    console.log(`Read-only inventory complete: ${collisions.length} collision groups; no database or asset changes.`);
  } finally { await client.$disconnect(); }
}

export async function verifyDatabaseUpgrade(input: { freshUrl: string; legacyFixtureUrl: string; outputPath: string }): Promise<void> {
  const urls = [input.freshUrl, input.legacyFixtureUrl];
  if (schemaOf(urls[0]) === schemaOf(urls[1])) throw Error('Upgrade verification requires two distinct owned schemas.');
  for (const url of urls) {
    assertTestDatabaseUrl(process.env.DATABASE_URL, url, {});
    if (!ownedSchema.test(schemaOf(url))) throw Error('Upgrade verification accepts only generated test schemas.');
  }
  const clients = urls.map(url => new PrismaClient({ datasources: { db: { url } }, log: [] }));
  const legacy = clients[1];
  try {
    for (const [index, client] of clients.entries()) {
      await verifyTestDatabase(client, urls[index]);
      const tables = await client.$queryRaw<Array<{ total: bigint }>>`SELECT count(*) AS total FROM pg_tables WHERE schemaname = current_schema()`;
      if (Number(tables[0].total)) throw Error('Upgrade verification requires empty test schemas.');
    }
    // This deliberately fails before the baseline exists: the original chain starts ALTER TYPE Role.
    await cli(['migrate', 'deploy'], input.freshUrl, 'fresh-deploy');
    await cli(['migrate', 'diff', '--from-schema-datasource', 'prisma/schema.prisma', '--to-schema-datamodel', 'prisma/schema.prisma', '--exit-code'], input.freshUrl, 'fresh-schema-diff');

    await executeMigration(migrations[0], input.legacyFixtureUrl);
    await legacy.$executeRaw`INSERT INTO users (id, email, "fullName", role, status, "updatedAt") VALUES ('upgrade-author', 'upgrade-fixture@nexus.test', 'Upgrade fixture', 'CORE_MEMBER', 'ACTIVE', CURRENT_TIMESTAMP)`;
    await legacy.$executeRaw`INSERT INTO showcase_items (id, slug, title, summary, content, type, status, visibility, "creatorId", "updatedAt", tags)
      VALUES ('upgrade-live', 'upgrade-live', 'Original live title', 'Live summary', 'Original live content', 'PROJECT', 'PUBLISHED', 'PUBLIC', 'upgrade-author', CURRENT_TIMESTAMP, ARRAY['legacy'])`;
    await executeMigration(migrations[1], input.legacyFixtureUrl);
    // The generated client describes the final schema, but these fixtures are
    // written between migrations. Return only columns present at this stage.
    await legacy.user.update({ where: { id: 'upgrade-author' }, data: { role: 'EDITOR', sessionVersion: 3 }, select: { id: true } });
    await legacy.$executeRaw`INSERT INTO showcase_items (id, slug, title, summary, type, status, "creatorId", "updatedAt") VALUES ('upgrade-draft', 'upgrade-draft', 'Pending draft', 'Draft summary', 'PROJECT', 'READY_FOR_APPROVAL', 'upgrade-author', CURRENT_TIMESTAMP)`;
    const snapshot = { title: 'Immutable submitted title', summary: 'Submitted summary', content: 'Immutable history', tags: ['historical'] };
    const revision = await legacy.submissionRevision.create({ data: { itemId: 'upgrade-live', revisionNumber: 1, submittedById: 'upgrade-author', snapshot }, select: { id: true } });
    await legacy.editorialDraft.create({ data: { itemId: 'upgrade-live', assignedEditorId: 'upgrade-author', overrides: { title: 'Legacy editorial title', tags: ['removed'] } }, select: { id: true } });
    await legacy.auditEvent.create({ data: { itemId: 'upgrade-live', actorId: 'upgrade-author', action: 'LEGACY_FIXTURE', metadata: { preserve: true } }, select: { id: true } });
    await legacy.reviewComment.create({ data: { itemId: 'upgrade-live', revisionId: revision.id, authorId: 'upgrade-author', audience: 'AUTHOR', severity: 'REQUIRED', fieldKey: 'title', body: 'Retain history' }, select: { id: true } });
    await executeMigration(migrations[2], input.legacyFixtureUrl);
    const authorDraft = { title: 'Unpublished update', summary: 'Still private', content: 'Draft content', tags: ['removed'] };
    await legacy.showcaseItem.update({ where: { id: 'upgrade-live' }, data: { authorDraft }, select: { id: true } });
    await cli(['migrate', 'deploy'], input.legacyFixtureUrl, 'legacy-deploy');
    await cli(['migrate', 'diff', '--from-schema-datasource', 'prisma/schema.prisma', '--to-schema-datamodel', 'prisma/schema.prisma', '--exit-code'], input.legacyFixtureUrl, 'legacy-schema-diff');
    const [user, live, draft, history, editorial, auditCount, commentCount] = await Promise.all([
      legacy.user.findUniqueOrThrow({ where: { id: 'upgrade-author' } }),
      legacy.showcaseItem.findUniqueOrThrow({ where: { id: 'upgrade-live' } }),
      legacy.showcaseItem.findUniqueOrThrow({ where: { id: 'upgrade-draft' } }),
      legacy.submissionRevision.findUniqueOrThrow({ where: { id: revision.id } }),
      legacy.editorialDraft.findUniqueOrThrow({ where: { itemId: 'upgrade-live' } }),
      legacy.auditEvent.count(), legacy.reviewComment.count(),
    ]);
    const invariants = {
      roleAndSession: user.role === 'CORE_MEMBER' && user.sessionVersion === 4,
      livePreserved: live.title === 'Original live title' && live.content === 'Original live content' && live.visibility === 'PUBLIC',
      draftPreserved: isDeepStrictEqual(live.authorDraft, { content: authorDraft.content, summary: authorDraft.summary, title: authorDraft.title }),
      historyPreserved: isDeepStrictEqual(history.snapshot, snapshot),
      workflowVersion: draft.status === 'PENDING_REVIEW' && live.reviewVersion === 0 && draft.reviewVersion === 0,
      editorialPreserved: JSON.stringify(editorial.overrides) === JSON.stringify({ title: 'Legacy editorial title' }),
      auditAndCommentsPreserved: auditCount === 1 && commentCount === 1,
    };
    if (Object.values(invariants).some(value => !value)) throw Error('Database verifier fixture invariant failed.');
    await legacy.showcaseItem.delete({ where: { id: 'upgrade-live' } });
    const cascadePreserved = await legacy.submissionRevision.count() === 0 && await legacy.auditEvent.count() === 0 && await legacy.reviewComment.count() === 0 && await legacy.editorialDraft.count() === 0;
    if (!cascadePreserved) throw Error('Database verifier cascade invariant failed.');
    const migrationHashes = Object.fromEntries(migrations.map(name => [name, hash(readFileSync(`prisma/migrations/${name}/migration.sql`))]));
    mkdirSync(path.dirname(input.outputPath), { recursive: true });
    writeFileSync(input.outputPath, JSON.stringify({ timestamp: new Date().toISOString(), freshSchemaDiff: 'empty', legacySchemaDiff: 'empty', invariants: { ...invariants, cascadePreserved }, migrationHashes, runtimeMutations: false }, null, 2) + '\n');
  } finally { await Promise.all(clients.map(client => client.$disconnect())); }
}

async function main() {
  loadEnvConfig(process.cwd());
  const url = assertTestDatabaseUrl(process.env.DATABASE_URL, process.env.TEST_DATABASE_URL, {});
  const catalog = new PrismaClient({ datasources: { db: { url } }, log: [] });
  const prefix = `nexus_upgrade_${randomUUID().replaceAll('-', '')}`;
  const schemas = [`${prefix}_fresh`, `${prefix}_legacy`];
  const created: string[] = [];
  try {
    await verifyTestDatabase(catalog, url);
    for (const schema of schemas) {
      if (!ownedSchema.test(schema)) throw Error('Invalid generated upgrade schema.');
      await catalog.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
      created.push(schema);
    }
    const targets = schemas.map(schema => { const target = new URL(url); target.searchParams.set('schema', schema); return target.toString(); });
    await verifyDatabaseUpgrade({ freshUrl: targets[0], legacyFixtureUrl: targets[1], outputPath: 'docs/superpowers/reports/database-verification.json' });
    console.log('Fresh and legacy schema verification passed; all fixture invariants preserved.');
  } finally {
    for (const schema of created) {
      await verifyTestDatabase(catalog, url);
      if (!ownedSchema.test(schema)) throw Error('Refusing cleanup of unowned schema.');
      await catalog.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
    }
    await catalog.$disconnect();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) (process.argv.includes('--inventory') ? inventoryRuntime() : main()).catch(error => {
  console.error(error instanceof Error && /^(Database verifier|Upgrade verification|TEST_DATABASE_URL|Cannot verify|Dedicated)/.test(error.message) ? error.message : 'Database upgrade verification failed; connection details withheld.');
  process.exitCode = 1;
});
