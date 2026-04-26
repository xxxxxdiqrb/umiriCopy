const FEATURES = {};

const FIELD_TOGGLES = {};

export interface TweetDetailVariables {
  focalTweetId: string;
  referrer: string;
  with_rux_injections: boolean;
  rankingMode: string;
  includePromotedContent: boolean;
  withCommunity: boolean;
  withQuickPromoteEligibilityTweetFields: boolean;
  withBirdwatchNotes: boolean;
  withVoice: boolean;
}

export interface TweetUser {
  id: string;
  name: string;
  screenName: string;
  avatarUrl: string;
  isVerified: boolean;
}

export interface TweetMedia {
  type: 'photo' | 'video' | 'animated_gif';
  url: string;
  width: number;
  height: number;
  videoUrl?: string;
  videoDuration?: number;
}

export interface TweetDetail {
  id: string;
  text: string;
  createdAt: string;
  user: TweetUser;
  media: TweetMedia[];
  favoriteCount: number;
  retweetCount: number;
  replyCount: number;
  quoteCount: number;
}

export async function fetchTweetDetail(tweetId: string): Promise<unknown> {
  const ct0 = document.cookie.match(/ct0=([^;]+)/)?.[1] || '';

  const variables: TweetDetailVariables = {
    focalTweetId: tweetId,
    referrer: 'home',
    with_rux_injections: false,
    rankingMode: 'Relevance',
    includePromotedContent: true,
    withCommunity: true,
    withQuickPromoteEligibilityTweetFields: true,
    withBirdwatchNotes: true,
    withVoice: true,
  };

  const url =
    'https://x.com/i/api/graphql/QrLp7AR-eMyamw8D1N9l6A/TweetDetail?' +
    'variables=' +
    encodeURIComponent(JSON.stringify(variables)) +
    '&features=' +
    encodeURIComponent(JSON.stringify(FEATURES)) +
    '&fieldToggles=' +
    encodeURIComponent(JSON.stringify(FIELD_TOGGLES));

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader(
      'authorization',
      'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'
    );
    xhr.setRequestHeader('x-csrf-token', ct0);
    xhr.setRequestHeader('x-twitter-active-user', 'yes');
    xhr.setRequestHeader('x-twitter-auth-type', 'OAuth2Client');
    xhr.withCredentials = true;
    xhr.onload = () => {
      try {
        resolve(JSON.parse(xhr.responseText));
      } catch (e) {
        reject(e);
      }
    };
    xhr.onerror = reject;
    xhr.send();
  });
}

interface RawTweetResult {
  rest_id: string;
  legacy: {
    full_text: string;
    created_at: string;
    favorite_count: number;
    retweet_count: number;
    reply_count: number;
    quote_count: number;
    extended_entities?: {
      media: Array<{
        type: 'photo' | 'video' | 'animated_gif';
        media_url_https: string;
        original_info: { width: number; height: number };
        video_info?: {
          duration_millis: number;
          variants: Array<{
            bitrate?: number;
            content_type: string;
            url: string;
          }>;
        };
      }>;
    };
  };
  core: {
    user_results: {
      result: {
        rest_id: string;
        core: { name: string; screen_name: string };
        avatar: { image_url: string };
        is_blue_verified: boolean;
      };
    };
  };
}

interface RawTweetDetailResponse {
  data: {
    threaded_conversation_with_injections_v2: {
      instructions: Array<{
        type?: string;
        entries?: Array<{
          content: {
            __typename: string;
            itemContent?: {
              tweet_results: { result: RawTweetResult };
            };
          };
        }>;
      }>;
    };
  };
}

function parseTweetResult(result: RawTweetResult): TweetDetail {
  const user = result.core.user_results.result;
  const media: TweetMedia[] = [];

  if (result.legacy.extended_entities?.media) {
    for (const m of result.legacy.extended_entities.media) {
      const item: TweetMedia = {
        type: m.type,
        url: m.media_url_https,
        width: m.original_info.width,
        height: m.original_info.height,
      };
      if (m.video_info && m.type === 'video') {
        const mp4Variants = m.video_info.variants.filter(
          (v) => v.content_type === 'video/mp4' && v.bitrate
        );
        if (mp4Variants.length > 0) {
          const best = mp4Variants.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
          item.videoUrl = best.url;
          item.videoDuration = m.video_info.duration_millis;
        }
      }
      media.push(item);
    }
  }

  return {
    id: result.rest_id,
    text: result.legacy.full_text,
    createdAt: result.legacy.created_at,
    user: {
      id: user.rest_id,
      name: user.core.name,
      screenName: user.core.screen_name,
      avatarUrl: user.avatar.image_url,
      isVerified: user.is_blue_verified,
    },
    media,
    favoriteCount: result.legacy.favorite_count,
    retweetCount: result.legacy.retweet_count,
    replyCount: result.legacy.reply_count,
    quoteCount: result.legacy.quote_count,
  };
}

export async function getTweetDetail(tweetId: string): Promise<TweetDetail | null> {
  const response = (await fetchTweetDetail(tweetId)) as RawTweetDetailResponse;

  const instructions = response.data?.threaded_conversation_with_injections_v2?.instructions;
  if (!instructions) return null;

  for (const instruction of instructions) {
    if (!instruction.entries) continue;
    for (const entry of instruction.entries) {
      if (entry.content.__typename === 'TimelineTimelineItem') {
        const tweetResult = entry.content.itemContent?.tweet_results?.result;
        if (tweetResult && tweetResult.rest_id === tweetId) {
          return parseTweetResult(tweetResult);
        }
      }
    }
  }

  return null;
}