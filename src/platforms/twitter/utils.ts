import { formatDateForFilename } from "../../shared/utils";

export function getTweetUserName(article: HTMLElement): string {
  const userNameDiv = article.querySelector('div[data-testid="User-Name"]') as HTMLElement | null;
  return userNameDiv?.innerText.split("\n")[1] || "unknown";
}

export function getTweetTime(article: HTMLElement): Date {
  const timeElement = article.querySelector("a > time");
  return timeElement ? new Date(timeElement.getAttribute("datetime")!) : new Date();
}

export function getTweetName(article: HTMLElement): string {
  const userName = getTweetUserName(article);
  const date = getTweetTime(article);
  const timeStr = formatDateForFilename(date);

  return `${userName}_${timeStr}`;
}
