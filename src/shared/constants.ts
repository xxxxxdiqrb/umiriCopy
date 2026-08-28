export const JSON_SYSTEM_MESSAGE =
  '你接收的是一个 JSON 字符串数组，你必须根据前面的要求将数组中的每条字符串逐条翻译，并且只返回一个有效的 JSON 字符串数组，元素数量和顺序必须与输入完全一致。严禁返回 Markdown 代码块（如 ```json ... ```）、解释、注释或任何额外文本。';

export const BATCH_TRANSLATION_SYSTEM_MESSAGE =
  '你接收的是一个 JSON 字符串数组。请逐条翻译数组中的每个字符串，保持元素数量和顺序与输入完全一致。';
