import 'dotenv/config';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from 'playwright';

interface TwitterCase {
  url: string;
  articleData: Record<string, unknown>;
}

interface TwitterSnapshot {
  url: string;
  html: string;
}

const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fixtureDir = resolve(projectRoot, 'test/fixtures/twitter');
const casesPath = resolve(fixtureDir, 'cases.json');
const snapshotPath = resolve(fixtureDir, 'articles.snapshot.json');
const DEFAULT_DELAY_MS = 500;

function getDelayMs(): number {
  const rawValue = process.env.TWITTER_CAPTURE_DELAY_MS;
  if (!rawValue) return DEFAULT_DELAY_MS;
  const delayMs = Number(rawValue);
  if (!Number.isFinite(delayMs) || delayMs < 0) {
    throw new Error('TWITTER_CAPTURE_DELAY_MS must be a non-negative number');
  }
  return delayMs;
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, delayMs));
}

function getOption(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name} in the project root .env file`);
  return value;
}

function getTwitterProxy(): { server: string } | undefined {
  const server = process.env.TWITTER_PROXY_SERVER?.trim();
  return server ? { server } : undefined;
}

async function loadCases(): Promise<TwitterCase[]> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(casesPath, 'utf8'));
  } catch {
    throw new Error(`Missing ${casesPath}; create it with url and expected articleData entries`);
  }
  const cases = parsed as TwitterCase[];
  if (!Array.isArray(cases) || cases.some((item) => !item?.url || !item.articleData)) {
    throw new Error(`${casesPath} must contain [{ "url": string, "articleData": object }]`);
  }
  const requestedUrl = getOption('--url');
  const requestedIndex = getOption('--index');
  if (requestedUrl) return cases.filter((item) => item.url === requestedUrl);
  if (requestedIndex !== undefined) {
    const index = Number(requestedIndex);
    if (!Number.isInteger(index) || !cases[index])
      throw new Error(`Invalid --index: ${requestedIndex}`);
    return [cases[index]];
  }
  return cases;
}

async function captureArticle(page: Page, testCase: TwitterCase): Promise<TwitterSnapshot> {
  console.log(`Opening ${testCase.url}`);
  await page.goto(testCase.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  const article = page.locator('article').first();
  await article.waitFor({ state: 'visible', timeout: 30_000 });
  const html = await article.evaluate((element) => element.outerHTML);
  return { url: testCase.url, html };
}

async function main(): Promise<void> {
  const authToken = requireEnv('TWITTER_AUTH_TOKEN');
  const csrfToken = requireEnv('TWITTER_CT0');
  const delayMs = getDelayMs();
  const cases = await loadCases();
  if (cases.length === 0) throw new Error('No matching Twitter cases found');
  const browser = await chromium.launch({ headless: true, proxy: getTwitterProxy() });
  try {
    const context = await browser.newContext();
    await context.addCookies([
      {
        name: 'auth_token',
        value: authToken,
        domain: '.x.com',
        path: '/',
        httpOnly: true,
        secure: true,
      },
      { name: 'ct0', value: csrfToken, domain: '.x.com', path: '/', secure: true },
    ]);
    const page = await context.newPage();
    const snapshots: TwitterSnapshot[] = [];
    for (const testCase of cases) {
      snapshots.push(await captureArticle(page, testCase));
      console.log(`Waiting ${delayMs}ms before the next capture`);
      await wait(delayMs);
    }
    await mkdir(fixtureDir, { recursive: true });
    await writeFile(
      snapshotPath,
      `${JSON.stringify({ capturedAt: new Date().toISOString(), snapshots }, null, 2)}\n`,
      'utf8',
    );
    console.log(`Saved test/fixtures/twitter/${basename(snapshotPath)}`);
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
