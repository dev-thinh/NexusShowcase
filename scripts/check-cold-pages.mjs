import { chromium } from '@playwright/test';
import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';
import { mkdirSync, writeFileSync } from 'node:fs';

nextEnv.loadEnvConfig(process.cwd());
const baseURL = process.env.PERF_BASE_URL ?? 'http://127.0.0.1:3001';
if (!['127.0.0.1', 'localhost'].includes(new URL(baseURL).hostname)) throw Error('Use a local production preview.');
const budgetMs = Number(process.env.PERF_PAGE_BUDGET_MS ?? 2000);
if (!Number.isFinite(budgetMs) || budgetMs <= 0) throw Error('Invalid page budget.');
const adminLogin = process.argv.includes('--admin');
const prisma = new PrismaClient({ log: [] });
const routes = ['/', '/category/bai-bao-khoa-hoc', '/category/robotics-iot', '/members', '/members/all', '/contact', '/login'];
const skipped = [];
let browser;
try {
  const item = await prisma.showcaseItem.findFirst({ where: { status: 'PUBLISHED', visibility: 'PUBLIC' }, select: { id: true, slug: true } });
  const member = await prisma.user.findFirst({ where: { status: 'ACTIVE', deletedAt: null, role: { in: ['ADMIN', 'CORE_MEMBER', 'MEMBER'] } }, select: { id: true } });
  if (item) routes.push(`/showcase/${item.slug}`);
  else skipped.push('Publication detail: no public sample.');
  if (member) routes.push(`/members/${member.id}`);
  else skipped.push('Member detail: no active sample.');
  browser = await chromium.launch({ headless: true, channel: process.env.PERF_BROWSER_CHANNEL ?? 'chrome' });
  let storageState;
  if (adminLogin) {
    if (!process.env.BOOTSTRAP_ADMIN_EMAIL || !process.env.BOOTSTRAP_ADMIN_PASSWORD) throw Error('Local admin credentials are not configured.');
    const login = await browser.newContext();
    try {
      const page = await login.newPage();
      await page.goto(`${baseURL}/login`);
      await page.locator('#identifier').fill(process.env.BOOTSTRAP_ADMIN_EMAIL);
      await page.locator('#password').fill(process.env.BOOTSTRAP_ADMIN_PASSWORD);
      await page.locator('form button[type="submit"]').click();
      await page.waitForURL(url => url.pathname !== '/login', { timeout: 15000 });
      storageState = await login.storageState();
    } finally { await login.close(); }
    routes.push('/account/change-password', '/dashboard', '/dashboard/items/new', '/admin', '/admin/members', '/admin/reviews');
    if (item) routes.push(`/admin/reviews/${item.id}`, `/admin/reviews/${item.id}/preview`);
    const draft = await prisma.showcaseItem.findFirst({ where: { creator: { role: 'ADMIN', email: process.env.BOOTSTRAP_ADMIN_EMAIL }, status: { in: ['DRAFT', 'REVISION_REQUESTED'] } }, select: { id: true } });
    if (draft) routes.push(`/dashboard/items/${draft.id}/edit`);
    else skipped.push('Editor: no editable draft owned by configured admin; no data created.');
  } else skipped.push('Authenticated pages: rerun with --admin using configured local admin.');
  const samples = [];
  for (const route of routes) {
    // Each route gets a new browser context, empty asset cache and no service worker.
    const context = await browser.newContext({ storageState: route === '/login' ? undefined : storageState, serviceWorkers: 'block' });
    try {
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      const started = performance.now();
      const response = await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded' });
      await page.locator(route === '/' ? '.home-hero h1' : 'main').first().waitFor();
      if (route !== '/') await page.waitForFunction(() => !document.querySelector('main [aria-busy="true"]'), undefined, { timeout: 15000 });
      const sample = { route, status: response.status(), finalPath: new URL(page.url()).pathname, contentMs: Math.round(performance.now() - started) };
      if (route === '/') {
        await page.locator('[data-deferred-section="featured"]').scrollIntoViewIfNeeded();
        await page.locator('[data-deferred-section="featured"][data-state="ready"]').waitFor();
        sample.featuredMs = Math.round(performance.now() - started);
      }
      sample.passed = sample.status === 200 && sample.finalPath === route && Math.max(sample.contentMs, sample.featuredMs ?? 0) <= budgetMs;
      samples.push(sample);
      console.log(`${sample.passed ? 'PASS' : 'FAIL'} ${route}: ${sample.contentMs}ms${sample.featuredMs ? `; featured ${sample.featuredMs}ms` : ''}`);
    } finally { await context.close(); }
  }
  const report = { timestamp: new Date().toISOString(), baseURL, budgetMs, mode: 'cold browser, cache disabled, local production', browser: browser.version(), authenticated: adminLogin, samples, skipped };
  mkdirSync('docs/superpowers/reports/performance', { recursive: true });
  writeFileSync('docs/superpowers/reports/performance/cold-pages.json', JSON.stringify(report, null, 2));
  skipped.forEach(reason => console.log(`SKIP ${reason}`));
  if (samples.some(sample => !sample.passed)) process.exitCode = 1;
} catch {
  // Never emit browser fill traces, credentials or database connection strings.
  console.error('Cold page audit failed. Check local preview availability, browser installation and configured credentials.');
  process.exitCode = 1;
} finally {
  await browser?.close();
  await prisma.$disconnect();
}
