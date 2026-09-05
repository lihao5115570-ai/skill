# Database

这里放数据库 schema、迁移脚本和种子数据。

Cloudflare D1 线上需要至少执行：

```bash
npx wrangler d1 execute bianmei_auth --file=database/d1-email-auth.sql --remote
npx wrangler d1 execute bianmei_auth --file=database/d1-recommendation-engine.sql --remote
```

`d1-recommendation-engine.sql` 会创建：

- `bloggers`
- `blogger_profiles`
- `blogger_images`
- `blogger_makeup_tags`
- `user_face_profiles`
- `recommendation_logs`

正式博主推荐应优先从 `blogger_profiles` 读取已审核 FaceProfile。项目内置资料只作为 D1 为空时的过渡兜底。
