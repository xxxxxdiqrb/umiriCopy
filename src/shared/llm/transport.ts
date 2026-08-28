export function sendLLMRequest<T = unknown>(url: string, option: RequestInit): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'GMFetch', url, option, formatType: 'json' }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (response?.isSuccess) {
        resolve(response.data as T);
      } else {
        reject(new Error(response?.reason || 'LLM 请求失败'));
      }
    });
  });
}
