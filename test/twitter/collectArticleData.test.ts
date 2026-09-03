// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectArticleData } from '../../src/platforms/twitter/collectors/articleCollector';
import type { ArticleData } from '../../src/shared/copy/types';

interface TwitterCase {
  description?: string;
  url: string;
  articleData: ArticleData;
}
interface TwitterSnapshot {
  url: string;
  html: string;
}

const fixtureDirectory = resolve(process.cwd(), 'test/fixtures/twitter');
const casesPath = resolve(fixtureDirectory, 'cases.json');
const snapshotPath = resolve(fixtureDirectory, 'articles.snapshot.json');

const options = {
  copyImages: true,
  getAlt: true,
};

function readJson(path: string, description: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(
      `Unable to read ${description} at ${path}. Run \`npm run capture:twitter\` first if the snapshot is missing.`,
      { cause: error },
    );
  }
}

function loadFixtures(): { cases: TwitterCase[]; snapshots: TwitterSnapshot[] } {
  const cases = readJson(casesPath, 'Twitter cases') as TwitterCase[];
  const snapshots = (
    readJson(snapshotPath, 'Twitter article snapshot') as {
      snapshots?: TwitterSnapshot[];
    }
  ).snapshots;

  if (!Array.isArray(cases) || cases.some((item) => !item?.url || !item.articleData)) {
    throw new Error(`${casesPath} must contain an array of Twitter cases`);
  }
  if (!Array.isArray(snapshots)) {
    throw new Error(`${snapshotPath} must contain a snapshots array`);
  }

  return { cases, snapshots };
}

describe('collectArticleData with captured Twitter articles', () => {
  const fixtures = loadFixtures();

  for (const testCase of fixtures.cases) {
    it(`${testCase.description ?? testCase.url}: ${testCase.url}`, async () => {
      const snapshot = fixtures.snapshots.find((item) => item.url === testCase.url);
      expect(snapshot, `missing snapshot for ${testCase.url}`).toBeDefined();
      document.body.innerHTML = snapshot?.html ?? '';
      const article = document.querySelector<HTMLElement>('article');
      expect(article, 'snapshot must contain an article element').not.toBeNull();
      globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
        callback(performance.now());
        return 0;
      };
      await expect(collectArticleData(article!, options)).resolves.toEqual(testCase.articleData);
    });
  }
});
