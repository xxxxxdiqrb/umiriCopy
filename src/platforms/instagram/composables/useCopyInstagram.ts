import { appState } from "../../../shared/store";

export async function copyInstagram(articleList: HTMLElement[]): Promise<string> {
    appState.loading.text = "正在复制 Instagram 内容";
    
    // TODO: 实现 Instagram 复制逻辑
    const copyContentList: string[] = [];
    
    // 示例：提取文章内容
    for (const article of articleList) {
        const textElement = article.querySelector('h1, [data-testid="post-message"]');
        if (textElement) {
            copyContentList.push(textElement.textContent || "");
        }
    }
    
    return copyContentList.join("\n---------------\n");
}
