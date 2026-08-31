// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectArticleData } from '../../src/platforms/twitter/composables/useCopyTweet';
import type {
  ArticleData,
  TweetCopyOptions,
} from '../../src/platforms/twitter/composables/tweetMedia';

interface TwitterCase {
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

const options: TweetCopyOptions = {
  translate: false,
  captureScreenshot: false,
  copyImages: false,
  getAlt: false,
  download: false,
  suffix: '',
};

function loadFixtures(): { cases: TwitterCase[]; snapshots: TwitterSnapshot[] } | null {
  try {
    const cases = JSON.parse(readFileSync(casesPath, 'utf8')).cases as TwitterCase[];
    const snapshots = JSON.parse(readFileSync(snapshotPath, 'utf8')).snapshots as TwitterSnapshot[];
    return { cases, snapshots };
  } catch {
    return null;
  }
}

describe('collectArticleData with captured Twitter articles', () => {
  const fixtures = loadFixtures();
  it.skipIf(!fixtures)('requires local cases.json and articles.snapshot.json', () => {});

  for (const testCase of fixtures?.cases ?? []) {
    it(`collects ${testCase.url}`, async () => {
      const snapshot = fixtures!.snapshots.find((item) => item.url === testCase.url);
      expect(snapshot, `missing snapshot for ${testCase.url}`).toBeDefined();
      document.body.innerHTML = snapshot!.html;
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
