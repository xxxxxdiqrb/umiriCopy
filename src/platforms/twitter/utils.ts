import { formatDateForFilename } from "../../shared/utils";

export function extractTweetTextContent(tweetTextElement: HTMLElement): string {
  const childrenList = Array.from(tweetTextElement.children);
  let textContent = "";
  for (const children of childrenList) {
    if (children.nodeName === "IMG") {
      textContent += (children as HTMLImageElement).alt;
    } else {
      textContent += (children as HTMLElement).innerText;
    }
  }
  return textContent;
}

export function getTweetUserName(article: HTMLElement): string {
  const userInfoElement = article.querySelector('div[data-testid="User-Name"]') as HTMLElement | null;
  if (!userInfoElement) {
    return "unknown";
  }
  const userNameElement = document.evaluate(
    `//span[text()="${userInfoElement.children[0].textContent}"]`,
    userInfoElement,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  ).singleNodeValue as HTMLElement;
  if (!userNameElement) {
    return "unknown";
  }
  return extractTweetTextContent(userNameElement.parentElement as HTMLElement);
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
