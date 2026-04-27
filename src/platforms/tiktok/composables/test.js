async function getTikTokVideoInfo(url) {
  const response = await fetch(url);
  const html = await response.text();

  const match = html.match(
    /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">(.+?)<\/script>/,
  );

  if (!match) {
    throw new Error("Video data not found");
  }

  const data = JSON.parse(match[1]);
  const itemInfo = data.__DEFAULT_SCOPE__?.["webapp.video-detail"]?.itemInfo;

  if (!itemInfo) {
    throw new Error("Item info not found");
  }

  return itemInfo.itemStruct;
}

async function getTikTokVideoBlob(url) {
  const response = await fetch(url);
  const html = await response.text();

  const match = html.match(
    /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">(.+?)<\/script>/,
  );
  if (!match) throw new Error("Video data not found");

  const data = JSON.parse(match[1]);
  const video =
    data.__DEFAULT_SCOPE__?.["webapp.video-detail"]?.itemInfo?.itemStruct
      ?.video;

  // 用credentials: 'include'才能访问
  const blob = await fetch(video.downloadAddr, {
    credentials: "include",
  }).then((r) => r.blob());

  return blob;
}

// 使用示例
getTikTokVideoBlob(
  "https://www.tiktok.com/@liyuu_official/video/7552529919520115976",
);
