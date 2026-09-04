export interface InstagramMediaInfo {
  id: string;
  code: string;
  mediaType: 1 | 2 | 8;
  createdAt: number;
  user: { id: string; username: string; fullName: string; avatarUrl: string; isVerified: boolean };
  caption: { text: string; translation?: string };
  media: {
    width: number;
    height: number;
    imageUrl?: string;
    videoUrl?: string;
    videoDuration?: number;
  };
  mediaList: Array<{
    mediaType: 1 | 2;
    imageUrl?: string;
    videoUrl?: string;
    width: number;
    height: number;
  }>;
  likeCount: number;
  commentCount: number;
  playCount?: number;
  repostCount: number;
}

interface ApiResponse {
  items: Array<{
    id: string;
    pk: string;
    code: string;
    media_type: number;
    taken_at: number;
    user: {
      pk: string;
      username: string;
      full_name: string;
      profile_pic_url: string;
      is_verified: boolean;
    };
    caption: { text: string; text_translation?: string } | null;
    image_versions2?: { candidates: Array<{ url: string; width: number; height: number }> };
    video_versions?: Array<{ url: string; width: number; height: number; type: number }>;
    video_duration?: number;
    original_width: number;
    original_height: number;
    like_count: number;
    comment_count: number;
    play_count?: number;
    media_repost_count: number;
    carousel_media?: Array<{
      media_type: number;
      image_versions2?: { candidates: Array<{ url: string; width: number; height: number }> };
      video_versions?: Array<{ url: string; width: number; height: number; type: number }>;
      original_width?: number;
      original_height?: number;
    }>;
  }>;
}

const getCsrfToken = () => document.cookie.match(/csrftoken=([^;]+)/)?.[1];

async function fetchMediaById(mediaId: string): Promise<ApiResponse> {
  const response = await fetch(`https://www.instagram.com/api/v1/media/${mediaId}/info/`, {
    credentials: 'include',
    headers: { 'X-CSRFToken': getCsrfToken() || '', 'X-IG-App-ID': '936619743392459' },
  });
  return response.json();
}

async function getMediaIdFromShortcode(shortcode: string): Promise<string> {
  const response = await fetch(
    `https://www.instagram.com/api/v1/oembed/?url=https://www.instagram.com/p/${shortcode}/`,
    { credentials: 'include', headers: { 'X-IG-App-ID': '936619743392459' } },
  );
  return ((await response.json()) as { media_id: string }).media_id;
}

function parseMediaInfo(data: ApiResponse): InstagramMediaInfo | null {
  const item = data.items?.[0];
  if (!item) return null;
  const image = item.image_versions2?.candidates?.reduce((a, b) =>
    a.width * a.height > b.width * b.height ? a : b,
  );
  const video = item.video_versions?.reduce((a, b) =>
    a.width * a.height > b.width * b.height ? a : b,
  );
  const mediaList = (item.carousel_media?.length ? item.carousel_media : [item]).map((media) => {
    const image = media.image_versions2?.candidates?.reduce((a, b) =>
      a.width * a.height > b.width * b.height ? a : b,
    );
    const video = media.video_versions?.reduce((a, b) =>
      a.width * a.height > b.width * b.height ? a : b,
    );
    return {
      mediaType: media.media_type as 1 | 2,
      imageUrl: image?.url,
      videoUrl: video?.url,
      width: media.original_width ?? image?.width ?? video?.width ?? 0,
      height: media.original_height ?? image?.height ?? video?.height ?? 0,
    };
  });
  return {
    id: item.id || item.pk,
    code: item.code,
    mediaType: item.media_type as 1 | 2 | 8,
    createdAt: item.taken_at,
    user: {
      id: item.user.pk,
      username: item.user.username,
      fullName: item.user.full_name,
      avatarUrl: item.user.profile_pic_url,
      isVerified: item.user.is_verified,
    },
    caption: { text: item.caption?.text || '', translation: item.caption?.text_translation },
    media: {
      width: item.original_width,
      height: item.original_height,
      imageUrl: image?.url,
      videoUrl: video?.url,
      videoDuration: item.video_duration,
    },
    mediaList,
    likeCount: item.like_count,
    commentCount: item.comment_count,
    playCount: item.play_count,
    repostCount: item.media_repost_count,
  };
}

export async function getMediaInfoByShortcode(
  shortcode: string,
): Promise<InstagramMediaInfo | null> {
  return parseMediaInfo(await fetchMediaById(await getMediaIdFromShortcode(shortcode)));
}
