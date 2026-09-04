export function getShortcode(article: HTMLElement): string {
  for (const link of Array.from(article.querySelectorAll<HTMLAnchorElement>('a'))) {
    const match = link.href.match(/\/(?:p|reel)\/([^/?]+)/);
    if (match) return match[1];
  }
  throw new Error('未找到 Instagram 帖子 shortcode');
}
