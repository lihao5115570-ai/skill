const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  });
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

async function assertVerifiedEmail(env, email) {
  if (!env.DB) {
    return { ok: false, status: 500, detail: "D1 数据库未绑定，请在 wrangler.toml 配置 DB。" };
  }

  if (!isValidEmail(email)) {
    return { ok: false, status: 401, detail: "请先完成邮箱验证。" };
  }

  const now = Math.floor(Date.now() / 1000);
  const verified = await env.DB.prepare(
    "SELECT id FROM email_codes WHERE email = ? AND verified = 1 AND expires_at > ? ORDER BY created_at DESC LIMIT 1"
  )
    .bind(email, now)
    .first();

  if (!verified) {
    return { ok: false, status: 401, detail: "请先完成邮箱验证。" };
  }

  return { ok: true };
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
      result[key] = source[key];
    }
  }
  return result;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let input;
  try {
    input = await request.json();
  } catch {
    return jsonResponse({ ok: false, detail: "请求格式异常，请提交 JSON。" }, 400);
  }

  const email = normalizeEmail(input.email || input.verified_email);
  const emailCheck = await assertVerifiedEmail(env, email);
  if (!emailCheck.ok) {
    return jsonResponse({ ok: false, detail: emailCheck.detail }, emailCheck.status);
  }

  const apiKey = env.AI_API_KEY;
  const baseUrl = env.AI_BASE_URL;
  const model = env.AI_MODEL;

  if (!apiKey) {
    return jsonResponse({ ok: false, detail: "API Key 未配置，请在 Cloudflare Pages 环境变量设置 AI_API_KEY。" }, 500);
  }
  if (!baseUrl) {
    return jsonResponse({ ok: false, detail: "AI_BASE_URL 未配置，请在 Cloudflare Pages 环境变量设置 AI_BASE_URL。" }, 500);
  }
  if (!model) {
    return jsonResponse({ ok: false, detail: "AI_MODEL 未配置，请在 Cloudflare Pages 环境变量设置 AI_MODEL。" }, 500);
  }

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

  const content = imageDataUrl
    ? [
        { type: "text", text: userPrompt },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ]
    : userPrompt;

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

  let data;
  try {
    data = await aiResponse.json();
  } catch {
    return jsonResponse({ ok: false, detail: "AI 返回格式异常，无法解析 JSON。" }, 502);
  }

  const rawText = data?.choices?.[0]?.message?.content;
  if (typeof rawText !== "string" || !rawText.trim()) {
    return jsonResponse({ ok: false, detail: "AI 返回格式异常，未找到 choices[0].message.content。" }, 502);
  }

  const parsed = extractJsonObject(rawText);
  return jsonResponse({
    ok: true,
    result: normalizeResult(parsed, input),
    raw_text: rawText,
  });
}

export function onRequest() {
  return jsonResponse({ ok: false, detail: "Method Not Allowed" }, 405);
}
