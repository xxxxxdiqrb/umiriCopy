import { getTweetDetail, type TweetMedia } from '../services/twitterApi';
import { formatDateForFilename } from '../../../shared/utils';
import type { VideoDownloadResource } from '../../../shared/composables/useVideoDownload';

const filenameFromUrl = (url: string) => url.split('?')[0].split('/').pop() || 'video.mp4';
export async function collectTwitterVideos(article: HTMLElement): Promise<VideoDownloadResource[]> {
  const match = article
    .querySelector<HTMLAnchorElement>('a[href*="/status/"]')
    ?.href.match(/\/status\/(\d+)/);
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
