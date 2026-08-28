# AI 变美测试网站

这是一个适合部署到 Cloudflare Pages + Pages Functions 的 AI 变美测试网站。

前端不会直接调用 AI 或 Resend，也不会暴露 API Key。所有敏感请求都走本站后端接口：

```text
POST /api/auth/send-code
POST /api/auth/verify
POST /api/ai/analyze
```

## 部署结构

- `preview/`：前端静态页面。
- `functions/api/auth/send-code.js`：发送邮箱验证码。
- `functions/api/auth/verify.js`：验证邮箱验证码。
- `functions/api/ai/analyze.js`：AI 分析代理接口。
- `database/d1-email-auth.sql`：Cloudflare D1 邮箱验证码表结构。
- `scripts/prepare-sites-build.mjs`：构建脚本，把 `preview/` 复制到 `dist/`。
- `wrangler.toml`：Cloudflare Pages 配置，已绑定 D1 数据库 `bianmei_auth`。

## Cloudflare Pages 构建配置

```text
Framework preset: None
Build command: npm run build
Output directory: dist
Root directory: /
```

## Cloudflare 环境变量

进入 Cloudflare Pages 项目：

```text
Settings -> Environment variables
```

添加：

```text
RESEND_API_KEY=你的 Resend API Key
EMAIL_FROM=你的发件人，例如 MAKE UP <noreply@你的已验证域名>
AI_API_KEY=你的米醋或 OpenAI-compatible API Key
AI_BASE_URL=https://www.micuapi.ai/v1
AI_MODEL=gpt-5.5
```

注意：不要把任何 API Key 写进代码或提交到 Git。

## D1 数据库

你的 D1 已经写入 `wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "bianmei_auth"
database_id = "1f971de0-dfec-4a37-93d2-6626f26fc1bb"
```

因为后台提示 Bindings are managed through wrangler.toml，所以不需要在 Cloudflare 后台手动添加 D1 Binding。

建表命令：

```bash
npx wrangler d1 execute bianmei_auth --file=database/d1-email-auth.sql --remote
```

执行后会创建：

```text
email_codes
email_limits
free_analysis_clients
```

## 邮箱验证码规则

- 验证码为 6 位数字。
- 验证码有效期 10 分钟。
- 同一个邮箱 60 秒内不能重复发送。
- 每个邮箱每天最多发送 10 次。
- 验证码以 hash 存入 D1，不长期明文保存。
- 用户前 3 次可以免费成功匹配，不需要邮箱验证。
- 第 4 次开始，AI 分析前会检查该邮箱是否已经验证成功，未验证会返回 401：`免费 3 次已用完，请先完成邮箱验证`。

## 本地构建

```bash
npm install
npm run build
```

构建产物在：

```text
dist/
```

`preview/_redirects` 会被复制到 `dist/_redirects`，保证这些前端路由可直接访问：

```text
/start
/upload
/analyze
/result
/plus
/blogger
/privacy
```

## 本地预览 Functions

本地调试可以创建 `.dev.vars`：

```text
RESEND_API_KEY=你的 Resend API Key
EMAIL_FROM=MAKE UP <noreply@你的已验证域名>
AI_API_KEY=你的米醋API密钥
AI_BASE_URL=https://www.micuapi.ai/v1
AI_MODEL=gpt-5.5
```

然后运行：

```bash
npm run build
npx wrangler pages dev dist --d1 DB=bianmei_auth
```

打开：

```text
http://127.0.0.1:8788/start
```

## 上线流程

1. 确认 `wrangler.toml` 已包含你的 D1 数据库 ID。
2. 在 Cloudflare Pages 里配置 `RESEND_API_KEY`、`EMAIL_FROM`、`AI_API_KEY`、`AI_BASE_URL`、`AI_MODEL`。
3. 运行 D1 建表命令：

```bash
npx wrangler d1 execute bianmei_auth --file=database/d1-email-auth.sql --remote
```

4. 推送到 GitHub main。
5. Cloudflare Pages 会自动重新部署。
6. 打开 `https://www.bianmei.xyz/start` 测试：发送验证码 -> 输入验证码 -> 上传照片 -> 开始分析。

不再需要 VPS、Nginx、systemd 或 uvicorn。
