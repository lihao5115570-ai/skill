# AI 变美测试网站

这是一个适合部署到 Cloudflare Pages + Pages Functions 的 AI 变美测试网站。

## 部署结构

- `preview/`：前端静态页面，部署到 Cloudflare Pages。
- `functions/api/ai/analyze.js`：后端 AI 代理接口，部署为 Cloudflare Pages Functions。
- `scripts/prepare-sites-build.mjs`：构建脚本，把 `preview/` 复制到 `dist/`。
- `wrangler.toml`：Cloudflare Pages 项目配置。

前端不会直接请求 AI 服务，也不会暴露 API Key。所有 AI 请求都走：

```text
POST /api/ai/analyze
```

Pages Function 会从 Cloudflare 环境变量读取：

```text
AI_API_KEY
AI_BASE_URL
AI_MODEL
```

并请求 OpenAI Chat Completions 兼容接口：

```text
POST {AI_BASE_URL}/chat/completions
```

## 米醋 API 配置

Cloudflare Pages 环境变量建议设置：

```text
AI_API_KEY=你的米醋API密钥
AI_BASE_URL=https://www.micuapi.ai/v1
AI_MODEL=gpt-5.5
```

不要把 `AI_API_KEY` 写入前端文件，也不要提交到 Git。

## Cloudflare Pages 设置

在 Cloudflare Pages 创建项目时填写：

```text
Framework preset: None
Build command: npm run build
Output directory: dist
Root directory: /
```

需要在 Cloudflare Pages 的 Settings → Environment variables 添加：

```text
AI_API_KEY
AI_BASE_URL
AI_MODEL
```

`wrangler.toml` 已经提供默认公开变量：

```toml
[vars]
AI_BASE_URL = "https://www.micuapi.ai/v1"
AI_MODEL = "gpt-5.5"
```

`AI_API_KEY` 必须在 Cloudflare 后台作为环境变量或 Secret 配置。

## 本地构建

```bash
npm install
npm run build
```

构建产物会生成在：

```text
dist/
```

## 本地预览

安装 Wrangler 后可本地预览 Pages Functions：

```bash
npm install
npx wrangler pages dev dist
```

本地测试时可创建 `.dev.vars`：

```text
AI_API_KEY=你的米醋API密钥
AI_BASE_URL=https://www.micuapi.ai/v1
AI_MODEL=gpt-5.5
```

然后打开：

```text
http://127.0.0.1:8788/start
```

## 接口格式

请求：

```http
POST /api/ai/analyze
Content-Type: application/json
```

支持图片、文字或两者同时提交：

```json
{
  "image_data_url": "data:image/jpeg;base64,...",
  "text": "我想知道适合什么妆容和博主",
  "client_analysis": {
    "metrics": {}
  }
}
```

成功响应：

```json
{
  "ok": true,
  "result": {
    "face_shape": "鹅蛋脸",
    "advantage": "五官比例协调",
    "improvement": "增强轮廓感",
    "metrics": {}
  }
}
```

失败时前端会显示明确错误，例如：

- `API Key 未配置`
- `AI接口请求失败`
- `AI接口请求超时`
- `AI返回格式异常`

## 域名

Cloudflare Pages 部署成功后，在 Pages 项目的 Custom domains 中绑定：

```text
bianmei.xyz
www.bianmei.xyz
```

不再需要 VPS、Nginx、systemd 或 uvicorn 部署。
