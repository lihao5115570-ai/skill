const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function completionsUrl(baseUrl) {
  return `${String(baseUrl || "").replace(/\/+$/, "")}/chat/completions`;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isAdminEmail(env, email) {
  const adminEmails = String(env.ADMIN_EMAILS || "lihao5115570@163.com")
    .split(/[,\s;]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(normalizeEmail(email));
}

function normalizeClientId(value) {
  const clientId = String(value || "").trim();
  return /^[a-zA-Z0-9_-]{12,80}$/.test(clientId) ? clientId : "";
}

async function getVerifiedEmail(env, email) {
  if (isAdminEmail(env, email)) return true;
  if (!env.DB || !isValidEmail(email)) return false;

  const now = Math.floor(Date.now() / 1000);
  const verified = await env.DB.prepare(
    "SELECT id FROM email_codes WHERE email = ? AND verified = 1 AND expires_at > ? ORDER BY created_at DESC LIMIT 1"
  )
    .bind(email, now)
    .first();

  return Boolean(verified);
}

async function ensureFreeQuotaTable(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS free_analysis_clients (
      client_id TEXT PRIMARY KEY,
      used_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`
  ).run();
}

async function getFreeQuota(env, clientId) {
  if (!env.DB) {
    return { ok: false, status: 500, detail: "D1 DB 未绑定" };
  }

  if (!clientId) {
    return { ok: false, status: 401, detail: "免费次数身份缺失，请刷新页面后重试" };
  }

  await ensureFreeQuotaTable(env);

  const row = await env.DB.prepare("SELECT used_count FROM free_analysis_clients WHERE client_id = ?")
    .bind(clientId)
    .first();
  const used = Number(row?.used_count || 0);

  if (used >= 3) {
    return { ok: false, status: 401, detail: "免费 3 次已用完，请先完成邮箱验证" };
  }

  return { ok: true, used, remaining: 3 - used };
}

async function consumeFreeQuota(env, clientId) {
  await ensureFreeQuotaTable(env);

  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    `INSERT INTO free_analysis_clients (client_id, used_count, created_at, updated_at)
     VALUES (?, 1, ?, ?)
     ON CONFLICT(client_id)
     DO UPDATE SET used_count = used_count + 1, updated_at = excluded.updated_at`
  )
    .bind(clientId, now, now)
    .run();
}

function extractJsonObject(text) {
  const stripped = String(text || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    const parsed = JSON.parse(stripped);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch (_) {
    const match = stripped.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[0]);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}

function fallbackResult(input) {
  const client = input.client_analysis || {};
  return {
    face_shape: client.face_shape || "",
    eye_shape: client.eye_shape || "",
    skin_color: client.skin_color || "",
    style_type: client.style_type || "",
    advantage: client.advantage || "",
    improvement: client.improvement || "",
    quality: client.quality || { passed: true, message: "照片质量通过，已开始匹配相似博主。" },
    metrics: client.metrics || {},
  };
}

function normalizeResult(parsed, input) {
  const result = fallbackResult(input);
  const source = parsed && typeof parsed.result === "object" ? parsed.result : parsed;
  if (!source || typeof source !== "object") return result;

  for (const key of [
    "face_shape",
    "eye_shape",
    "skin_color",
    "style_type",
    "advantage",
    "improvement",
    "quality",
    "metrics",
    "blogger_match_tags",
    "makeup_advice",
    "report",
  ]) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
      result[key] = softenBeautyCopy(source[key]);
    }
  }
  return result;
}

function softenBeautyCopy(value) {
  if (Array.isArray(value)) return value.map(softenBeautyCopy);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, softenBeautyCopy(item)]));
  }
  if (typeof value !== "string") return value;
  return value
    .replace(/缺点/g, "面部特点")
    .replace(/问题区域/g, "适合参考区域")
    .replace(/需要改善/g, "适合调整")
    .replace(/颜值评分/g, "风格参考")
    .replace(/面部缺陷/g, "面部特点")
    .replace(/下颌问题/g, "下颌线条特点")
    .replace(/鼻子不够立体/g, "面中立体感可通过妆容表达")
    .replace(/缺陷/g, "特点")
    .replace(/不足/g, "可参考点")
    .replace(/不够/g, "可以更")
    .replace(/加强/g, "更适合强调")
    .replace(/改善/g, "调整")
    .replace(/相似度/g, "适配度")
    .replace(/最像/g, "更适合参考")
    .replace(/长得像/g, "妆容参考方向接近");
}

function extractAssistantText(data) {
  const message = data?.choices?.[0]?.message;
  const content = message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item?.text === "string") return item.text;
        if (typeof item?.content === "string") return item.content;
        return "";
      })
      .join("\n")
      .trim();
  }
  if (typeof data?.choices?.[0]?.text === "string") return data.choices[0].text;
  if (typeof data?.output_text === "string") return data.output_text;
  if (Array.isArray(data?.output)) {
    return data.output
      .flatMap((item) => item?.content || [])
      .map((item) => item?.text || "")
      .join("\n")
      .trim();
  }
  return "";
}

async function handleAnalyze(context) {
  const { request, env } = context;

  let input;
  try {
    input = await request.json();
  } catch {
    return jsonResponse({ ok: false, detail: "请求格式异常，请提交 JSON。" }, 400);
  }

  const email = normalizeEmail(input.email || input.verified_email);
  const clientId = normalizeClientId(input.client_id || input.clientId);
  const emailVerified = await getVerifiedEmail(env, email);
  let shouldConsumeFreeQuota = false;

  if (!emailVerified) {
    const freeQuota = await getFreeQuota(env, clientId);
    if (!freeQuota.ok) {
      return jsonResponse({ ok: false, detail: freeQuota.detail }, freeQuota.status);
    }
    shouldConsumeFreeQuota = true;
  }

  const apiKey = env.AI_API_KEY;
  const baseUrl = env.AI_BASE_URL;
  const model = env.AI_MODEL;

  if (!apiKey) return jsonResponse({ ok: false, detail: "API Key 未配置，请在 Cloudflare Pages 环境变量设置 AI_API_KEY。" }, 500);
  if (!baseUrl) return jsonResponse({ ok: false, detail: "AI_BASE_URL 未配置，请在 Cloudflare Pages 环境变量设置 AI_BASE_URL。" }, 500);
  if (!model) return jsonResponse({ ok: false, detail: "AI_MODEL 未配置，请在 Cloudflare Pages 环境变量设置 AI_MODEL。" }, 500);

  const text = String(input.text || input.prompt || "").trim();
  const imageDataUrl = String(input.image_data_url || input.imageDataUrl || "").trim();
  if (!text && !imageDataUrl) {
    return jsonResponse({ ok: false, detail: "请上传图片或输入文字后再开始分析。" }, 400);
  }

  const userPrompt = [
    "请做 AI 变美测试分析。必须只输出 JSON，不要 Markdown。",
    "字段包括：face_shape, eye_shape, skin_color, style_type, advantage, improvement, quality, metrics, blogger_match_tags, makeup_advice, report。",
    "只做风格、比例、妆容建议；不要做身份识别、颜值打分、医疗诊断或敏感属性判断。",
    text ? `用户补充：${text}` : "",
    input.client_analysis ? `前端辅助比例：${JSON.stringify(input.client_analysis)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const safePrompt = [
    "请做女性妆容参考与面部风格分析。必须只输出 JSON，不要 Markdown。",
    "字段包括：face_shape, eye_shape, skin_color, style_type, advantage, improvement, quality, metrics, blogger_match_tags, makeup_advice, report。",
    "只做风格、比例、妆容建议；不要做身份识别、颜值打分、医疗诊断或敏感属性判断。",
    "不要写这些词：缺点、问题区域、需要改善、颜值评分、面部缺陷、下颌问题、鼻子不够立体、你最像谁、相似度。",
    "用更温和的表达：面部特点、风格特征、适合参考方向、妆容适配建议、五官特点、适合学习的妆容重点。",
    "不要强调用户长得像某个博主，只能表达：根据脸型比例和妆容风格，适合参考某类妆容博主。",
    "advantage 字段用 1 到 3 条短句描述五官特点，每条不超过 28 个中文字符。",
    "improvement 字段用 1 到 3 条短句描述适合参考方向，每条不超过 28 个中文字符，例如：更适合强调眉眼层次、适合柔化轮廓边界。",
    "blogger_match_tags 只能输出妆容学习标签，例如：脸型参考、眼妆参考、眉型参考、唇腮参考、底妆参考。",
    text ? `用户补充：${text}` : "",
    input.client_analysis ? `前端辅助比例：${JSON.stringify(input.client_analysis)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const content = imageDataUrl
    ? [
        { type: "text", text: safePrompt },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ]
    : safePrompt;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("timeout"), 45000);

  let aiResponse;
  try {
    aiResponse = await fetch(completionsUrl(baseUrl), {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "你是审慎的女性美妆成长顾问，回答必须是可解析 JSON。",
          },
          { role: "user", content },
        ],
        temperature: 0.4,
      }),
    });
  } catch (error) {
    const isTimeout = error?.name === "AbortError" || error === "timeout";
    return jsonResponse(
      {
        ok: false,
        detail: isTimeout ? "AI 接口请求超时，请稍后重试。" : `AI 接口请求失败：${error?.message || error}`,
      },
      isTimeout ? 504 : 502
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!aiResponse.ok) {
    const detail = await aiResponse.text().catch(() => `HTTP ${aiResponse.status}`);
    return jsonResponse({ ok: false, detail: `AI 接口请求失败：${detail.slice(0, 500)}` }, 502);
  }

  const responseText = await aiResponse.text().catch(() => "");
  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    return jsonResponse({ ok: false, detail: `AI 返回格式异常，无法解析 JSON：${responseText.slice(0, 300)}` }, 502);
  }

  const rawText = extractAssistantText(data);
  if (!rawText) {
    return jsonResponse({ ok: false, detail: `AI 返回格式异常，未找到有效内容：${JSON.stringify(data).slice(0, 500)}` }, 502);
  }

  if (shouldConsumeFreeQuota) {
    try {
      await consumeFreeQuota(env, clientId);
    } catch (error) {
      console.error("free quota consume error", error);
      return jsonResponse({ ok: false, detail: "免费次数记录失败，请稍后重试。" }, 500);
    }
  }

  const parsed = extractJsonObject(rawText);
  return jsonResponse({
    ok: true,
    result: normalizeResult(parsed, input),
    raw_text: rawText,
  });
}

export async function onRequestPost(context) {
  try {
    return await handleAnalyze(context);
  } catch (error) {
    console.error("analyze error", error);
    return jsonResponse(
      {
        ok: false,
        detail: `AI 分析服务异常：${error?.message || error || "未知错误"}`,
      },
      500
    );
  }
}

export function onRequest() {
  return jsonResponse({ ok: false, detail: "Method Not Allowed" }, 405);
}
