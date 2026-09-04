import { getTweetDetail, type TweetMedia } from '../services/twitterApi';
import { buildFileName } from '../../../shared/utils';
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
              fileName: (() => {
                const sourceName = filenameFromUrl(m.videoUrl);
                const extensionMatch = sourceName.match(/\.([^.]+)$/);
                const fileExtension = extensionMatch?.[1] || 'mp4';
                const fileName = extensionMatch
                  ? sourceName.slice(0, -extensionMatch[0].length)
                  : sourceName;
                return buildFileName(
                  detail.user.screenName,
                  new Date(detail.createdAt),
                  fileName,
                  fileExtension,
                );
              })(),
            },
          ]
        : [],
    );
}
