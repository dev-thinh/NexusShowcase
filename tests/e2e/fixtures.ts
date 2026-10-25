import { defaultMoments, defaultResearchImages } from '../fixtures/moments';
import { test as base, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { TestUser } from '../fixtures/benchmark';
import { assertTestDatabaseUrl, verifyTestDatabase } from '../setup/database-guard';

type Manifest = { prefix: string; users: TestUser[] };
export const test = base.extend<{ fixture: Manifest; database: PrismaClient }>({
  fixture: async ({}, use) => {
    if (!process.env.HARNESS_MANIFEST) throw Error('Missing isolated harness manifest.');
    await use(JSON.parse(readFileSync(process.env.HARNESS_MANIFEST, 'utf8')));
  },
  database: async ({ fixture }, use) => {
    const url = new URL(process.env.TEST_DATABASE_URL!);
    url.searchParams.set('schema', fixture.prefix);
    const client = new PrismaClient({ datasources: { db: { url: url.toString() } }, log: [] });
    try { await verifyTestDatabase(client, url.toString()); await use(client); } finally { await client.$disconnect(); }
  },
});
export { expect };
export async function login(page: Page, user: TestUser, callbackUrl = '/dashboard') {
  // Fixture logins repeat across browser scenarios. Reset only this seeded
  // identity's budget; direct form submissions still exercise real throttling.
  if (!process.env.HARNESS_MANIFEST) throw Error('Missing isolated harness manifest.');
  const manifest = JSON.parse(readFileSync(process.env.HARNESS_MANIFEST, 'utf8')) as Manifest;
  if (!/^nexus_test_[a-f0-9]{32}$/.test(manifest.prefix)
    || !user.email.startsWith(`${manifest.prefix}-`)
    || !manifest.users.some(candidate => candidate.id === user.id && candidate.email === user.email)) {
    throw Error('Login budget reset requires an owned harness fixture identity.');
  }
  // The harness app uses the same dedicated test database, so validate its
  // dedicated name here and verify the selected schema against the catalog.
  const url = new URL(assertTestDatabaseUrl(undefined, process.env.TEST_DATABASE_URL, {}));
  url.searchParams.set('schema', manifest.prefix);
  const client = new PrismaClient({ datasources: { db: { url: url.toString() } }, log: [] });
  try {
    await verifyTestDatabase(client, url.toString());
    const key = createHash('sha256').update(JSON.stringify(['login', user.email.trim().toLowerCase()])).digest('hex');
    await client.rateLimitBucket.deleteMany({ where: { key } });
  } finally { await client.$disconnect(); }
  await page.goto(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  await page.locator('#identifier').fill(user.email);
  await page.locator('#password').fill(user.password);
  await page.locator('form button[type="submit"]').click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
}

export async function seedPhotoGalleries(database: PrismaClient) {
  for (const [id, photos] of [['home', defaultMoments], ['research', defaultResearchImages]] as const) {
    await database.homeMomentsGallery.upsert({ where: { id }, create: { id, photos: [...photos] }, update: { photos: [...photos], version: 0 } });
  }
}
