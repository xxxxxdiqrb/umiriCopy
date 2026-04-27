export interface InstagramMediaInfo {
  id: string;
  code: string;
  mediaType: 1 | 2 | 8;
  createdAt: number;
  user: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string;
    isVerified: boolean;
  };
  caption: {
    text: string;
    translation?: string;
  };
  media: {
    width: number;
    height: number;
    imageUrl?: string;
    videoUrl?: string;
    videoDuration?: number;
  };
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
    caption: {
      text: string;
      text_translation?: string;
    } | null;
    image_versions2?: {
      candidates: Array<{
        url: string;
        width: number;
        height: number;
      }>;
    };
    video_versions?: Array<{
      url: string;
      width: number;
      height: number;
      type: number;
    }>;
    video_duration?: number;
    original_width: number;
    original_height: number;
    like_count: number;
    comment_count: number;
    play_count?: number;
    media_repost_count: number;
  }>;
}

const getCsrfToken = (): string | undefined => {
  return document.cookie.match(/csrftoken=([^;]+)/)?.[1];
};

const fetchMediaById = async (mediaId: string): Promise<ApiResponse> => {
  const res = await fetch(
    `https://www.instagram.com/api/v1/media/${mediaId}/info/`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "X-CSRFToken": getCsrfToken() || "",
        "X-IG-App-ID": "936619743392459",
      },
    }
  );
  return res.json();
};

const getMediaIdFromShortcode = async (shortcode: string): Promise<string> => {
  const url = `https://www.instagram.com/api/v1/oembed/?url=https://www.instagram.com/p/${shortcode}/`;
  const res = await fetch(url, {
    credentials: "include",
    headers: { "X-IG-App-ID": "936619743392459" },
  });
  const data = await res.json();
  return data.media_id;
};

const getShortcodeFromArticle = (article: HTMLElement): string | null => {
  const links = article.querySelectorAll("a");
  for (const link of links) {
    if (link.href.includes("/p/") || link.href.includes("/reel/")) {
      const match = link.href.match(/\/(p|reel)\/([^/?]+)/);
      if (match) return match[2];
    }
  }
  return null;
};

const parseMediaInfo = (data: ApiResponse): InstagramMediaInfo | null => {
  const item = data.items?.[0];
  if (!item) return null;

  const media: InstagramMediaInfo["media"] = {
    width: item.original_width,
    height: item.original_height,
  };

  if (item.image_versions2?.candidates?.length) {
    const best = item.image_versions2.candidates.reduce((a, b) =>
      a.width * a.height > b.width * b.height ? a : b
    );
    media.imageUrl = best.url;
  }

  if (item.video_versions?.length) {
    const best = item.video_versions.reduce((a, b) =>
      a.width * a.height > b.width * b.height ? a : b
    );
    media.videoUrl = best.url;
    media.videoDuration = item.video_duration;
  }

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
    caption: {
      text: item.caption?.text || "",
      translation: item.caption?.text_translation,
    },
    media,
    likeCount: item.like_count,
    commentCount: item.comment_count,
    playCount: item.play_count,
    repostCount: item.media_repost_count,
  };
};

export const getMediaInfo = async (
  article: HTMLElement
): Promise<InstagramMediaInfo | null> => {
  const shortcode = getShortcodeFromArticle(article);
  if (!shortcode) return null;

  const mediaId = await getMediaIdFromShortcode(shortcode);
  const rawData = await fetchMediaById(mediaId);

  return parseMediaInfo(rawData);
};
