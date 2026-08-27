const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashCode(email, code, env) {
  const salt = env.RESEND_API_KEY || env.AI_API_KEY || "bianmei";
  return sha256Hex(`${email}:${code}:${salt}`);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return jsonResponse({ ok: false, detail: "D1 数据库未绑定，请在 wrangler.toml 配置 DB。" }, 500);

  let input;
  try {
    input = await request.json();
  } catch {
    return jsonResponse({ ok: false, detail: "请求格式异常，请提交 JSON。" }, 400);
  }

  const email = normalizeEmail(input.email);
  const code = String(input.code || "").trim();
  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    return jsonResponse({ ok: false, detail: "请填写正确邮箱和 6 位验证码。" }, 400);
  }

  const now = Math.floor(Date.now() / 1000);
  const record = await env.DB.prepare(
    "SELECT id, code_hash, attempts FROM email_codes WHERE email = ? AND verified = 0 AND expires_at > ? ORDER BY created_at DESC LIMIT 1"
  )
    .bind(email, now)
    .first();

  if (!record) {
    return jsonResponse({ ok: false, detail: "验证码不存在或已过期，请重新发送。" }, 400);
  }

  if (Number(record.attempts || 0) >= 5) {
    return jsonResponse({ ok: false, detail: "验证码错误次数过多，请重新发送验证码。" }, 429);
  }

  const expectedHash = await hashCode(email, code, env);
  if (expectedHash !== record.code_hash) {
    await env.DB.prepare("UPDATE email_codes SET attempts = attempts + 1 WHERE id = ?").bind(record.id).run();
    return jsonResponse({ ok: false, detail: "验证码不正确，请重新输入。" }, 400);
  }

  await env.DB.prepare("UPDATE email_codes SET verified = 1 WHERE id = ?").bind(record.id).run();
  return jsonResponse({ ok: true, email });
}

export function onRequest() {
  return jsonResponse({ ok: false, detail: "Method Not Allowed" }, 405);
}
