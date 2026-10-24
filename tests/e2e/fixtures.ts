import { defaultMoments, defaultResearchImages } from '../fixtures/moments';
import { test as base, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import type { TestUser } from '../fixtures/benchmark';
import { verifyTestDatabase } from '../setup/database-guard';

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
