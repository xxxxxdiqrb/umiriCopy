# umiriCopy

<p align="center">
  <img src="public/icons/icon64.png" alt="umiriCopy Logo" width="64" height="64">
</p>

一个 Edge 浏览器扩展，用于将 X (Twitter) 推文和 Instagram 帖子一键复制到剪贴板，支持翻译和图片复制，适用于 QQ 群进行 DD。

## 功能特性

- **多平台支持** - 支持 X (Twitter) 和 Instagram 两个平台
- **一键复制** - 快速将推文/帖子内容复制到剪贴板
- **AI 翻译** - 支持 DeepSeek、OpenAI 等 API 格式的翻译服务，将外文内容翻译为中文
- **批量选择** - 支持选择多条推文批量复制（Twitter）
- **图片复制** - 支持复制推文/帖子中的图片到剪贴板
- **图片下载** - 可选择将图片下载到本地
- **多配置管理** - 支持添加多个 AI 服务提供商配置，灵活切换

## ⚠️ 注意

本项目由 AI 辅助编写，有可能会有未检查出来的💩！

## 图标来源

图标来源: [https://x.com/ShaoRouHong](https://x.com/ShaoRouHong)

Shao老师的画太可爱了你知道吗

## TODO List

- [x] 支持 Instagram 帖子复制
- [ ] 支持视频下载
- [ ] 支持 bilibili 动态复制
- [ ] 支持 新浪微博 动态复制

## 安装

### 从 crx 安装

在 Release 中下载最新版本的 crx 文件，加载到 Edge 浏览器：

1. 打开 Edge 浏览器，访问 `edge://extensions/`
2. 开启「开发人员模式」
3. 将 crx 文件拖到浏览器中安装

### 从源码构建

```bash
# 安装依赖
npm install

# 构建
npm run build
```

构建完成后，将 `dist` 目录加载到 Edge 浏览器：

1. 打开 Edge 浏览器，访问 `edge://extensions/`
2. 开启「开发人员模式」
3. 点击「加载解压缩的扩展」
4. 选择 `dist` 目录

## 使用说明

### 基本使用

#### X (Twitter)

1. 访问 [X (Twitter)](https://x.com)
2. 页面右侧会出现一个「复制」悬浮按钮
3. 点击按钮进入选择模式，点击推文选中（可多选）
4. 在配置栏中选择是否翻译、是否复制图片等选项
5. 点击「复制」按钮完成复制

#### Instagram

1. 访问 [Instagram](https://www.instagram.com)
2. 页面会出现一个「复制」悬浮按钮
3. 点击按钮进入选择模式，点击帖子选中
4. 在配置栏中选择是否翻译、是否复制图片等选项
5. 点击「复制」按钮完成复制

### 配置 AI 翻译服务

1. 点击浏览器工具栏中的扩展图标
2. 点击「翻译配置」进入配置页面
3. 添加 AI 服务提供商配置：
   - **名称**: 自定义配置名称
   - **Base URL**: API 地址（如 `https://api.deepseek.com/v1`）
   - **API Key**: 你的 API 密钥
   - **模型**: 使用的模型名称（如 `deepseek-chat`）
   - **系统消息**: 翻译提示词
   - **自定义变量**: 其他 API 参数

4. 设置默认配置后即可在复制时使用翻译功能

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
│   │   └── instagram/      # Instagram 平台
│   │       ├── App.vue
│   │       ├── main.ts
│   │       ├── platform.ts
│   │       └── composables/
│   ├── shared/             # 共享模块
│   │   ├── components/     # 共享 Vue 组件
│   │   ├── composables/    # 共享组合式函数
│   │   ├── store.ts        # 状态管理
│   │   ├── types.ts        # 共享类型定义
│   │   └── utils/          # 工具函数
│   ├── background/         # Service Worker 后台脚本
│   ├── options/            # 扩展选项页面
│   └── popup/              # 扩展弹窗页面
├── public/
│   └── icons/              # 扩展图标
├── scripts/                # 构建脚本
└── dist/                   # 构建输出目录
```

## 技术栈

- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **样式**: SCSS
- **图片处理**: html-to-image

## 许可证

[MIT License](LICENSE)
