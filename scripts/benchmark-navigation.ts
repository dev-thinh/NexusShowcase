import { chromium, type Page, type Response } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

type Event = { name: 'auth' | 'query'; durationMs: number; timestamp: number };
type Route = { path: string; shellSelector: string; shellText?: string; dataText: string };
const routes: Route[] = [
  { path: '/category/bai-bao-khoa-hoc', shellSelector: 'main h1', shellText: 'Benchmark Research', dataText: 'Benchmark Research 0000' },
  { path: '/category/robotics-iot', shellSelector: 'main h1', shellText: 'Benchmark Robotics', dataText: 'Benchmark Robotics 0001' },
  { path: '/members', shellSelector: 'main h1', dataText: 'Benchmark Member 000' },
  { path: '/', shellSelector: '#home-content', dataText: 'Công trình nổi bật' },
];
type Metric = number | null;
type Sample = {
  correlationId: string; route: string; mode: 'cold-browser' | 'warm'; run: number;
  windowStart: number; windowEnd: number; clickToPendingMs: Metric; clickToShellMs: Metric; clickToDataMs: Metric;
  authMs: Metric; queryCount: Metric; queryMs: Metric; rscBytes: Metric;
  requestQueryCount: null; requestQueryMs: null; serverEvents: Event[]; rscResponses: number;
  outcome: 'visible' | 'content-timeout' | 'navigation-error'; unavailable: Record<string, string>;
};
const metricNames = ['clickToPendingMs', 'clickToShellMs', 'clickToDataMs', 'authMs', 'queryCount', 'queryMs', 'rscBytes'] as const;

function eventsFromFile(start: number, end: number): Event[] {
  if (!process.env.HARNESS_EVENTS || !existsSync(process.env.HARNESS_EVENTS)) return [];
  return readFileSync(process.env.HARNESS_EVENTS, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line) as Event).filter(event => event.timestamp >= start && event.timestamp <= end);
}

async function measure(page: Page, route: Route, mode: Sample['mode'], run: number): Promise<Sample> {
  const correlationId = randomUUID();
  // UUID identifies the serial browser observation window, not an exact server request.
  const windowStart = Date.now();
  const responseSizes: Array<Promise<number | null>> = [];
  function responseListener(response: Response) {
    if (response.headers()['content-type']?.includes('text/x-component')) {
      responseSizes.push(response.body().then(body => body.byteLength).catch(() => null));
    }
  }
  page.on('response', responseListener);
  await page.evaluate(target => {
    const state = { start: null as number | null, pending: null as number | null, shell: null as number | null, data: null as number | null };
    const visible = (element: Element | null) => !!element && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden' && getComputedStyle(element).opacity !== '0';
    const update = () => {
      if (state.start === null) return;
      const elapsed = performance.now() - state.start;
      if (state.pending === null && document.querySelector('[data-navigation-pending="true"]')) state.pending = elapsed;
      const shell = document.querySelector(target.shellSelector);
      const active = document.querySelector(`nav a[href="${target.path}"][aria-current="page"]`);
      if (state.shell === null && active && visible(shell) && (!target.shellText || shell?.textContent?.includes(target.shellText))) state.shell = elapsed;
      if (state.data === null && state.shell !== null && [...document.querySelectorAll('main h2, main h3')].some(element => visible(element) && element.textContent?.trim() === target.dataText)) state.data = elapsed;
    };
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    const click = (event: MouseEvent) => {
      if ((event.target as Element).closest(`nav a[href="${target.path}"]`)) { state.start = performance.now(); requestAnimationFrame(update); }
    };
    document.addEventListener('click', click, { capture: true });
    (window as unknown as { __navigationMeasurement: unknown }).__navigationMeasurement = { state, stop: () => { observer.disconnect(); document.removeEventListener('click', click, { capture: true }); update(); } };
  }, route);
  let outcome: Sample['outcome'] = 'visible';
  try {
    await page.locator(`nav a[href="${route.path}"]`).first().click({ timeout: 5000 });
    await page.waitForFunction(() => (window as unknown as { __navigationMeasurement: { state: { data: number | null } } }).__navigationMeasurement?.state.data != null, undefined, { timeout: 3500 });
  } catch { outcome = page.url().replace(/\?.*$/, '').endsWith(route.path) ? 'content-timeout' : 'navigation-error'; }
  const browser = await page.evaluate(() => {
    const value = (window as unknown as { __navigationMeasurement: { state: { pending: number | null; shell: number | null; data: number | null }; stop(): void } }).__navigationMeasurement;
    value.stop(); return value.state;
  });
  // Drain in-flight RSC bodies/prefetch and let the stdout pipe deliver completed events.
  await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
  await new Promise(resolve => setTimeout(resolve, 50));
  page.off('response', responseListener);
  const sizes = await Promise.all(responseSizes);
  const windowEnd = Date.now();
  const serverEvents = eventsFromFile(windowStart, windowEnd);
  const auth = serverEvents.filter(event => event.name === 'auth');
  const queries = serverEvents.filter(event => event.name === 'query');
  const unavailable: Record<string, string> = { requestQueryCount: 'Prisma engine events cannot be attributed reliably to individual Next requests.', requestQueryMs: 'Serial window query durations include prefetch/background work.' };
  if (browser.pending === null) unavailable.clickToPendingMs = 'No pending marker observed; cached navigation may commit before a pending paint.';
  if (browser.shell === null) unavailable.clickToShellMs = 'Destination shell did not become visible inside the observation timeout.';
  if (browser.data === null) unavailable.clickToDataMs = 'Fixture content did not become visible inside the observation timeout.';
  if (!auth.length) unavailable.authMs = 'No auth operation event observed in this window (route/router cache or no auth work).';
  if (!queries.length) { unavailable.queryCount = 'No query events observed; unavailable, not an inferred zero.'; unavailable.queryMs = unavailable.queryCount; }
  if (!sizes.length || sizes.some(size => size === null)) unavailable.rscBytes = 'No complete RSC response body observed inside window (router cache or unavailable body).';
  return { correlationId, route: route.path, mode, run, windowStart, windowEnd, clickToPendingMs: browser.pending, clickToShellMs: browser.shell, clickToDataMs: browser.data, authMs: auth.length ? auth.reduce((sum, event) => sum + event.durationMs, 0) : null, queryCount: queries.length || null, queryMs: queries.length ? queries.reduce((sum, event) => sum + event.durationMs, 0) : null, rscBytes: sizes.length && sizes.every(size => size !== null) ? sizes.reduce<number>((sum, size) => sum + size!, 0) : null, requestQueryCount: null, requestQueryMs: null, serverEvents, rscResponses: sizes.length, outcome, unavailable };
}

function summarize(samples: Sample[]) {
  return routes.map(route => ({ route: route.path, warm: Object.fromEntries(metricNames.map(name => {
    const values = samples.filter(sample => sample.route === route.path && sample.mode === 'warm').map(sample => sample[name]).filter((value): value is number => value !== null).sort((a, b) => a - b);
    const count = values.length;
    return [name, { availableSamples: count, median: count ? (values[Math.floor((count - 1) / 2)] + values[Math.ceil((count - 1) / 2)]) / 2 : null, p95: count ? values[Math.ceil(count * .95) - 1] : null }];
  })) }));
}

export async function runNavigationBenchmark(input: { baseUrl: string; warmRuns: 10; outputPath: string }): Promise<void> {
  if (!process.env.HARNESS_EVENTS || !process.env.HARNESS_ITEMS) throw Error('Benchmark requires the isolated production harness.');
  const browserChannel = process.env.HARNESS_BROWSER_CHANNEL ?? 'chromium';
  const browser = await chromium.launch({ channel: browserChannel });
  const samples: Sample[] = [];
  try {
    for (const route of routes) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      try {
        // tsx preserves nested function names with this helper when serializing evaluate callbacks.
        await context.addInitScript('globalThis.__name = fn => fn;');
        const page = await context.newPage();
        // Cold means fresh browser/router context. The server and DB may already be warm.
        await page.goto(`${input.baseUrl}${route.path === '/' ? '/members' : '/'}`);
        await page.waitForLoadState('networkidle');
        samples.push(await measure(page, route, 'cold-browser', 0));
      } finally { await context.close(); }
    }
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    try {
      await context.addInitScript('globalThis.__name = fn => fn;');
      const page = await context.newPage();
      await page.goto(input.baseUrl);
      await page.waitForLoadState('networkidle');
      for (let run = 1; run <= input.warmRuns; run++) for (const route of routes) {
        samples.push(await measure(page, route, 'warm', run));
        console.log(`Measured dataset ${process.env.HARNESS_ITEMS}: warm ${run}/10 ${route.path}`);
      }
    } finally { await context.close(); }
    const report = existsSync(input.outputPath) ? JSON.parse(readFileSync(input.outputPath, 'utf8')) : { protocolVersion: 2, timestamp: new Date().toISOString(), environment: { node: process.version, platform: process.platform, arch: process.arch, cpus: os.cpus().length, browser: browser.version(), browserChannel, viewport: { width: 1440, height: 1000 }, production: true }, scope: 'Serial navigation observation windows; auth and SQL events include prefetch/background work. Exact request-level query attribution is unavailable. Cold-browser samples use fresh browser contexts with a possibly warm server/database. RSC bytes are decoded response bodies, not compressed wire sizes.', datasets: [] };
    if (report.protocolVersion !== 2) throw Error('Viewport-deferred home uses benchmark protocol2; use a new outputPath to preserve earlier results.');
    if (report.environment.browser !== browser.version() || report.environment.browserChannel !== browserChannel || report.environment.node !== process.version) throw Error('Benchmark report environment changed; use a separate outputPath for non-comparable measurements.');
    report.metricDefinitions = { clickToPendingMs: 'Captured click to first observed pending marker.', clickToShellMs: 'Captured click to visible destination shell and active navigation tab.', clickToDataMs: 'Protocol2: captured click to the expected visible heading after the destination shell; home uses its static search heading. Viewport-deferred section data is verified separately by browser tests. This is not complete-page or all-data-settled time.', completePageDataMs: 'unavailable: no complete-page settled marker is instrumented', authMs: 'Sum of numeric auth operation durations emitted inside the serial observation window.', queryCount: 'Number of Prisma SQL duration events emitted inside the serial observation window; not exact request count.', queryMs: 'Sum of Prisma SQL duration events emitted inside the serial observation window.', rscBytes: 'Sum of complete decoded RSC bodies observed during the window, including prefetch.' };
    report.datasets = report.datasets.filter((dataset: { items: number }) => dataset.items !== Number(process.env.HARNESS_ITEMS));
    report.datasets.push({ timestamp: new Date().toISOString(), items: Number(process.env.HARNESS_ITEMS), members: 100, warmRuns: input.warmRuns, samples, summary: summarize(samples) });
    mkdirSync(path.dirname(input.outputPath), { recursive: true });
    writeFileSync(input.outputPath, `${JSON.stringify(report, null, 2)}\n`);
  } finally { await browser.close(); }
}
