<script setup lang="ts">
import { appState } from "../store";
import { unmountAllSelectors, getSelectedArticleElements } from "../composables/useTweetObserver";
import { copyTweet } from "../composables/useCopyTweet";

const handleCancel = () => {
    appState.configBar.visible = false;
    appState.selectMode.active = false;
    appState.selectedArticles.clear();
    unmountAllSelectors();
};

const handleSubmit = async () => {
    const articles = getSelectedArticleElements();
    if (articles.length === 0) {
        handleCancel();
        return;
    }

    appState.loading.visible = true;
    appState.loading.text = "正在复制";

    try {
        const copyString = await copyTweet(articles);
        appState.actionBar.message = "资源获取完成";
        appState.actionBar.buttonText = "复制内容";
        appState.actionBar.handler = async () => {
            const type = "text/html";
            const blob = new Blob([copyString], { type });
            const data = [new ClipboardItem({ [type]: blob })];
            await navigator.clipboard.write(data);
        };
        appState.actionBar.visible = true;
    } catch (e) {
        appState.actionBar.message = "资源获取失败：" + String(e);
        appState.actionBar.buttonText = "确定";
        appState.actionBar.handler = null;
        appState.actionBar.visible = true;
    } finally {
        appState.loading.visible = false;
        appState.configBar.visible = false;
        appState.selectMode.active = false;
        appState.selectedArticles.clear();
        unmountAllSelectors();
    }
};

const handleToggleTranslate = () => {
    appState.configBar.translate = !appState.configBar.translate;
};

const handleToggleCopyImages = () => {
    appState.configBar.copyImages = !appState.configBar.copyImages;
    if (!appState.configBar.copyImages) {
        appState.configBar.download = false;
    }
};

const handleToggleDownload = () => {
    appState.configBar.download = !appState.configBar.download;
};</script>

<template>
    <div v-if="appState.configBar.visible" class="config-bar-overlay" @click.self="handleCancel">
        <div class="config-bar">
            <div class="config-item">
                <span class="config-label">是否翻译</span>
                <button class="toggle-btn" :class="{ active: appState.configBar.translate }" @click="handleToggleTranslate">
                    <span class="toggle-indicator"></span>
                </button>
            </div>
            <div class="config-item">
                <span class="config-label">复制图片</span>
                <button class="toggle-btn" :class="{ active: appState.configBar.copyImages }" @click="handleToggleCopyImages">
                    <span class="toggle-indicator"></span>
                </button>
            </div>
            <div v-if="appState.configBar.copyImages" class="config-item">
                <span class="config-label">图片下载到本地</span>
                <button class="toggle-btn" :class="{ active: appState.configBar.download }" @click="handleToggleDownload">
                    <span class="toggle-indicator"></span>
                </button>
            </div>
            <div class="config-item">
                <span class="config-label">已选中推文</span>
                <span class="config-value">{{ appState.selectedArticles.size }}</span>
            </div>
            <button class="cancel-btn" @click="handleCancel">取消</button>
            <button class="submit-btn" @click="handleSubmit">复制</button>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.config-bar-overlay {
    position: fixed;
    top: 110px;
    right: 0;
    z-index: 19998;
    display: flex;
    justify-content: center;
    width: fit-content;
    height: fit-content;
}

.config-bar {
    background-color: rgb(21, 22, 23);
    border: 1px solid rgb(47, 51, 54);
    border-bottom: none;
    border-radius: 16px 0 0 16px;
    padding: 16px 20px;
    padding-bottom: 30px;
    min-width: 300px;
    box-sizing: border-box;
}

.config-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid rgb(47, 51, 54);

    &:last-of-type {
        border-bottom: none;
    }
}

.config-label {
    color: rgb(239, 243, 244);
    font-size: 15px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.config-value {
    color: rgb(113, 118, 123);
    font-size: 15px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.toggle-btn {
    width: 44px;
    height: 24px;
    border-radius: 12px;
    border: none;
    background-color: rgb(51, 54, 57);
    cursor: pointer;
    position: relative;
    transition: background-color 0.2s;

    &.active {
        background-color: rgb(29, 155, 240);
    }
}

.toggle-indicator {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: rgb(239, 243, 244);
    transition: transform 0.2s;

    .toggle-btn.active & {
        transform: translateX(20px);
    }
}

%base-btn {
    width: 100%;
    margin-top: 16px;
    padding: 12px;
    border-radius: 9999px;
    text-align: center;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.2s;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;

    &:active {
        opacity: 0.7;
    }

    &:hover {
        opacity: 0.7;
    }
}

.cancel-btn {
    @extend %base-btn;
    color: rgb(15, 20, 25);
    border: 1px solid white;
    background-color: white;
}

.submit-btn {
    @extend %base-btn;
    color: white;
    border: 1px solid white;
    background-color: rgb(15, 20, 25);
}
</style>
