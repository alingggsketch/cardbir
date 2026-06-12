# 拾光祝语 — 项目完整技术文档

> 本文档详细记录了"拾光祝语"生日贺卡生成器的完整技术架构、每个模块的实现原理、关键代码解析，以及开发过程中遇到的所有问题和解决方案。适合从头学习整个项目的构建思路。

---

## 目录

1. [项目概览](#1-项目概览)
2. [技术栈与依赖](#2-技术栈与依赖)
3. [项目结构](#3-项目结构)
4. [入口文件与路由](#4-入口文件与路由)
5. [数据存储方案](#5-数据存储方案)
6. [媒体文件上传方案](#6-媒体文件上传方案)
7. [组件详解](#7-组件详解)
8. [页面详解](#8-页面详解)
9. [自定义 Hooks](#9-自定义-hooks)
10. [CSS 架构与动画](#10-css-架构与动画)
11. [构建与部署](#11-构建与部署)
12. [开发过程中遇到的问题与解决方案](#12-开发过程中遇到的问题与解决方案)
13. [最终架构总结](#13-最终架构总结)

---

## 1. 项目概览

### 1.1 产品定位

"拾光祝语"是一个面向小红书用户的生日贺卡在线生成器。用户填写祝福信息后，系统生成一个可分享的链接和二维码，接收者打开链接即可查看带有动画效果的电子贺卡。

### 1.2 核心功能

- 填写寿星昵称、祝福人昵称、生日日期、祝福语
- 选择 6 种主题风格（带图片预览）
- 上传照片墙（最多 6 张，自动压缩）
- 录制或上传语音祝福
- 选择内置背景音乐或上传自定义音乐
- 生成可分享链接 + 二维码
- 可下载的贺卡图片（html2canvas 截图）
- 接收者需输入生日月日验证才能查看
- 3-2-1 倒计时 + 蛋糕吹蜡烛动画
- 照片轮播、语音播放、背景音乐自动播放

### 1.3 核心设计原则

**纯前端架构，无后端数据库。** 所有贺卡数据通过 lz-string 压缩后编码到 URL 的 hash 部分。媒体文件（图片、音频）上传到 GitHub 仓库，通过 jsDelivr CDN 分发。这意味着：

- 不需要服务器、不需要数据库
- 链接永久有效（只要 GitHub 仓库和 CDN 存在）
- 部署成本为零（GitHub Pages 免费）

---

## 2. 技术栈与依赖

### 2.1 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.2.6 | UI 框架 |
| React DOM | 19.2.6 | DOM 渲染 |
| React Router DOM | 7.17.0 | 客户端路由 |
| Vite | 8.0.12 | 构建工具 |

### 2.2 功能依赖

| 库名 | 用途 | 学习要点 |
|------|------|----------|
| `lz-string` | 将 JSON 压缩为 URL 安全字符串 | 学习数据压缩与 URL 编码 |
| `qrcode.react` | 生成二维码 SVG | 学习 React 组件库的使用 |
| `html2canvas` | 将 DOM 节点截图转为 Canvas | 学习 DOM 到图片的转换 |
| `lucide-react` | 图标库 | 学习 SVG 图标的 React 集成 |
| `date-fns` | 日期处理工具库 | 轻量级 moment.js 替代品 |

### 2.3 开发依赖

| 库名 | 用途 |
|------|------|
| `@vitejs/plugin-react` | Vite 的 React 插件（支持 JSX、Fast Refresh） |
| `eslint` | 代码质量检查 |
| `eslint-plugin-react-hooks` | React Hooks 规则检查 |
| `eslint-plugin-react-refresh` | 热更新组件规则检查 |

### 2.4 安装与运行

```bash
# 安装依赖
pnpm install

# 本地开发
pnpm dev

# 生产构建（默认 base）
pnpm build

# 生产构建（GitHub Pages 专用，带 base 路径）
pnpm build:gh

# 预览构建结果
pnpm preview
```

---

## 3. 项目结构

```
cardbir/
├── index.html                  # HTML 入口（Vite 要求在根目录）
├── vite.config.js              # Vite 构建配置
├── package.json                # 项目配置与依赖
├── pnpm-lock.yaml              # 依赖锁定文件
├── eslint.config.js            # ESLint 配置
├── .env                        # 环境变量（不提交到 Git）
├── .env.example                # 环境变量示例
├── .gitignore                  # Git 忽略规则
│
├── public/                     # 静态资源（原样复制到 dist）
│   ├── shengri.mp3             # 内置生日歌音频
│   ├── favicon.svg             # 网站图标
│   └── icons.svg               # 图标合集
│
├── src/                        # 源代码目录
│   ├── main.jsx                # React 应用入口
│   ├── App.jsx                 # 根组件（路由配置）
│   ├── index.css               # 全局样式（~2100 行）
│   │
│   ├── assets/                 # 静态资源（会被 Vite 处理）
│   │   ├── one.jpg ~ six.jpg   # 6 个主题背景图
│   │   └── card.jpg            # 可下载贺卡的背景图
│   │
│   ├── components/             # 可复用组件
│   │   ├── ThemePicker.jsx     # 主题选择器（圆形图片单选）
│   │   ├── DatePicker.jsx      # 日期选择器（滚轮式）
│   │   ├── ImageUploader.jsx   # 图片上传器（压缩+上传）
│   │   ├── AudioRecorder.jsx   # 语音录制器（录音+上传）
│   │   ├── MusicSelector.jsx   # 音乐选择器（内置+自定义）
│   │   └── QRCodeModal.jsx     # 二维码弹窗（生成+下载）
│   │
│   ├── pages/                  # 页面组件
│   │   ├── CreateCard.jsx      # 创建贺卡页（表单）
│   │   └── ViewCard.jsx        # 查看贺卡页（展示）
│   │
│   ├── hooks/                  # 自定义 Hooks
│   │   └── useAudioRecorder.js # 录音逻辑封装
│   │
│   └── utils/                  # 工具函数
│       ├── storage.js          # 数据编码/解码（lz-string）
│       ├── upload.js           # 文件上传（GitHub API）
│       ├── compress.js         # 图片压缩
│       └── id.js               # 随机 ID 生成
│
└── dist/                       # 构建输出（独立 Git 仓库，推送到 gh-pages）
```

### 3.1 `public/` vs `src/assets/` 的区别

这是一个 Vite 中非常重要的概念：

| 目录 | 处理方式 | 使用场景 |
|------|----------|----------|
| `public/` | 原样复制到 `dist/`，不经过 Vite 处理 | 不需要被 Vite 处理的文件（如 mp3、favicon） |
| `src/assets/` | 经过 Vite 处理（压缩、重命名、hash） | 需要被 import 的图片、字体等 |

**访问方式的区别：**
- `public/shengri.mp3` → 通过 `/shengri.mp3` 访问（需要手动加 base 路径）
- `src/assets/one.jpg` → 通过 `import oneImg from './assets/one.jpg?url'` 访问（Vite 自动处理路径）

---

## 4. 入口文件与路由

### 4.1 `index.html` — HTML 入口

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>生日快乐@拾光祝语（小红书）</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**学习要点：**
- Vite 要求 `index.html` 在项目根目录（不是 `public/`）
- `user-scalable=no` 禁止用户缩放（移动端体验优化）
- `<div id="root">` 是 React 的挂载点

### 4.2 `src/main.jsx` — React 入口

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

**学习要点：**
- `createRoot` 是 React 18+ 的新 API（替代 `ReactDOM.render`）
- `StrictMode` 在开发模式下会额外检查潜在问题（如副作用调用两次）
- CSS 文件直接 import 即可生效（Vite 会自动注入 `<style>` 标签）

### 4.3 `src/App.jsx` — 路由配置

```jsx
import { HashRouter, Routes, Route } from 'react-router-dom';
import CreateCard from './pages/CreateCard';
import ViewCard from './pages/ViewCard';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<CreateCard />} />
        <Route path="/card/:data" element={<ViewCard />} />
      </Routes>
    </HashRouter>
  );
}
```

**学习要点：**

**为什么用 `HashRouter` 而不是 `BrowserRouter`？**

| 路由类型 | URL 格式 | 服务端要求 | 适用场景 |
|----------|----------|------------|----------|
| `BrowserRouter` | `/card/abc123` | 需要配置 fallback（所有路径返回 index.html） | 有后端的项目 |
| `HashRouter` | `/#/card/abc123` | 不需要任何配置 | 纯静态托管（GitHub Pages） |

GitHub Pages 是纯静态托管，不支持服务端路由 fallback。如果用 `BrowserRouter`，用户直接访问 `https://xxx.github.io/cardbir/card/abc123` 会返回 404。而 `HashRouter` 的 `#` 后面的内容不会发送到服务器，所以始终能正确加载。

---

## 5. 数据存储方案

### 5.1 核心思路：URL 就是数据库

传统应用的数据流：
```
用户输入 → 保存到数据库 → 生成 ID → 通过 ID 查询数据
```

本项目的数据流：
```
用户输入 → JSON 序列化 → lz-string 压缩 → 编码到 URL hash → 分享链接
接收者打开 → 从 URL hash 解码 → 解压缩 → JSON 反序列化 → 渲染贺卡
```

**没有数据库，URL 本身就是数据载体。**

### 5.2 `src/utils/storage.js` 详解

```javascript
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

// 将贺卡数据编码为 URL 安全字符串
export function encodeCardData(data) {
  const json = JSON.stringify(data);       // 对象 → JSON 字符串
  return compressToEncodedURIComponent(json); // JSON → 压缩编码
}

// 从 URL 安全字符串解码贺卡数据
export function decodeCardData(encoded) {
  try {
    const json = decompressFromEncodedURIComponent(encoded); // 解码解压
    return JSON.parse(json);              // JSON 字符串 → 对象
  } catch {
    return null;  // 解码失败返回 null
  }
}

// 生成分享链接
export function getShareUrl(cardData) {
  const encoded = encodeCardData(cardData);
  const base = window.location.origin + window.location.pathname;
  return `${base}#/card/${encoded}`;
  // 最终 URL: https://xxx.github.io/cardbir/#/card/eyJ0byI6IuW+niIs...
}

// 从当前 URL 提取贺卡数据
export function getCardFromUrl() {
  const hash = window.location.hash;
  const match = hash.match(/#\/card\/(.+)/);
  if (!match) return null;
  return decodeCardData(match[1]);
}
```

### 5.3 lz-string 原理简述

`lz-string` 是一个基于 LZ 算法的字符串压缩库。它的工作流程：

```
原始 JSON: {"to":"小明","from":"小红","date":"2001-03-15","message":"生日快乐！","themeImage":"one"}
     ↓ JSON.stringify
JSON 字符串: '{"to":"小明","from":"小红","date":"2001-03-15","message":"生日快乐！","themeImage":"one"}'
     ↓ compressToEncodedURIComponent (LZ 压缩 + URL 编码)
压缩结果: 'GYEwRMG0QzB...' (大约是原文的 30-50%)
```

**为什么选择 lz-string：**
- 压缩率高（中文 JSON 通常能压缩到 30-50%）
- 输出是 URL 安全字符（不会被 URL 编码破坏）
- 浏览器端纯 JavaScript，无依赖
- 解压速度极快

### 5.4 贺卡数据结构

```javascript
const cardData = {
  to: '小明',              // 寿星昵称
  from: '小红',            // 祝福人昵称
  date: '2001-03-15',      // 生日日期（年份固定 2001，只用月日）
  message: '生日快乐！',    // 祝福语
  themeImage: 'one',       // 主题 ID
  themeColor: '#ff6b9d',   // 主题颜色（从 ThemePicker 推导）
  images: [                // 照片墙
    { key: '1718000000-abc123.webp', caption: '合照' },
    { key: '1718000001-def456.webp', caption: '' },
  ],
  audio: { key: '1718000002-ghi789.webm' },  // 语音祝福
  music: { type: 'default', url: '/cardbir/shengri.mp3' },  // 背景音乐
  createdAt: 1718000000000,  // 创建时间戳
};
```

**学习要点：**
- `images` 中只存储 CDN key（~40 字节），不存储 base64 数据（否则 URL 会过长）
- `audio` 同理，只存 key
- `music` 有两种类型：`default`（内置，存 URL）和 `custom`（自定义，存 key）
- URL 长度通常 < 2KB，QR 码限制 4000 字符以内

---

## 6. 媒体文件上传方案

### 6.1 整体架构

```
用户选择文件
    ↓
前端压缩（图片压缩到 400px/WebP）
    ↓
FileReader 转为 base64
    ↓
GitHub Contents API (PUT)
    ↓
文件保存到 alingggsketch/cardimg 仓库的 media/ 目录
    ↓
返回文件 key（如 1718000000-abc123.webp）
    ↓
通过 jsDelivr CDN 访问：cdn.jsdelivr.net/gh/alingggsketch/cardimg@main/media/{key}
```

### 6.2 `src/utils/upload.js` 详解

```javascript
const REPO = 'alingggsketch/cardimg';  // 媒体存储仓库
const TOKEN_KEY = 'gh_upload_token';    // localStorage 中的 key

// 读取 GitHub Token
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

// 保存 GitHub Token
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

// 上传文件
export async function uploadFile(file) {
  // 1. 检查 token
  const token = getToken();
  if (!token) throw new Error('NO_TOKEN');

  // 2. 读取文件为 base64
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    //                        ↑ 去掉 "data:image/webp;base64," 前缀，只保留纯 base64
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // 3. 生成唯一文件名
  const ext = file.name.split('.').pop() || file.type.split('/')[1] || 'bin';
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  //          时间戳-6位随机字符串.扩展名
  //          例: 1718000000-abc123.webp

  // 4. 调用 GitHub API 上传
  const path = `media/${key}`;
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `upload ${key}`,  // Git commit message
      content: data,             // base64 编码的文件内容
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || '上传失败');
  }

  return { key, name: file.name };
}

// 获取媒体文件的 CDN 地址
export function getMediaUrl(key) {
  if (key.startsWith('http')) return key;  // 已经是完整 URL，直接返回
  return `https://cdn.jsdelivr.net/gh/alingggsketch/cardimg@main/media/${key}`;
}
```

### 6.3 GitHub Contents API 详解

GitHub 提供了一个 REST API，允许通过 HTTP 请求直接操作仓库中的文件：

```
PUT /repos/{owner}/{repo}/contents/{path}
```

**请求体：**
```json
{
  "message": "upload 1718000000-abc123.webp",  // Git 提交信息
  "content": "base64编码的文件内容"               // 文件内容（base64）
}
```

**响应：**
```json
{
  "content": {
    "name": "1718000000-abc123.webp",
    "path": "media/1718000000-abc123.webp",
    "sha": "abc123...",
    "download_url": "https://raw.githubusercontent.com/..."
  }
}
```

**学习要点：**
- 这个 API 本质上是在仓库中创建/更新文件并自动 commit
- 需要 Personal Access Token 认证
- Token 需要 `public_repo` 权限（公开仓库写入）
- 文件大小限制：GitHub 单文件建议 < 100MB（本项目中压缩后的图片通常 < 50KB）

### 6.4 jsDelivr CDN

[jsDelivr](https://www.jsdelivr.com/) 是一个免费的公共 CDN，支持 npm 包和 GitHub 仓库：

```
https://cdn.jsdelivr.net/gh/{user}/{repo}@{branch}/{file}
```

**优势：**
- 完全免费，无需注册
- 自动缓存，全球分发
- 在中国大陆有节点（可访问）
- GitHub 仓库推送后几分钟内生效

### 6.5 Token 存储在 localStorage 的设计

```javascript
// 存储
localStorage.setItem('gh_upload_token', 'ghp_xxxxx');

// 读取
const token = localStorage.getItem('gh_upload_token');
```

**为什么用 localStorage 而不是硬编码：**

| 方案 | 安全性 | GitHub 扫描 | 用户体验 |
|------|--------|-------------|----------|
| 硬编码在 JS 中 | ❌ Token 暴露 | ❌ 会被拦截推送 | ✅ 开箱即用 |
| localStorage | ⚠️ 仅在用户浏览器 | ✅ 代码中无 token | ⚠️ 需要首次配置 |
| 服务端代理 | ✅ Token 在服务端 | ✅ 代码中无 token | ✅ 开箱即用 |

最终选择 localStorage 方案，因为：
1. 代码中不包含 token，可以安全推送到公开仓库
2. GitHub 密钥扫描不会拦截
3. 对于个人项目来说，"首次配置一次"的代价可以接受

---

## 7. 组件详解

### 7.1 ThemePicker — 主题选择器

**文件：** `src/components/ThemePicker.jsx`

**功能：** 展示 6 个圆形主题图片，用户点击选择。

```jsx
import oneImg from '../assets/one.jpg?url';  // Vite ?url 导入

const THEMES = [
  { id: 'one', img: oneImg, color: '#ff6b9d', name: '玫瑰粉' },
  { id: 'two', img: twoImg, color: '#ff8a65', name: '珊瑚橙' },
  // ...
];

export default function ThemePicker({ value, onChange }) {
  return (
    <div className="theme-picker">
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          className={`theme-option ${value === theme.id ? 'active' : ''}`}
          onClick={() => onChange(theme.id)}
        >
          <img src={theme.img} alt={theme.name} />
          <span className="theme-name">{theme.name}</span>
        </button>
      ))}
    </div>
  );
}

// 工具函数：根据 ID 获取主题配置
export function getThemeById(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}
```

**学习要点：**
- `?url` 后缀告诉 Vite 返回文件的 URL 字符串（而不是作为模块处理）
- `getThemeById` 是一个纯函数，同时在 CreateCard 和 ViewCard 中使用
- 主题数据是"单一数据源"（Single Source of Truth），只在 ThemePicker 中定义

### 7.2 DatePicker — 日期选择器

**文件：** `src/components/DatePicker.jsx`

**功能：** iOS 风格的滚轮日期选择器，只选择月和日（年份固定为 2001）。

**核心实现：**

```jsx
const ITEM_HEIGHT = 44;      // 每个选项的高度
const VISIBLE_COUNT = 5;     // 可见选项数量
const COLUMN_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT; // 滚动容器高度

function ScrollColumn({ items, selected, onSelect, labelRef }) {
  const scrollRef = useRef(null);
  const ignoreScroll = useRef(false);

  const handleScroll = () => {
    if (ignoreScroll.current) return;
    // 计算当前滚动位置对应的选项索引
    const index = Math.round(el.scrollTop / ITEM_HEIGHT);
    // 吸附到最近的选项
    el.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
    onSelect(items[index]);
  };

  return (
    <div className="scroll-column-wrapper">
      <div className="scroll-column-label">{labelRef}</div>
      <div ref={scrollRef} className="scroll-column" onScroll={handleScroll}>
        <div className="scroll-spacer" />  {/* 上方留白 */}
        {items.map((item) => (
          <div key={item} className={`scroll-item ${item === selected ? 'active' : ''}`}>
            {item}
          </div>
        ))}
        <div className="scroll-spacer" />  {/* 下方留白 */}
      </div>
      <div className="scroll-highlight" />  {/* 选中行高亮 */}
    </div>
  );
}
```

**学习要点：**
- `scroll-spacer` 在上下各留出 2 个选项的空白，让第一项和最后一项能滚动到中间
- `ignoreScroll` 标志位防止手动点击触发 `onScroll` 回调导致循环
- `scrollTo({ behavior: 'smooth' })` 实现平滑滚动吸附
- 月份变化时自动限制日期（如 1 月 31 日切换到 2 月会自动变为 28 日）

### 7.3 ImageUploader — 图片上传器

**文件：** `src/components/ImageUploader.jsx`

**功能：** 选择图片 → 压缩 → 上传到 GitHub → 显示预览。

**图片压缩流程：**

```javascript
const compressImage = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const MAX = 400;  // 最大宽度 400px

        if (width > MAX) {
          height = (height * MAX) / width;  // 等比缩放
          width = MAX;
        }

        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);

        // 输出 WebP 格式，质量 0.3（30%）
        resolve(canvas.toDataURL('image/webp', 0.3));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
```

**学习要点：**
- 使用 Canvas API 进行图片压缩（前端最常见的方案）
- `toDataURL('image/webp', 0.3)` — WebP 格式比 JPEG 更小，0.3 质量对于贺卡缩略图足够
- 压缩后的图片通过 `fetch(dataURL).then(r => r.blob())` 转为 Blob，再构造 File 对象上传
- 最多 6 张图片限制

### 7.4 AudioRecorder — 语音录制器

**文件：** `src/components/AudioRecorder.jsx`

**功能：** 通过麦克风录音或上传音频文件。

**录音流程：**

```javascript
// 1. 获取麦克风权限
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

// 2. 创建 MediaRecorder
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/webm;codecs=opus',  // 使用 Opus 编码（压缩率高）
  bitsPerSecond: 32000,                  // 32kbps 码率
});

// 3. 收集音频数据
mediaRecorder.ondataavailable = (e) => {
  if (e.data.size > 0) chunksRef.current.push(e.data);
};

// 4. 录音结束后构造 Blob
mediaRecorder.onstop = () => {
  const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
  // 上传到 GitHub...
};

// 5. 开始录音
mediaRecorder.start();

// 6. 停止录音
mediaRecorder.stop();
stream.getTracks().forEach((t) => t.stop()); // 释放麦克风
```

**学习要点：**
- `MediaRecorder` 是浏览器原生的录音 API
- `audio/webm;codecs=opus` 是推荐的编码格式（压缩率高、兼容性好）
- 录音结束后必须 `stream.getTracks().forEach(t => t.stop())` 释放麦克风资源
- 最长录音 60 秒，通过 `setInterval` 计时

### 7.5 MusicSelector — 音乐选择器

**文件：** `src/components/MusicSelector.jsx`

**功能：** 选择内置生日歌或上传自定义音乐。

```jsx
import shengriMp3 from '../assets/shengri.mp3?url';

// 内置音乐
const handleBuiltin = () => {
  onChange({ type: 'default', url: '/cardbir/shengri.mp3', name: '生日快乐' });
};

// 自定义音乐上传
const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  const result = await uploadFile(file);
  onChange({ type: 'custom', key: result.key, name: file.name });
};
```

**音乐数据结构：**
```javascript
// 内置音乐
{ type: 'default', url: '/cardbir/shengri.mp3', name: '生日快乐' }

// 自定义音乐（上传到 GitHub）
{ type: 'custom', key: '1718000000-abc123.mp3', name: 'my-song.mp3' }
```

### 7.6 QRCodeModal — 二维码弹窗

**文件：** `src/components/QRCodeModal.jsx`

**功能：** 生成贺卡预览图 + 二维码，支持下载和复制链接。

```jsx
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';

// 生成二维码
<QRCodeSVG
  value={url}           // 贺卡链接
  size={120}            // 尺寸
  level="L"             // 纠错等级（L/M/Q/H）
  bgColor="transparent"
  fgColor="currentColor"
/>

// 下载贺卡图片
const handleDownload = async () => {
  const canvas = await html2canvas(cardRef.current, {
    backgroundColor: null,  // 透明背景
    scale: 2,               // 2 倍分辨率（高清）
    useCORS: true,           // 允许跨域图片
  });
  const link = document.createElement('a');
  link.download = `birthday-card-${name}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

// URL 过长时的降级处理
const qrResult = useMemo(() => {
  if (url.length > 4000) return { ok: false, error: 'too-long' };
  return { ok: true };
}, [url]);
```

**学习要点：**
- `html2canvas` 将 DOM 节点转为 Canvas，再转为图片下载
- `scale: 2` 生成 2 倍分辨率的图片（适配 Retina 屏幕）
- QR 码有长度限制（约 4296 字符），超过 4000 字符时显示"复制链接"降级方案
- `useCORS: true` 允许加载跨域图片（如 CDN 上的主题图片）

---

## 8. 页面详解

### 8.1 CreateCard — 创建贺卡页

**文件：** `src/pages/CreateCard.jsx`

**功能：** 完整的贺卡创建表单。

**状态管理：**

```jsx
const [form, setForm] = useState({
  to: '',           // 寿星昵称
  from: '',         // 祝福人昵称
  date: '',         // 生日日期
  message: '',      // 祝福语
  themeImage: 'one' // 主题 ID
});
const [images, setImages] = useState([]);      // 照片墙
const [audio, setAudio] = useState(null);       // 语音祝福
const [music, setMusic] = useState(null);       // 背景音乐
const [showQR, setShowQR] = useState(false);    // 是否显示二维码弹窗
const [shareUrl, setShareUrl] = useState('');    // 分享链接
const [isGenerating, setIsGenerating] = useState(false); // 生成中状态

// Token 相关
const [tokenInput, setTokenInput] = useState('');
const [hasToken, setHasToken] = useState(() => !!getToken());
```

**表单验证：**

```jsx
const isFormValid = form.to.trim() && form.from.trim() && form.date && form.message.trim();
```

**生成贺卡逻辑：**

```jsx
const handleGenerate = async () => {
  if (!isFormValid) return;
  setIsGenerating(true);

  await new Promise((r) => setTimeout(r, 300)); // 短暂延迟（体验优化）

  const cardData = {
    ...form,
    themeColor: theme.color,
    images: images.map((img) => ({ key: img.key, caption: img.caption })),
    audio: audio?.key ? { key: audio.key } : null,
    music: music?.type === 'default'
      ? { type: 'default', url: music.url }
      : music?.type === 'custom'
        ? { type: 'custom', key: music.key, name: music.name }
        : null,
    createdAt: Date.now(),
  };

  const url = getShareUrl(cardData);  // 编码到 URL
  setShareUrl(url);
  setShowQR(true);                    // 显示二维码弹窗
  setIsGenerating(false);
};
```

**学习要点：**
- 表单状态使用单一 `form` 对象 + `updateField` 函数更新（避免为每个字段写一个 state）
- `images`、`audio`、`music` 是独立的状态（因为它们的更新逻辑不同）
- 生成前先 `setTimeout(300)` 让按钮动画有时间播放
- 只存储 media key，不存储 base64 数据（保持 URL 短小）

### 8.2 ViewCard — 查看贺卡页

**文件：** `src/pages/ViewCard.jsx`

**功能：** 接收者查看贺卡的完整体验流程。

**三阶段流程：**

```
阶段 1: BirthdayGate（生日验证门）
    ↓ 输入正确生日月日
阶段 2: CountdownOverlay（倒计时动画）
    ↓ 3-2-1 + 蛋糕吹蜡烛
阶段 3: CardContent（贺卡内容）
    ↓ 照片轮播 + 语音 + 背景音乐
```

#### 阶段 1: BirthdayGate

```jsx
function BirthdayGate({ cardDate, recipientName, themeImage, themeColor, onVerified }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  // 从日期中提取 MMDD（如 "2001-03-15" → "0315"）
  const expectedMMDD = cardDate
    ? cardDate.split('-').slice(1).join('')
    : '';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === expectedMMDD) {
      onVerified();  // 验证通过
    } else {
      setError(true);
      setInput('');
      setTimeout(() => setError(false), 2000); // 2 秒后清除错误
    }
  };

  return (
    <div className="birthday-gate" style={{ backgroundImage: `url(${theme.img})` }}>
      <div className="gate-overlay" />
      <div className="gate-content">
        <h1 className="gate-title">生日快乐</h1>
        <p className="gate-name" style={{ color: themeColor }}>{recipientName}</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="输入生日(4位数)"
            value={input}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
              setInput(val);
            }}
          />
          <button type="submit" disabled={input.length !== 4}>
            打开贺卡
          </button>
        </form>
        {error && <p className="gate-error">生日不对哦，再试试吧~</p>}
      </div>
    </div>
  );
}
```

**学习要点：**
- `inputMode="numeric"` 在移动端弹出数字键盘
- `replace(/\D/g, '')` 过滤非数字字符
- 背景使用主题图片（`theme.img`），实现个性化
- 错误提示 2 秒后自动消失

#### 阶段 2: CountdownOverlay

```jsx
function CountdownOverlay({ onFinish, themeColor }) {
  const [count, setCount] = useState(3);
  const [phase, setPhase] = useState('counting'); // 'counting' | 'blow' | 'done'

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setPhase('blow');  // 切换到吹蜡烛阶段
      const timer = setTimeout(() => {
        setPhase('done');
        setTimeout(onFinish, 800);  // 淡出后触发完成回调
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [count, onFinish]);

  // 渲染：数字倒计时 → 蛋糕场景 → 彩纸效果
}
```

**学习要点：**
- 使用 `phase` 状态机管理多个动画阶段
- `useEffect` 的 cleanup 函数清除 setTimeout 防止内存泄漏
- 彩纸（confetti）使用 CSS 动画 + 随机化参数

#### 阶段 3: CardContent + 背景音乐自动播放

```jsx
export default function ViewCard() {
  const bgMusicRef = useRef(null);

  // 音频元素在 cardData 加载后就渲染（提前准备好）
  {showMusic && (
    <audio ref={bgMusicRef} src={bgMusicSrc} loop preload="auto" />
  )}

  // 验证通过时立即播放（在用户手势上下文中）
  onVerified={() => {
    setBirthdayVerified(true);
    if (bgMusicRef.current) {
      bgMusicRef.current.play().then(() => {
        setMusicPlaying(true);
      }).catch(() => {});
    }
  }}
}
```

**学习要点 — 浏览器自动播放策略：**

现代浏览器（Chrome、Safari、Firefox）都限制了音频自动播放。规则是：

> **音频只能在用户交互事件（click、touch、keydown 等）的同步调用栈中播放。**

所以：
- 在 `setTimeout` 中调用 `play()` → ❌ 被阻止
- 在 `Promise.then` 中调用 `play()` → ❌ 被阻止
- 在按钮的 `onClick` 中直接调用 `play()` → ✅ 允许

本项目中，用户点击"打开贺卡"按钮时，在 `onClick` 回调中直接调用 `bgMusicRef.current.play()`，利用了这个用户手势上下文。

#### 照片轮播

```jsx
function ImageSlideshow({ images, themeColor }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setIsVisible(false);           // 淡出
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length); // 切换图片
        setIsVisible(true);          // 淡入
      }, 500);
    }, 4000);  // 每 4 秒切换
    return () => clearInterval(timer);
  }, [images.length]);
}
```

---

## 9. 自定义 Hooks

### 9.1 `useAudioRecorder` — 录音 Hook

**文件：** `src/hooks/useAudioRecorder.js`

```jsx
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = useCallback(async (onStop) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, { /* ... */ });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      stream.getTracks().forEach((t) => t.stop()); // 释放麦克风
      if (onStop) onStop(blob);  // 回调通知录音完成
    };

    mediaRecorder.start();
  }, []);

  return {
    isRecording, audioURL, audioBlob, duration,
    maxDuration: 60,
    formattedDuration: formatDuration(duration),
    startRecording, stopRecording, clearRecording,
  };
}
```

**学习要点：**
- 自定义 Hook 的命名约定：以 `use` 开头
- 使用 `useCallback` 包裹函数，避免不必要的重渲染
- 使用 `useRef` 存储不需要触发重渲染的值（如 MediaRecorder 实例）
- `onStop` 回调模式：Hook 不负责上传，由调用者决定录音完成后做什么

---

## 10. CSS 架构与动画

### 10.1 CSS 变量系统

```css
:root {
  --bg: #fff0f3;           /* 页面背景色 */
  --surface: #ffffff;       /* 卡片/表面色 */
  --text: #1a1a2e;          /* 主文字色 */
  --text-secondary: #666;   /* 次要文字色 */
  --border: #e8e8e8;        /* 边框色 */
  --radius: 12px;           /* 圆角大小 */
  --shadow: 0 2px 12px rgba(0,0,0,0.08); /* 阴影 */
  --font: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  --font-display: Georgia, 'Noto Serif SC', serif;
}
```

**学习要点：**
- CSS 变量通过 `var(--name)` 使用
- 主题色通过 `--theme` 变量动态设置（由 JavaScript 传入 `style` 属性）
- 所有颜色、间距、圆角都用变量，便于统一修改

### 10.2 关键动画

**气球飘浮：**
```css
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(-3deg); }
  50% { transform: translateY(-20px) rotate(3deg); }
}
.balloon {
  animation: float 3s ease-in-out infinite;
  animation-delay: var(--delay);  /* 每个气球不同的延迟 */
}
```

**蛋糕蜡烛火焰：**
```css
@keyframes flicker {
  0%, 100% { transform: scaleY(1) scaleX(1); opacity: 1; }
  25% { transform: scaleY(1.2) scaleX(0.9); }
  50% { transform: scaleY(0.9) scaleX(1.1); opacity: 0.8; }
  75% { transform: scaleY(1.1) scaleX(0.95); }
}
.flame { animation: flicker 0.3s ease-in-out infinite; }
```

**彩纸飘落：**
```css
@keyframes confetti-fall {
  0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
.confetti-piece {
  left: var(--x);
  animation-delay: var(--delay);
  background-color: var(--color);
}
```

### 10.3 响应式断点

```css
/* 平板 */
@media (max-width: 640px) { /* ... */ }

/* 手机 */
@media (max-width: 480px) { /* ... */ }

/* 小屏手机 */
@media (max-width: 400px) { /* ... */ }
```

---

## 11. 构建与部署

### 11.1 Vite 构建

```bash
# 默认构建（base 为 /）
pnpm build

# GitHub Pages 构建（base 为 /cardbir/）
pnpm build:gh
# 等价于: vite build --base=/cardbir/
```

**`--base` 参数的作用：**

| 设置 | HTML 中的资源路径 | 适用场景 |
|------|-------------------|----------|
| 默认 `/` | `/assets/index.js` | 自定义域名根目录 |
| `/cardbir/` | `/cardbir/assets/index.js` | GitHub Pages 子目录 |

### 11.2 GitHub Pages 部署流程

```bash
# 1. 构建
pnpm build:gh

# 2. 进入 dist 目录，初始化 Git
cd dist
git init
git add -A
git commit -m "deploy"

# 3. 强制推送到 gh-pages 分支
git push --force https://github.com/alingggsketch/cardbir.git HEAD:gh-pages

# 4. 回到项目根目录
cd ..
```

**为什么 dist 是独立的 Git 仓库？**
- `dist/` 包含构建产物（JS、CSS、图片），不应该提交到源代码仓库
- `gh-pages` 分支只包含构建产物，用于 GitHub Pages 部署
- 每次部署都是全量替换（`--force`）

### 11.3 GitHub Pages 配置

1. 打开仓库 Settings → Pages
2. Source 选择 "Deploy from a branch"
3. Branch 选择 `gh-pages`，目录选择 `/ (root)`
4. 保存后等待几分钟，访问 `https://alingggsketch.github.io/cardbir/`

### 11.4 base path 的坑

**问题：** `public/` 目录下的文件（如 `shengri.mp3`）不会被 Vite 添加 base 前缀。

```javascript
// ❌ 错误：public/ 下的文件不会自动加 base
import.meta.env.BASE_URL + 'shengri.mp3'  // 可能解析为 /shengri.mp3

// ❌ 错误：?url 导入也不会加 base
import mp3 from '../assets/shengri.mp3?url'  // 可能解析为 /shengri-xxx.mp3

// ✅ 正确：直接硬编码 base 路径
'/cardbir/shengri.mp3'
```

---

## 12. 开发过程中遇到的问题与解决方案

### 12.1 部署相关

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| Vercel 在国内无法访问 | GFW 封锁 | 改用 GitHub Pages |
| GitHub Pages 资源 404 | base path 未配置 | `vite build --base=/cardbir/` |
| GitHub Actions 覆盖手动部署 | 自动工作流使用默认配置 | 删除 `.github/workflows/` |
| 音频文件 404 | public/ 文件路径无 base 前缀 | 硬编码 `/cardbir/shengri.mp3` |
| `import.meta.env.BASE_URL` 不生效 | Vite CLI `--base` 不影响运行时变量 | 改用硬编码路径 |

### 12.2 上传相关

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| Cloudflare Worker 超时 | `workers.dev` 域名在国内被墙 | 改用前端直传 GitHub API |
| Token 硬编码被扫描拦截 | GitHub Secret Scanning | 改用 localStorage 存储 |
| Token 被自动撤销 | GitHub 检测到泄露的 token | 不在代码中包含 token |
| `git push` 连接超时 | 全局 Git 配置了不可用的代理 | `GIT_CONFIG_COUNT=2` 临时绕过 |

### 12.3 浏览器兼容性

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 背景音乐不自动播放 | 浏览器自动播放策略 | 在用户点击事件中调用 `play()` |
| 录音失败 | 麦克风权限未授予 | `getUserMedia` 失败时提示用户检查权限 |
| QR 码生成失败 | URL 过长 | 4000 字符以上时降级为"复制链接" |

### 12.4 Git 代理问题

**问题：** 全局 Git 配置了代理 `http://127.0.0.1:7890`，但代理工具（如 Clash）未运行。

**临时绕过（不修改全局配置）：**
```bash
GIT_CONFIG_COUNT=2 \
GIT_CONFIG_KEY_0=http.proxy GIT_CONFIG_VALUE_0="" \
GIT_CONFIG_KEY_1=https.proxy GIT_CONFIG_VALUE_1="" \
git push ...
```

---

## 13. 最终架构总结

### 13.1 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                    用户浏览器                              │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │  CreateCard   │    │   ViewCard    │                   │
│  │  (创建表单)    │    │  (查看贺卡)   │                   │
│  └──────┬───────┘    └──────┬───────┘                   │
│         │                    │                            │
│    ┌────▼────┐         ┌────▼────┐                       │
│    │ upload.js│         │storage.js│                      │
│    │ (GitHub  │         │(lz-string│                      │
│    │  API)    │         │ 压缩URL) │                      │
│    └────┬────┘         └─────────┘                       │
└─────────┼────────────────────────────────────────────────┘
          │
          │ GitHub Contents API (PUT)
          ▼
┌─────────────────────────────────────────────────────────┐
│        alingggsketch/cardimg (公开仓库)                   │
│        media/ 目录存储所有上传的媒体文件                     │
└─────────────────────────────────────────────────────────┘
          │
          │ jsDelivr CDN 缓存分发
          ▼
┌─────────────────────────────────────────────────────────┐
│    cdn.jsdelivr.net/gh/alingggsketch/cardimg@main/media/ │
│    (全球 CDN，中国有节点)                                   │
└─────────────────────────────────────────────────────────┘
```

### 13.2 数据流

**创建贺卡：**
```
用户填写表单 → 选择主题 → 上传图片/音频到 GitHub
    ↓
构建 cardData 对象 → lz-string 压缩 → 编码到 URL hash
    ↓
生成分享链接 + QR 码 → 用户复制/下载/分享
```

**查看贺卡：**
```
接收者打开链接 → 从 URL hash 解码 cardData
    ↓
BirthdayGate: 输入生日月日验证
    ↓
CountdownOverlay: 3-2-1 倒计时 + 蛋糕动画
    ↓
CardContent: 加载图片(从 CDN) + 播放语音 + 背景音乐
```

### 13.3 关键技术决策回顾

| 决策 | 选择 | 原因 |
|------|------|------|
| 路由方案 | HashRouter | GitHub Pages 不支持 SPA fallback |
| 数据存储 | URL hash (lz-string) | 无需数据库，链接永久有效 |
| 媒体存储 | GitHub 仓库 + jsDelivr CDN | 免费、国内可访问、无需配置 |
| 上传方式 | 前端直传 GitHub API | 避免被密钥扫描拦截 |
| Token 存储 | localStorage | 代码中无 token，安全推送 |
| 图片压缩 | Canvas API + WebP | 浏览器原生，无需第三方库 |
| 音频编码 | MediaRecorder + Opus | 压缩率高，浏览器支持好 |
| 贺卡下载 | html2canvas | DOM 转图片的成熟方案 |

---

> **文档完成时间：** 2026-06-12
> **项目仓库：** https://github.com/alingggsketch/cardbir.git
> **图片仓库：** https://github.com/alingggsketch/cardimg.git
> **访问地址：** https://alingggsketch.github.io/cardbir/
