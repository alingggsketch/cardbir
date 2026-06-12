# 拾光祝语 — 技术方案与尝试记录

本文档记录了项目开发过程中尝试过的所有技术方案、遇到的问题及最终解决方案。

---

## 1. 项目概述

**拾光祝语** 是一个生日贺卡生成器 Web 应用，用户填写信息后生成可分享的贺卡链接，接收者打开链接查看贺卡。

**技术栈：**
- 前端：React 19 + Vite 8 + React Router DOM
- 部署：GitHub Pages（静态托管）
- 媒体存储：GitHub API + jsDelivr CDN
- 数据压缩：lz-string（将贺卡数据编码到 URL hash 中）

---

## 2. 部署方案尝试

### 2.1 Vercel 部署（初始方案 → 放弃）

**方案描述：**
- 使用 Vercel 托管前端 + Serverless API Routes 处理文件上传
- `api/upload.js` 作为 Vercel Serverless Function，接收文件并上传到 GitHub 仓库

**遇到的问题：**
- Vercel 在中国大陆被墙，无法访问
- 用户目标受众主要在国内，无法使用

**结论：** 放弃 Vercel，改用 GitHub Pages。

---

### 2.2 GitHub Pages 部署（最终方案）

**方案描述：**
- 使用 `vite build --base=/cardbir/` 构建
- 将 `dist/` 目录推送到 `gh-pages` 分支
- GitHub Pages 从 `gh-pages` 分支部署静态文件

**遇到的问题及解决：**

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 资源 404（`/src/main.jsx`） | base path 未配置 | 使用 `--base=/cardbir/` 构建 |
| 资源路径错误（`/assets/...`） | vite.config.js 的 base 被 linter 反复还原 | 不修改 vite.config.js，改用 `build:gh` 脚本传 `--base` 参数 |
| GitHub Actions 自动部署覆盖手动部署 | pages-build-deployment 工作流使用默认配置 | 删除 `.github/workflows/deploy.yml`，只用手动部署 |
| `npm ci` 失败 | GitHub Actions 找不到 package-lock.json | 改用 `npm install`（后来直接删除了 workflow） |
| 音频文件 404（`/shengri.mp3`） | 公共文件路径缺少 base 前缀 | 硬编码为 `/cardbir/shengri.mp3` |

**部署脚本：**
```bash
# package.json
"build:gh": "vite build --base=/cardbir/"

# 部署命令
rm -rf dist/.git
cd dist && git init && git add -A && git commit -m "deploy"
git push --force "https://github.com/Khao-s/cardbir.git" HEAD:gh-pages
```

**关于 `import.meta.env.BASE_URL` 的坑：**
- Vite 的 `--base` CLI 参数应该设置 `import.meta.env.BASE_URL`
- 但在实际构建中，`import.meta.env.BASE_URL` 解析为 `/` 而非 `/cardbir/`
- `new URL()` 和 `?url` 导入也不会自动添加 base 前缀
- **最终方案：** 对于需要 base 前缀的路径，直接硬编码 `/cardbir/` 前缀

---

## 3. 文件上传方案尝试

### 3.1 Vercel Serverless Function（初始方案 → 放弃）

**文件：** `api/upload.js`

**方案描述：**
- 前端将文件转为 base64，POST 到 `/api/upload`
- Vercel Serverless Function 接收后调用 GitHub API 上传到 `Khao-s/cardimg` 仓库
- Token 存储在 Vercel 环境变量中

**代码结构：**
```javascript
// api/upload.js
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
export default async function handler(req, res) {
  const { filename, mimeType, data } = req.body;
  const key = `${Date.now()}-${random}.${ext}`;
  await fetch(`https://api.github.com/repos/${REPO}/contents/media/${key}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
    body: JSON.stringify({ message: `upload ${key}`, content: data }),
  });
  return res.status(200).json({ key, name: filename });
}
```

**放弃原因：** Vercel 在国内不可用。

---

### 3.2 Cloudflare Worker（尝试 → 放弃）

**文件：** `worker/index.js` + `worker/wrangler.toml`

**方案描述：**
- 使用 Cloudflare Workers 作为无服务器上传代理
- Token 存储在 Worker 环境变量中（`wrangler secret put GITHUB_TOKEN`）
- 前端 POST 到 `https://cardbir-upload.xzihan1007.workers.dev/`

**部署步骤：**
```bash
npm install -g wrangler
wrangler login              # 浏览器授权
wrangler secret put GITHUB_TOKEN  # 设置密钥
wrangler deploy             # 部署 Worker
```

**代码结构：**
```javascript
// worker/index.js
export default {
  async fetch(request, env) {
    const { filename, mimeType, data } = await request.json();
    const key = `${Date.now()}-${random}.${ext}`;
    await fetch(`https://api.github.com/repos/${REPO}/contents/media/${key}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}` },
      body: JSON.stringify({ message: `upload ${key}`, content: data }),
    });
    return new Response(JSON.stringify({ key, name: filename }));
  },
};
```

**遇到的问题：**
- `workers.dev` 域名在中国大陆被墙（与 Vercel 同样的问题）
- `ERR_CONNECTION_TIMED_OUT`

**放弃原因：** `workers.dev` 域名在国内无法访问。可选解决方案是绑定自定义域名（自定义域名通常不被墙），但用户没有可用域名。

---

### 3.3 前端直传 GitHub API — Token 硬编码（尝试 → 放弃）

**方案描述：**
- 将 GitHub Token 通过 Vite 环境变量（`VITE_GITHUB_TOKEN`）编译进前端 JS
- 前端直接调用 GitHub API 上传文件

**代码结构：**
```javascript
// .env
VITE_GITHUB_TOKEN=ghp_xxxxxxxxxxxx

// src/utils/upload.js
const TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
  method: 'PUT',
  headers: { Authorization: `Bearer ${TOKEN}` },
  body: JSON.stringify({ message, content: base64Data }),
});
```

**遇到的问题：**
- GitHub Secret Scanning 检测到推送的代码中包含 Personal Access Token
- 推送被拒绝：`GH013: Repository rule violations found`
- 即使在 GitHub 上"允许"了该 secret，每次新推送新 token 都会被再次拦截
- GitHub 可能自动撤销被检测到的 token

**放弃原因：** GitHub 密钥扫描机制阻止将 token 推送到仓库。

---

### 3.4 前端直传 GitHub API — 用户输入 Token（最终方案）

**方案描述：**
- 用户首次使用时在页面输入 GitHub Token
- Token 存储在浏览器 `localStorage` 中
- 前端直接调用 GitHub API 上传文件
- 代码中不包含任何 token

**代码结构：**
```javascript
// src/utils/upload.js
const TOKEN_KEY = 'gh_upload_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export async function uploadFile(file) {
  const token = getToken();
  if (!token) throw new Error('NO_TOKEN');
  // ... 调用 GitHub API
}
```

**UI 组件：**
```jsx
// CreateCard.jsx 中的 token 配置区域
{!hasToken && (
  <div className="token-setup">
    <p>首次使用需配置密钥</p>
    <input type="password" placeholder="粘贴密钥" />
    <button onClick={handleSaveToken}>保存</button>
  </div>
)}
```

**优势：**
- 代码中无 token，不会被密钥扫描拦截
- Token 仅存在用户浏览器中
- 部署到 GitHub Pages 无安全问题

**注意事项：**
- Token 需要 `public_repo` 权限（仅公开仓库写入）
- Token 暴露在用户浏览器中，建议使用权限最小化的 token
- 上传目标仓库 `Khao-s/cardimg` 是公开仓库

---

## 4. 媒体文件存储与 CDN

### 4.1 存储架构

```
上传流程：
用户文件 → FileReader → base64 → GitHub API (PUT) → Khao-s/cardimg 仓库

访问流程：
贺卡数据(key) → jsDelivr CDN → GitHub 仓库文件
```

**存储仓库：** `Khao-s/cardimg`（公开仓库）
**文件路径：** `media/{timestamp}-{random}.{ext}`
**CDN 地址：** `https://cdn.jsdelivr.net/gh/Khao-s/cardimg@main/media/{key}`

### 4.2 jsDelivr CDN

- 免费、无需配置
- 自动从 GitHub 仓库拉取文件
- 有缓存，新文件可能需要几分钟才能访问
- 国内可访问（有中国节点）

### 4.3 URL 中的数据存储

贺卡数据通过 lz-string 压缩后编码到 URL hash 中：

```javascript
// 编码
const encoded = compressToEncodedURIComponent(JSON.stringify(cardData));
const url = `${base}#/card/${encoded}`;

// 解码
const json = decompressFromEncodedURIComponent(hashData);
const cardData = JSON.parse(json);
```

**数据大小分析：**
- 基础文本字段：~200 bytes
- 每个媒体文件 key：~40 bytes
- 编码后 URL 通常 < 2KB
- QR 码限制：4000 字符以内

---

## 5. 主题系统

### 5.1 方案演进

**初始方案：** 颜色选择器（ColorPicker）
- 用户选择纯色作为主题色

**最终方案：** 圆形图片选择器（ThemePicker）
- 6 个预设主题，每个有图片 + 颜色 + 名称
- 使用 `assets/one.jpg` ~ `assets/six.jpg` 作为主题缩略图
- 圆形单选按钮展示

```javascript
const THEMES = [
  { id: 'one', img: oneImg, color: '#ff6b9d', name: '玫瑰粉' },
  { id: 'two', img: twoImg, color: '#ff8a65', name: '珊瑚橙' },
  // ...
];
```

---

## 6. 生日验证门（Birthday Gate）

### 6.1 功能描述

接收者打开贺卡链接后，需要输入寿星的生日月日（4 位数字）才能查看贺卡内容。

### 6.2 实现

```javascript
// 从 cardData.date 提取 MMDD
const expectedMMDD = cardDate.split('-').slice(1).join('');

// 用户输入验证
if (input === expectedMMDD) {
  onVerified();
} else {
  setError(true);
}
```

### 6.3 倒计时动画

验证通过后播放 3-2-1 倒计时 + 蛋糕吹蜡烛动画，然后展示贺卡内容。

### 6.4 背景音乐自动播放

**问题：** 浏览器要求用户交互后才能播放音频。

**解决方案：** 在用户点击"打开贺卡"按钮的事件处理函数中立即调用 `audio.play()`：

```javascript
onVerified={() => {
  setBirthdayVerified(true);
  // 在用户手势中播放，浏览器允许
  if (bgMusicRef.current) {
    bgMusicRef.current.play().then(() => {
      setMusicPlaying(true);
    }).catch(() => {});
  }
}}
```

**关键点：**
- `<audio>` 元素必须在用户点击前就存在于 DOM 中
- `play()` 必须在用户手势事件的同步调用栈中执行
- 不能在 `setTimeout` 或 `Promise.then` 中调用（会脱离用户手势上下文）

---

## 7. 可下载贺卡

### 7.1 实现

使用 `html2canvas` 将贺卡组件截图并下载为 PNG：

```javascript
const canvas = await html2canvas(cardRef.current, {
  backgroundColor: null,
  scale: 2,
  useCORS: true,
});
const link = document.createElement('a');
link.download = `birthday-card-${name}.png`;
link.href = canvas.toDataURL('image/png');
link.click();
```

### 7.2 背景图片

可下载贺卡使用 `card.jpg` 作为背景图片（通过 Vite 的 `?url` 导入）。

---

## 8. 路由方案

### 8.1 Hash Router

使用 React Router 的 HashRouter，所有路由通过 `#` 分隔：

- `/#/` — 创建贺卡页
- `/#/card/{encoded-data}` — 查看贺卡页

**为什么不用 BrowserRouter：**
- GitHub Pages 不支持 SPA 的 History API fallback
- HashRouter 无需服务端配置，纯静态即可工作

---

## 9. 开发中遇到的坑

### 9.1 Linter/Hook 自动还原代码

**现象：** 修改的源文件被自动还原为修改前的状态。

**受影响文件：**
- `vite.config.js` — base 配置被移除
- `CreateCard.jsx` — ThemePicker 被还原为 ColorPicker
- `ViewCard.jsx` — BirthdayGate 组件被移除
- `package.json` — `build:gh` 脚本被移除

**原因：** ESLint hooks 或其他自动化工具在文件保存时触发还原。

**解决方案：** 每次修改后立即 commit，防止被还原。

### 9.2 Git 代理问题

**现象：** `git push` 失败，报错 `Failed to connect to 127.0.0.1 port 7890`。

**原因：** 全局 git 配置了 HTTP 代理（`http://127.0.0.1:7890`），但代理工具未运行。

**解决方案：**
```bash
# 方法 1：临时绕过代理
GIT_CONFIG_COUNT=2 \
GIT_CONFIG_KEY_0=http.proxy GIT_CONFIG_VALUE_0="" \
GIT_CONFIG_KEY_1=https.proxy GIT_CONFIG_VALUE_1="" \
git push ...

# 方法 2：清除本地代理配置
git config --global --unset http.proxy
git config --global --unset https.proxy
```

### 9.3 GitHub Secret Scanning

**现象：** 推送包含 token 的代码被拒绝（`GH013` 错误）。

**临时解决：** 在 GitHub 提供的链接上点击"允许"。

**根本解决：** 不在代码中嵌入 token，改用用户输入方式。

---

## 10. 最终架构总结

```
┌─────────────────────────────────────────────────┐
│                   GitHub Pages                    │
│            https://khao-s.github.io/cardbir/      │
│                                                   │
│  ┌─────────┐  ┌──────────┐  ┌─────────────────┐ │
│  │ index.html│  │  JS/CSS  │  │ shengri.mp3     │ │
│  └─────────┘  └──────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────┘
         │
         │ 用户输入 Token (localStorage)
         ▼
┌─────────────────────────────────────────────────┐
│              GitHub API (直连)                    │
│  PUT /repos/Khao-s/cardimg/contents/media/{key}  │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│         Khao-s/cardimg 仓库 (公开)                │
│              media/{files}                        │
└─────────────────────────────────────────────────┘
         │
         │ CDN 分发
         ▼
┌─────────────────────────────────────────────────┐
│     jsDelivr CDN (国内可访问)                     │
│  cdn.jsdelivr.net/gh/Khao-s/cardimg@main/media/  │
└─────────────────────────────────────────────────┘
```

**贺卡数据流：**
```
创建者填写表单 → 上传媒体到 GitHub → 生成压缩 URL → 分享链接
                                                        │
接收者打开链接 → 解压 URL 数据 → 验证生日 → 展示贺卡 ←─┘
                                       ↓
                              从 CDN 加载媒体文件
```

---

## 11. 方案对比总结

| 方案 | 适用场景 | 国内可用 | 安全性 | 复杂度 |
|------|----------|----------|--------|--------|
| Vercel Serverless | 有海外用户 | ❌ | ✅ Token 在服务端 | 低 |
| Cloudflare Worker + 自定义域名 | 有域名 | ✅ | ✅ Token 在服务端 | 中 |
| Cloudflare Worker + workers.dev | 海外用户 | ❌ | ✅ Token 在服务端 | 低 |
| 前端直传 + Token 硬编码 | 内部项目 | ✅ | ❌ Token 暴露 | 低 |
| **前端直传 + 用户输入 Token** | **个人项目** | **✅** | **⚠️ Token 在浏览器** | **低** |
