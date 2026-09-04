import { buildFileName } from '../../../shared/utils';
import type { ArticleImageData } from '../../../shared/copy/types';
import type { InstagramMediaInfo } from '../services/instagramApi';

export function collectArticleImageData(detail: InstagramMediaInfo): ArticleImageData[] {
  return detail.mediaList
    .filter(({ imageUrl }) => imageUrl)
    .map(({ imageUrl }, index) => ({
      url: imageUrl!,
      alt: '',
      imageName: buildFileName(
        detail.user.username,
        new Date(detail.createdAt * 1000),
        String(index + 1),
        'jpg',
      ),
    }));
}
