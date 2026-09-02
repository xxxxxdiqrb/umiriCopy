import { getTweetDetail, type TweetMedia } from './tweetService';
import { observer, platformState } from '../platform';
import {
  executeVideoDownload,
  exitCopyState,
  type VideoDownloadResource,
} from '../../../shared/composables/useVideoDownload';
import { formatDateForFilename } from '../../../shared/utils';

const filenameFromUrl = (url: string) => url.split('?')[0].split('/').pop() || 'video.mp4';

export async function collectTwitterVideos(article: HTMLElement): Promise<VideoDownloadResource[]> {
  const link = article.querySelector<HTMLAnchorElement>('a[href*="/status/"]');
  const match = link?.href.match(/\/status\/(\d+)/);
  if (!match) return [];
  const detail = await getTweetDetail(match[1]);
  if (!detail) throw new Error('获取推文信息失败');
  return detail.media
    .filter((m: TweetMedia) => m.type === 'video' && m.videoUrl)
    .flatMap((m) =>
      m.videoUrl
        ? [
            {
              url: m.videoUrl,
              fileName: `@${detail.user.screenName}_${formatDateForFilename(new Date(detail.createdAt))}_${filenameFromUrl(m.videoUrl)}`,
            },
          ]
        : [],
    );
}

export async function handleDownloadVideo(): Promise<void> {
  await executeVideoDownload({
    collectVideos: async () => {
      const selected = observer.getSelectedArticleElements();
      return selected.length === 1 ? collectTwitterVideos(selected[0]) : [];
    },
    collectingText: '正在获取推文信息...',
    emptyMessage: '该推文没有视频',
    onSuccess: () => exitCopyState(platformState, observer),
  });
}
