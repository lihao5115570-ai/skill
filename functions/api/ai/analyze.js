import { normalizeFaceProfile, validateFaceProfile, compactSentence } from "../../lib/face-profile-schema.js";
import { rankBloggers, categoryRecommendations } from "../../lib/recommendation-engine.js";
import { readUsableBloggers } from "../../lib/blogger-repository.js";

const ANALYSIS_VERSION = "user-face-profile-v1.0.0";

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

async function ensureTables(env) {
  if (!env.DB) return;
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS free_analysis_clients (
      client_id TEXT PRIMARY KEY,
      used_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS user_face_profiles (
      id TEXT PRIMARY KEY,
      image_hash TEXT,
      analysis_version TEXT NOT NULL,
      face_profile TEXT NOT NULL,
      raw_ai_result TEXT,
      model_name TEXT,
      created_at INTEGER NOT NULL,
      UNIQUE(image_hash, analysis_version)
    )`
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS recommendation_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_face_profile_id TEXT,
      blogger_id TEXT NOT NULL,
      overall_score INTEGER NOT NULL,
      dimension_scores TEXT NOT NULL,
      matched_features TEXT NOT NULL,
      different_features TEXT NOT NULL,
      algorithm_version TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`
  ).run();
}

async function getFreeQuota(env, clientId) {
  if (!env.DB) return { ok: false, status: 500, detail: "D1 DB 未绑定" };
  if (!clientId) return { ok: false, status: 401, detail: "免费次数身份缺失，请刷新页面后重试。" };
  await ensureTables(env);
  const row = await env.DB.prepare("SELECT used_count FROM free_analysis_clients WHERE client_id = ?").bind(clientId).first();
  const used = Number(row?.used_count || 0);
  if (used >= 3) return { ok: false, status: 401, detail: "免费 3 次已用完，验证邮箱后可以继续分析。" };
  return { ok: true, used, remaining: 3 - used };
}

async function consumeFreeQuota(env, clientId) {
  await ensureTables(env);
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

async function sha256(value) {
  if (!value) return "";
  const bytes = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hashBuffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function extractJsonObject(text) {
  const stripped = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
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

function extractAssistantText(data) {
  const message = data?.choices?.[0]?.message;
  const content = message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((item) => item?.text || item?.content || (typeof item === "string" ? item : "")).join("\n").trim();
  }
  if (typeof data?.choices?.[0]?.text === "string") return data.choices[0].text;
  if (typeof data?.output_text === "string") return data.output_text;
  return "";
}

function softenBeautyCopy(value) {
  if (Array.isArray(value)) return value.map(softenBeautyCopy);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, softenBeautyCopy(item)]));
  }
  if (typeof value !== "string") return value;
  return value
    .replace(/AI/g, "")
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

function fallbackMetrics(input) {
  return input.client_analysis?.metrics || {
    face_length_width_ratio: 1.18,
    jaw_cheekbone_width_ratio: 0.8,
    upper_face_cheekbone_ratio: 1,
    lower_face_ratio: 0.39,
    eye_spacing_face_width_ratio: 0.25,
    eye_aspect_ratio: 2.95,
    nose_width_ratio: 0.24,
    lip_width_ratio: 0.32,
    brow_lip_ratio: 0.37,
  };
}

function profileFromParsed(parsed, input) {
  const source = parsed?.face_profile || parsed?.FaceProfile || parsed?.result?.face_profile || parsed?.result || parsed || {};
  return normalizeFaceProfile(source, source.metrics || fallbackMetrics(input));
}

function legacyResultFields(profile, parsed, input) {
  const source = parsed?.result || parsed || {};
  const faceShapeZh = {
    oval: "鹅蛋脸",
    round: "圆脸",
    square: "方圆脸",
    long: "长形脸",
    heart: "心形脸",
    diamond: "菱形脸",
    oval_round: "鹅蛋偏圆",
    oval_long: "鹅蛋偏长",
  }[profile.face_shape] || "鹅蛋脸";
  return {
    face_shape: faceShapeZh,
    eye_shape: source.eye_shape || input.client_analysis?.eye_shape || "",
    skin_color: source.skin_color || input.client_analysis?.skin_color || "",
    style_type: source.style_type || profile.style_tendency.join("、"),
    advantage: softenBeautyCopy(compactSentence(source.advantage, "五官比例协调，适合清透自然的妆容方向。")),
    improvement: softenBeautyCopy(compactSentence(source.improvement, "更适合强调眉眼层次，并柔化轮廓边界。")),
    quality: source.quality || { passed: true, message: "照片清晰度通过，已根据本次面部比例重新生成参考博主。" },
    metrics: source.metrics || fallbackMetrics(input),
    blogger_match_tags: source.blogger_match_tags || profile.makeup_suitable_tags,
    makeup_advice: softenBeautyCopy(source.makeup_advice || []),
    report: softenBeautyCopy(source.report || ""),
  };
}

function faceProfilePrompt(text, input) {
  return [
    "请从用户照片中提取妆容参考用的 FaceProfile。必须只输出 JSON，不要 Markdown，不要解释。",
    "不要做身份识别、颜值评分、医学诊断、年龄/性别/种族等敏感判断。",
    "只允许输出字段：face_profile, result。",
    "face_profile 必须包含：face_shape, face_length_ratio, forehead_width, forehead_height, cheekbone_width, jaw_width, jaw_type, chin_type, eye_shape, eyelid_type, eye_spacing, eye_size, brow_eye_distance, midface_length, nose_type, lip_type, facial_visual_weight, feature_concentration, soft_hard_tendency, style_tendency, makeup_suitable_tags。",
    "枚举：face_shape=oval|round|square|long|heart|diamond|oval_round|oval_long；eyelid_type=single|inner_double|double；midface_length=short|medium|long；facial_visual_weight=light|medium|heavy。",
    "style_tendency 和 makeup_suitable_tags 输出英文数组，例如 clean, soft, natural, daily, eye_makeup, contour, low_saturation。",
    "result 里可以给 face_shape、advantage、improvement、quality、metrics，但用词只写面部特点、风格特征、适合参考方向、妆容适配建议。",
    "不要写：缺点、问题区域、需要改善、颜值评分、面部缺陷、下颌问题、鼻子不够立体、你最像谁、相似度。",
    text ? `用户补充：${text}` : "",
    input.client_analysis ? `前端辅助比例：${JSON.stringify(input.client_analysis)}` : "",
  ].filter(Boolean).join("\n");
}

async function callVisionModel({ apiKey, baseUrl, model, imageDataUrl, text, input, correction = "" }) {
  const prompt = correction ? `${faceProfilePrompt(text, input)}\n\n上一次输出不符合 schema，请修正：${correction}` : faceProfilePrompt(text, input);
  const content = imageDataUrl
    ? [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: imageDataUrl } }]
    : prompt;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("timeout"), 45000);
  try {
    const response = await fetch(completionsUrl(baseUrl), {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "你是审慎的妆容参考结构化分析器，只输出可解析 JSON。" },
          { role: "user", content },
        ],
        temperature: 0.2,
      }),
    });
    const raw = await response.text().catch(() => "");
    if (!response.ok) return { ok: false, status: 502, detail: `AI 接口请求失败：${raw.slice(0, 500)}` };
    const data = JSON.parse(raw);
    const assistantText = extractAssistantText(data);
    if (!assistantText) return { ok: false, status: 502, detail: "AI 返回格式异常，未找到有效内容。" };
    return { ok: true, parsed: extractJsonObject(assistantText), raw_text: assistantText, usage: data.usage || null };
  } catch (error) {
    const isTimeout = error?.name === "AbortError" || error === "timeout";
    return { ok: false, status: isTimeout ? 504 : 502, detail: isTimeout ? "AI 接口请求超时，请稍后重试。" : `AI 接口请求失败：${error?.message || error}` };
  } finally {
    clearTimeout(timeout);
  }
}

async function analyzeFaceProfile(config) {
  const first = await callVisionModel(config);
  if (!first.ok) return first;
  const firstProfile = profileFromParsed(first.parsed, config.input);
  const firstValidation = validateFaceProfile(firstProfile);
  if (firstValidation.ok) return { ...first, face_profile: firstProfile };

  const retry = await callVisionModel({ ...config, correction: firstValidation.errors.join("；") });
  if (!retry.ok) return retry;
  const retryProfile = profileFromParsed(retry.parsed, config.input);
  const retryValidation = validateFaceProfile(retryProfile);
  if (!retryValidation.ok) {
    return { ok: false, status: 502, detail: `AI 返回 FaceProfile 字段异常：${retryValidation.errors.join("；")}` };
  }
  return { ...retry, face_profile: retryProfile };
}

async function readCachedProfile(env, imageHash) {
  if (!env.DB || !imageHash) return null;
  const row = await env.DB.prepare(
    "SELECT id, face_profile, raw_ai_result FROM user_face_profiles WHERE image_hash = ? AND analysis_version = ? LIMIT 1"
  ).bind(imageHash, ANALYSIS_VERSION).first();
  if (!row) return null;
  return { id: row.id, profile: JSON.parse(row.face_profile), raw_ai_result: row.raw_ai_result };
}

async function saveProfile(env, imageHash, profile, rawText, model) {
  if (!env.DB) return `local-${Date.now()}`;
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    `INSERT OR IGNORE INTO user_face_profiles
     (id, image_hash, analysis_version, face_profile, raw_ai_result, model_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, imageHash, ANALYSIS_VERSION, JSON.stringify(profile), rawText || "", model || "", now).run();
  const row = await readCachedProfile(env, imageHash);
  return row?.id || id;
}

async function saveRecommendationLogs(env, clientId, profileId, recommendations) {
  if (!env.DB) return;
  const now = Math.floor(Date.now() / 1000);
  await Promise.all(recommendations.map((item) => env.DB.prepare(
    `INSERT INTO recommendation_logs
     (id, user_id, user_face_profile_id, blogger_id, overall_score, dimension_scores, matched_features, different_features, algorithm_version, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    crypto.randomUUID(),
    clientId || "",
    profileId || "",
    item.blogger_id,
    item.score,
    JSON.stringify(item.dimension_scores),
    JSON.stringify(item.matched_features),
    JSON.stringify(item.different_features),
    item.algorithm_version,
    now
  ).run()));
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
    if (!freeQuota.ok) return jsonResponse({ ok: false, detail: freeQuota.detail }, freeQuota.status);
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
  if (!text && !imageDataUrl) return jsonResponse({ ok: false, detail: "请上传图片或输入文字后再开始分析。" }, 400);

  await ensureTables(env);
  const imageHash = await sha256(imageDataUrl);
  const cached = await readCachedProfile(env, imageHash);
  let profile = cached?.profile;
  let profileId = cached?.id;
  let parsed = cached?.raw_ai_result ? extractJsonObject(cached.raw_ai_result) : null;
  let usedCache = Boolean(cached);

  if (!profile) {
    const analyzed = await analyzeFaceProfile({ apiKey, baseUrl, model, imageDataUrl, text, input });
    if (!analyzed.ok) return jsonResponse({ ok: false, detail: analyzed.detail }, analyzed.status || 502);
    profile = analyzed.face_profile;
    parsed = analyzed.parsed;
    profileId = await saveProfile(env, imageHash, profile, analyzed.raw_text, model);
  }

  const bloggerState = await readUsableBloggers(env);
  const recommendations = rankBloggers(profile, bloggerState.bloggers, 5);
  await saveRecommendationLogs(env, clientId, profileId, recommendations).catch((error) => {
    console.error("recommendation log error", error);
  });

  if (shouldConsumeFreeQuota && !usedCache) {
    await consumeFreeQuota(env, clientId);
  }

  return jsonResponse({
    ok: true,
    result: {
      ...legacyResultFields(profile, parsed, input),
      face_profile: profile,
      recommendations,
      category_recommendations: categoryRecommendations(recommendations),
      recommendation_source: bloggerState.source,
      recommendation_db_count: bloggerState.db_count ?? bloggerState.bloggers.length,
      analysis_version: ANALYSIS_VERSION,
      cached: usedCache,
    },
  });
}

export async function onRequestPost(context) {
  try {
    return await handleAnalyze(context);
  } catch (error) {
    console.error("analyze error", error);
    return jsonResponse({ ok: false, detail: `AI 分析服务异常：${error?.message || error || "未知错误"}` }, 500);
  }
}

export function onRequest() {
  return jsonResponse({ ok: false, detail: "Method Not Allowed" }, 405);
}
