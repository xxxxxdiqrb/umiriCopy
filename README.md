# umiriCopy

<p align="center">
  <img src="public/icons/icon.jpg" alt="umiriCopy Logo" height="120">
</p>

一个 Edge/Chrome 浏览器扩展，用于将 X (Twitter) 推文和 Instagram 帖子一键复制到剪贴板，支持翻译、图片复制和视频下载，适用于 QQ 群进行 DD。

## 功能特性

- **多平台支持** - 支持 X (Twitter)、Instagram 和 TikTok（仅视频下载）
- **一键复制** - 快速将推文/帖子内容复制到剪贴板
- **AI 翻译** - 支持 DeepSeek、OpenAI 等 API 格式的翻译服务，将外文内容翻译为中文
- **附带翻译后缀** - 支持在每个 AI 翻译配置中自定义尾部署名或提示说明（如 `[由 AI 自动翻译]`），翻译完成后自动追加在译文最后一行
- **导入/导出配置** - 支持一键将配置导出为 JSON 文件备份，或在新设备/插件更新后一键导入还原配置
- **平台默认配置** - 支持在配置页分别为 X (Twitter) 和 Instagram 独立设置默认是否翻译、默认翻译服务、默认是否截图、默认是否复制/下载图片
- **批量选择** - 支持选择多条推文批量复制（Twitter）
- **图片复制** - 支持复制推文/帖子中的图片到剪贴板
- **图片下载** - 可选择将图片下载到本地
- **视频下载** - 支持 X (Twitter)、Instagram 和 TikTok 的视频下载
- **多配置管理** - 支持添加多个 AI 服务提供商配置，灵活切换

## ⚠️ 注意

本项目由 AI 辅助编写，有可能会有未检查出来的💩！

## 图标来源

图标来源: [https://x.com/ShaoRouHong](https://x.com/ShaoRouHong)

Shao老师的画太可爱了你知道吗

## TODO List

- [x] 支持 Instagram 帖子复制
- [x] 支持视频下载
- [x] 支持多平台默认选项配置
- [x] 支持翻译配置附带后缀
- [x] 支持配置导入与导出
- [ ] 支持 bilibili 动态复制
- [ ] 支持 新浪微博 动态复制

## 安装

### 直接安装

在 Release 中下载最新版本的 crx 或 zip 文件，加载到 Edge/Chrome 浏览器：

1. 打开浏览器，访问扩展管理页面（如 `edge://extensions/` 或 `chrome://extensions/`）
2. 开启「开发人员模式」
3. 将文件拖到浏览器中安装

> ⚠️ **注意**: 使用 crx 文件时插件可能不可用并提示
> "此扩展不是来自任何已知来源，可能是在你不知情的情况下添加的"
> 这时请改为下载 zip 版本，或将 crx 后缀改为 zip 后再拖入安装

### 从源码构建

```bash
# 安装依赖
npm install

# 构建
npm run build
```

构建完成后，将 `dist` 目录加载到浏览器：

1. 打开浏览器，访问扩展管理页面
2. 开启「开发人员模式」
3. 点击「加载解压缩的扩展」
4. 选择 `dist` 目录

## 使用说明

### 基本使用

#### 复制推文/帖子 (X / Instagram)

1. 访问 [X (Twitter)](https://x.com) 或 [Instagram](https://www.instagram.com)
2. 页面会出现一个「复制」悬浮按钮
3. 点击按钮进入选择模式，点击推文/帖子选中（X 支持多选）
4. 在配置栏中选择是否翻译、是否复制图片等选项（可自动加载 Options 里的平台默认设置）
5. 点击「复制」按钮完成复制

#### 下载视频

1. 访问 [TikTok](https://www.tiktok.com) 的视频详情页，比如 `https://www.tiktok.com/@liyuu_official/video/7623714955866492180`
2. 页面会出现一个「下载」悬浮按钮
3. 点击按钮，弹出确认栏后点击「下载」即可

### 配置管理

1. 点击浏览器工具栏中的扩展图标
2. 点击「翻译配置」进入配置页面
3. **AI 翻译服务**：添加与管理 AI 服务提供商配置（Base URL、API Key、模型、自定义参数、**附带后缀**等）并设置全局默认服务
4. **导入 / 导出配置**：在页面右上角点击「导出配置」备份当前全部设置，或点击「导入配置」快速导入已有 JSON 配置文件
5. **平台默认配置**：独立设置 X (Twitter) 与 Instagram 的默认行为（默认是否翻译、指定平台专属翻译服务、默认是否截取推文卡片、默认是否复制图片、默认是否下载图片等）

## 项目结构

```
umiriCopy/
├── src/
│   ├── platforms/          # 多平台入口
│   │   ├── twitter/        # Twitter 平台
│   │   │   ├── App.vue
│   │   │   ├── main.ts
│   │   │   ├── platform.ts
│   │   │   └── composables/
│   │   ├── instagram/      # Instagram 平台
│   │   │   ├── App.vue
│   │   │   ├── main.ts
│   │   │   ├── platform.ts
│   │   │   └── composables/
│   │   └── tiktok/         # TikTok 平台
│   │       ├── App.vue
│   │       ├── main.ts
│   │       ├── platform.ts
│   │       └── composables/
│   ├── shared/             # 共享模块
│   │   ├── components/     # 共享 Vue 组件
│   │   ├── composables/   # 共享组合式函数
│   │   ├── store.ts       # 状态管理
│   │   ├── types.ts       # 共享类型定义
│   │   └── utils/         # 工具函数
│   ├── background/        # Service Worker 后台脚本
│   ├── options/           # 扩展选项页面
│   │   ├── components/    # 选项页组件 (ProviderCard, PlatformSettingsCard 等)
│   │   └── App.vue
│   └── popup/             # 扩展弹窗页面
├── public/
│   └── icons/             # 扩展图标
├── scripts/               # 构建脚本
└── dist/                  # 构建输出目录
```

## 技术栈

- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **样式**: SCSS
- **图片处理**: html-to-image

## 许可证

[MIT License](LICENSE)