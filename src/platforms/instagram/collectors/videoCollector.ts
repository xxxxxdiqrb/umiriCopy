import { buildFileName } from '../../../shared/utils';
import type { VideoDownloadResource } from '../../../shared/composables/useVideoDownload';
import { getMediaInfoByShortcode } from '../services/instagramApi';
import { getShortcode } from '../utils';

export async function collectInstagramVideos(
  article: HTMLElement,
): Promise<VideoDownloadResource[]> {
  const detail = await getMediaInfoByShortcode(getShortcode(article));
  if (!detail?.media.videoUrl) throw new Error('Instagram 帖子中未找到视频');
  return [
    {
      url: detail.media.videoUrl,
      fileName: buildFileName(
        detail.user.username,
        new Date(detail.createdAt * 1000),
        detail.code,
        'mp4',
      ),
    },
  ];
}
